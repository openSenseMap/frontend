import postgres, { type JSONValue, type Sql } from 'postgres'
import { canonicalValue } from './canonical'
import {
	type MigratedMqttIntegration,
	type MigratedTtnIntegration,
} from './types'

type IntegrationKind = 'mqtt' | 'ttn'

function json(value: unknown): JSONValue {
	return value as JSONValue
}

export class IntegrationTarget {
	private readonly sql: Sql<Record<string, unknown>>

	constructor(
		url: string,
		ssl: boolean,
		private readonly kind: IntegrationKind,
		private readonly dryRun: boolean,
	) {
		this.sql = postgres(url, {
			ssl,
			max: 3,
			connect_timeout: 120,
			connection: {
				application_name: `opensensemap-vnext-${kind}-migration`,
				options: '-c timezone=UTC -c search_path=public',
			},
		})
	}

	async connect() {
		await this.sql`SELECT 1`
	}

	async close() {
		await this.sql.end({ timeout: 10 })
	}

	async inspect() {
		const table = this.kind === 'mqtt' ? 'mqtt_integration' : 'ttn_integration'
		const enumName =
			this.kind === 'mqtt' ? 'mqtt_message_format' : 'ttn_profile'
		const [row] = await this.sql<
			Array<{
				tableExists: boolean
				enumValues: string[]
				columns: string[]
				uniqueDeviceId: boolean
			}>
		>`
			SELECT
				to_regclass(${`public.${table}`}) IS NOT NULL AS "tableExists",
				COALESCE((
					SELECT array_agg(e.enumlabel ORDER BY e.enumsortorder)
					FROM pg_type t
					JOIN pg_namespace n ON n.oid = t.typnamespace
					JOIN pg_enum e ON e.enumtypid = t.oid
					WHERE n.nspname = 'public' AND t.typname = ${enumName}
				), ARRAY[]::text[]) AS "enumValues",
				COALESCE((
					SELECT array_agg(column_name ORDER BY ordinal_position)
					FROM information_schema.columns
					WHERE table_schema = 'public' AND table_name = ${table}
				), ARRAY[]::text[]) AS columns,
				EXISTS (
					SELECT 1 FROM pg_index i
					JOIN pg_class c ON c.oid = i.indrelid
					JOIN pg_namespace n ON n.oid = c.relnamespace
					WHERE n.nspname = 'public' AND c.relname = ${table}
					  AND i.indisunique AND i.indisvalid
					  AND i.indpred IS NULL AND i.indexprs IS NULL
					  AND ARRAY(
						SELECT a.attname
						FROM unnest(i.indkey) WITH ORDINALITY key(attnum, position)
						JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = key.attnum
						ORDER BY key.position
					  ) = ARRAY['device_id']::name[]
				) AS "uniqueDeviceId"
		`
		return (
			row ?? {
				tableExists: false,
				enumValues: [],
				columns: [],
				uniqueDeviceId: false,
			}
		)
	}

	async assertEmpty() {
		const table = this.kind === 'mqtt' ? 'mqtt_integration' : 'ttn_integration'
		const rows = await this.sql.unsafe<Array<{ deviceId: string }>>(
			`SELECT device_id AS "deviceId" FROM ${table}`,
		)
		if (rows.length > 0) {
			throw new Error(`${this.kind.toUpperCase()} target is not empty`)
		}
	}

	async assertResumable(expectedDeviceIds: ReadonlySet<string>) {
		const table = this.kind === 'mqtt' ? 'mqtt_integration' : 'ttn_integration'
		const rows = await this.sql.unsafe<Array<{ deviceId: string }>>(
			`SELECT device_id AS "deviceId" FROM ${table}`,
		)
		const unexpected = rows
			.map((row) => row.deviceId)
			.filter((deviceId) => !expectedDeviceIds.has(deviceId))
			.sort()
		if (unexpected.length > 0) {
			throw new Error(
				`${this.kind.toUpperCase()} resume target contains unexpected device IDs: ${unexpected.slice(0, 20).join(', ')}`,
			)
		}
	}

	async insertMqtt(integration: MigratedMqttIntegration, cutoff: Date) {
		if (this.kind !== 'mqtt') throw new Error('Not an MQTT target')
		if (this.dryRun) return
		const inserted = await this.sql<Array<{ deviceId: string }>>`
			INSERT INTO mqtt_integration (
				id, device_id, enabled, url, topic, message_format,
				decode_options, connection_options, created_at, updated_at
			) VALUES (
				${integration.id}, ${integration.deviceId}, ${integration.enabled},
				${integration.url}, ${integration.topic}, ${integration.messageFormat},
				${
					integration.decodeOptions
						? this.sql.json(json(integration.decodeOptions))
						: null
				},
				${
					integration.connectionOptions
						? this.sql.json(json(integration.connectionOptions))
						: null
				},
				${cutoff}, ${cutoff}
			)
			ON CONFLICT (device_id) DO NOTHING
			RETURNING device_id AS "deviceId"
		`
		if (inserted.length === 0) {
			const [existing] = await this.sql<Array<Record<string, unknown>>>`
				SELECT id, enabled, url, topic, message_format AS "messageFormat",
					decode_options AS "decodeOptions",
					connection_options AS "connectionOptions",
					created_at AS "createdAt", updated_at AS "updatedAt"
				FROM mqtt_integration WHERE device_id = ${integration.deviceId}
			`
			const { deviceId: _deviceId, ...expectedIntegration } = integration
			const expected = {
				...expectedIntegration,
				createdAt: cutoff,
				updatedAt: cutoff,
			}
			if (canonicalValue(existing) !== canonicalValue(expected)) {
				throw new Error(
					`Existing MQTT integration for ${integration.deviceId} does not match source`,
				)
			}
			return 'existing' as const
		}
		return 'inserted' as const
	}

	async insertTtn(integration: MigratedTtnIntegration, cutoff: Date) {
		if (this.kind !== 'ttn') throw new Error('Not a TTN target')
		if (this.dryRun) return
		const inserted = await this.sql<Array<{ deviceId: string }>>`
			INSERT INTO ttn_integration (
				id, device_id, enabled, dev_id, app_id, port, profile,
				decode_options, created_at, updated_at
			) VALUES (
				${integration.id}, ${integration.deviceId}, ${integration.enabled},
				${integration.devId}, ${integration.appId}, ${integration.port},
				${integration.profile},
				${
					integration.decodeOptions
						? this.sql.json(json(integration.decodeOptions))
						: null
				},
				${cutoff}, ${cutoff}
			)
			ON CONFLICT (device_id) DO NOTHING
			RETURNING device_id AS "deviceId"
		`
		if (inserted.length === 0) {
			const [existing] = await this.sql<Array<Record<string, unknown>>>`
				SELECT id, enabled, dev_id AS "devId", app_id AS "appId", port,
					profile, decode_options AS "decodeOptions",
					created_at AS "createdAt", updated_at AS "updatedAt"
				FROM ttn_integration WHERE device_id = ${integration.deviceId}
			`
			const { deviceId: _deviceId, ...expectedIntegration } = integration
			const expected = {
				...expectedIntegration,
				createdAt: cutoff,
				updatedAt: cutoff,
			}
			if (canonicalValue(existing) !== canonicalValue(expected)) {
				throw new Error(
					`Existing TTN integration for ${integration.deviceId} does not match source`,
				)
			}
			return 'existing' as const
		}
		return 'inserted' as const
	}

	async disableDevices(deviceIds: string[], cutoff: Date) {
		if (this.dryRun || deviceIds.length === 0) return
		const table = this.kind === 'mqtt' ? 'mqtt_integration' : 'ttn_integration'
		await this.sql.unsafe(
			`UPDATE ${table} SET enabled = false, updated_at = $2::timestamptz WHERE device_id = ANY($1::text[])`,
			[deviceIds, cutoff.toISOString()],
		)
	}

	async configurationRows(): Promise<
		Array<{ deviceId: string; value: Record<string, unknown> }>
	> {
		if (this.kind === 'mqtt') {
			const rows = await this.sql<
				Array<{
					id: string
					deviceId: string
					enabled: boolean
					url: string
					topic: string
					messageFormat: string
					decodeOptions: unknown
					connectionOptions: unknown
					createdAt: Date
					updatedAt: Date
				}>
			>`
				SELECT id, device_id AS "deviceId", enabled, url, topic,
					message_format AS "messageFormat",
					decode_options AS "decodeOptions",
					connection_options AS "connectionOptions",
					created_at AS "createdAt", updated_at AS "updatedAt"
				FROM mqtt_integration
			`
			return rows.map(({ deviceId, ...value }) => ({ deviceId, value }))
		}
		const rows = await this.sql<
			Array<{
				id: string
				deviceId: string
				enabled: boolean
				devId: string
				appId: string
				port: number | null
				profile: string
				decodeOptions: unknown
				createdAt: Date
				updatedAt: Date
			}>
		>`
			SELECT id, device_id AS "deviceId", enabled,
				dev_id AS "devId", app_id AS "appId", port, profile,
				decode_options AS "decodeOptions",
				created_at AS "createdAt", updated_at AS "updatedAt"
			FROM ttn_integration
		`
		return rows.map(({ deviceId, ...value }) => ({ deviceId, value }))
	}

	async invalidCount() {
		if (this.kind === 'mqtt') {
			const [row] = await this.sql<Array<{ count: string }>>`
				SELECT count(*)::text AS count
				FROM mqtt_integration
				WHERE btrim(url) = '' OR btrim(topic) = ''
				   OR (decode_options IS NOT NULL AND json_typeof(decode_options) <> 'object')
				   OR (connection_options IS NOT NULL AND json_typeof(connection_options) <> 'object')
			`
			return Number(row.count)
		}
		const [row] = await this.sql<Array<{ count: string }>>`
			SELECT count(*)::text AS count
			FROM ttn_integration
			WHERE btrim(dev_id) = '' OR btrim(app_id) = '' OR port < 0
			   OR (decode_options IS NOT NULL AND json_typeof(decode_options) <> 'array')
		`
		return Number(row.count)
	}
}
