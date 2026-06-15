import { and, desc, eq } from 'drizzle-orm'
import { drizzleClient } from '~/db.server'
import { deviceSchema, deviceSchemaVersion } from '~/db/schema'
import {
	uploadedDeviceSchemaV1,
	type UploadedDeviceSchemaV1,
} from '~/lib/device-schemas/device-schema-v1'
import {
	createDeviceSchemaHash,
	slugifyDeviceSchemaName,
} from '~/lib/device-schemas/util'

export type StoredDeviceSchemaVersion = {
	id: string
	deviceSchemaId: string
	version: string
	formatVersion: string
	content: UploadedDeviceSchemaV1
	hash: string
	schemaSlug: string
	schemaName: string
}

export async function createOrReusePrivateDeviceSchemaVersionFromUpload(
	tx: any,
	userId: string,
	input: unknown,
): Promise<StoredDeviceSchemaVersion> {
	const parsedSchema = uploadedDeviceSchemaV1.parse(input)
	const hash = createDeviceSchemaHash(parsedSchema)

	const [existingVersion] = await tx
		.select({
			id: deviceSchemaVersion.id,
			deviceSchemaId: deviceSchemaVersion.deviceSchemaId,
			version: deviceSchemaVersion.version,
			formatVersion: deviceSchemaVersion.formatVersion,
			content: deviceSchemaVersion.content,
			hash: deviceSchemaVersion.hash,
			schemaSlug: deviceSchema.slug,
			schemaName: deviceSchema.name,
		})
		.from(deviceSchemaVersion)
		.innerJoin(
			deviceSchema,
			eq(deviceSchema.id, deviceSchemaVersion.deviceSchemaId),
		)
		.where(
			and(
				eq(deviceSchema.ownerUserId, userId),
				eq(deviceSchemaVersion.hash, hash),
			),
		)
		.limit(1)

	if (existingVersion) return existingVersion

	const slugBase = slugifyDeviceSchemaName(parsedSchema.name)
	const slug = `${slugBase}-${hash.slice(0, 8)}`

	const [createdSchema] = await tx
		.insert(deviceSchema)
		.values({
			slug,
			name: parsedSchema.name,
			description: parsedSchema.description ?? null,
			tags: parsedSchema.tags ?? [],
			ownerUserId: userId,
			visibility: 'private',
			isOfficial: false,
		})
		.returning()

	if (!createdSchema) throw new Error('Failed to create device schema.')

	const [createdVersion] = await tx
		.insert(deviceSchemaVersion)
		.values({
			deviceSchemaId: createdSchema.id,
			version: parsedSchema.version,
			formatVersion: parsedSchema.schemaVersion,
			content: parsedSchema,
			hash,
			status: 'published',
			createdByUserId: userId,
			publishedAt: new Date(),
		})
		.returning()

	if (!createdVersion)
		throw new Error('Failed to create device schema version.')

	return {
		id: createdVersion.id,
		deviceSchemaId: createdVersion.deviceSchemaId,
		version: createdVersion.version,
		formatVersion: createdVersion.formatVersion,
		content: createdVersion.content,
		hash: createdVersion.hash,
		schemaSlug: createdSchema.slug,
		schemaName: createdSchema.name,
	}
}

export async function getPublicDeviceSchemasForUser(userId: string) {
	return drizzleClient
		.select({
			id: deviceSchema.id,
			slug: deviceSchema.slug,
			name: deviceSchema.name,
			description: deviceSchema.description,
			tags: deviceSchema.tags,
			createdAt: deviceSchema.createdAt,
			versionId: deviceSchemaVersion.id,
			version: deviceSchemaVersion.version,
			formatVersion: deviceSchemaVersion.formatVersion,
			hash: deviceSchemaVersion.hash,
			publishedAt: deviceSchemaVersion.publishedAt,
			content: deviceSchemaVersion.content,
		})
		.from(deviceSchema)
		.innerJoin(
			deviceSchemaVersion,
			eq(deviceSchemaVersion.deviceSchemaId, deviceSchema.id),
		)
		.where(
			and(
				eq(deviceSchema.ownerUserId, userId),
				eq(deviceSchema.visibility, 'public'),
				eq(deviceSchemaVersion.status, 'published'),
			),
		)
		.orderBy(desc(deviceSchemaVersion.publishedAt))
}

export async function getSharedDeviceSchemaVersion(versionId: string) {
	const [schemaVersion] = await drizzleClient
		.select({
			slug: deviceSchema.slug,
			name: deviceSchema.name,
			visibility: deviceSchema.visibility,
			version: deviceSchemaVersion.version,
			content: deviceSchemaVersion.content,
		})
		.from(deviceSchemaVersion)
		.innerJoin(
			deviceSchema,
			eq(deviceSchema.id, deviceSchemaVersion.deviceSchemaId),
		)
		.where(
			and(
				eq(deviceSchemaVersion.id, versionId),
				eq(deviceSchema.visibility, 'public'),
				eq(deviceSchemaVersion.status, 'published'),
			),
		)
		.limit(1)

	return schemaVersion
}
