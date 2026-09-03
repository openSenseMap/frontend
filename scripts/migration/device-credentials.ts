import { randomBytes } from 'node:crypto'
import { type MigrationDependencies } from './context'
import {
	type LegacyBox,
	type MigrationConfig,
	type SourceSnapshot,
} from './types'

/** Returns a non-empty legacy device token, or null when no token can be preserved. */
export function legacyAccessToken(box: LegacyBox) {
	return typeof box.access_token === 'string' && box.access_token.length > 0
		? box.access_token
		: null
}

/**
 * Preserves the legacy credential when possible and creates a key only for devices
 * that did not previously require authentication.
 */
export function selectDeviceApiKey(box: LegacyBox) {
	const token = legacyAccessToken(box)
	if (token) return token
	if (box.useAuth === true) {
		throw new Error('Authenticated legacy device has no usable access token')
	}

	return randomBytes(32).toString('base64url')
}

/**
 * Inventories authenticated devices and token reuse before any business rows are
 * copied so credentials are never silently dropped or made ambiguous.
 */
export function authenticatedCredentialInventory(snapshot: SourceSnapshot) {
	const authenticatedDeviceIds: string[] = []
	const missingDeviceIds: string[] = []
	const devicesByToken = new Map<string, string[]>()

	for (const deviceId of [...snapshot.migratableDeviceIds].sort()) {
		const box = snapshot.boxById.get(deviceId)!
		const token = legacyAccessToken(box)
		if (box.useAuth === true) authenticatedDeviceIds.push(deviceId)
		if (!token) {
			if (box.useAuth === true) missingDeviceIds.push(deviceId)
			continue
		}
		const owners = devicesByToken.get(token) ?? []
		owners.push(deviceId)
		devicesByToken.set(token, owners)
	}

	return {
		authenticatedDeviceIds,
		missingDeviceIds,
		duplicateDeviceGroups: [...devicesByToken.values()].filter(
			(deviceIds) => deviceIds.length > 1,
		),
	}
}

/**
 * Enforces the preserve-in-place API-key policy and records actionable rejections
 * before failing preflight on missing or shared authenticated credentials.
 */
export async function validateApiKeyPolicy(
	config: MigrationConfig,
	dependencies: MigrationDependencies,
	snapshot: SourceSnapshot,
) {
	const inventory = authenticatedCredentialInventory(snapshot)
	Object.assign(dependencies.report.preflight, {
		apiKeyPolicy: {
			mode: 'preserve',
			authenticatedDevices: inventory.authenticatedDeviceIds.length,
		},
	})

	for (const deviceId of inventory.missingDeviceIds) {
		await dependencies.app.reject(config.runId, {
			phase: 'preflight',
			sourceCollection: 'boxes',
			sourceId: deviceId,
			code: 'authenticated_device_missing_access_token',
		})
	}
	for (const deviceIds of inventory.duplicateDeviceGroups) {
		for (const deviceId of deviceIds) {
			await dependencies.app.reject(config.runId, {
				phase: 'preflight',
				sourceCollection: 'boxes',
				sourceId: deviceId,
				code: 'duplicate_legacy_device_access_token',
				details: { deviceIds },
			})
		}
	}
	if (
		inventory.missingDeviceIds.length > 0 ||
		inventory.duplicateDeviceGroups.length > 0
	) {
		dependencies.report.warn({
			severity: 'high',
			code: 'legacy_device_access_tokens_cannot_be_preserved',
			missingTokenDeviceIds: inventory.missingDeviceIds.slice(0, 100),
			duplicateTokenDeviceGroups: inventory.duplicateDeviceGroups
				.slice(0, 100)
				.map((deviceIds) => deviceIds.slice(0, 100)),
		})
		throw new Error(
			'Legacy device access tokens cannot be preserved safely; resolve the reported device IDs before migrating',
		)
	}
}

/** Reports devices whose non-empty legacy access token was not preserved exactly. */
export function preservedApiKeyMismatches(
	snapshot: SourceSnapshot,
	actual: ReadonlyMap<string, string | null>,
) {
	return [...snapshot.migratableDeviceIds]
		.filter((deviceId) => {
			const token = legacyAccessToken(snapshot.boxById.get(deviceId)!)
			return token !== null && actual.get(deviceId) !== token
		})
		.sort()
}
