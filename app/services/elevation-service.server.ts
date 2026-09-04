import { setTimeout as delay } from 'node:timers/promises'
import { z } from 'zod'
import {
	calculateHeightAboveSeaLevel,
	type ElevationLookupErrorCode,
	type TerrainElevationResult,
} from '~/lib/elevation'
import { isValidLocation } from '~/lib/location'

const DEFAULT_API_URL = 'https://api.opentopodata.org/v1'
const DEFAULT_DATASETS = 'eudem25m,mapzen'
const DEFAULT_TIMEOUT_MS = 5_000
const DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1_000 // 1 day
const DEFAULT_MIN_REQUEST_INTERVAL_MS = 1_100
const MAX_CACHE_ENTRIES = 5_000
const MAX_QUEUED_REQUESTS = 5

const responseSchema = z.object({
	status: z.string(),
	error: z.string().optional(),
	results: z
		.array(
			z.object({
				elevation: z.number().finite().nullable(),
				dataset: z.string(),
				location: z.object({
					lat: z.number().finite(),
					lng: z.number().finite(),
				}),
			}),
		)
		.optional(),
})

type CacheEntry = {
	result: TerrainElevationResult
	expiresAt: number
}

const cache = new Map<string, CacheEntry>()
const inFlight = new Map<string, Promise<TerrainElevationResult>>()

let requestQueue: Promise<void> = Promise.resolve()
let nextRequestAt = 0
let queuedRequestCount = 0

export class ElevationLookupError extends Error {
	constructor(
		public readonly code: ElevationLookupErrorCode,
		message: string,
	) {
		super(message)
		this.name = 'ElevationLookupError'
	}
}

function parsePositiveInteger(value: string | undefined, fallback: number) {
	const parsed = Number(value)

	return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback
}

function coordinateCacheKey(latitude: number, longitude: number) {
	return `${latitude.toFixed(5)},${longitude.toFixed(5)}` // meter-level precision
}

function datasetMetadata(dataset: string) {
	if (dataset.startsWith('eudem')) {
		return {
			datum: 'EVRS2000',
			attribution: 'OpenTopoData / EU-DEM / Copernicus',
		}
	}

	if (dataset.startsWith('srtm')) {
		return {
			datum: 'EGM96',
			attribution: 'OpenTopoData / NASA SRTM',
		}
	}

	if (dataset === 'mapzen') {
		return {
			datum: 'EGM96',
			attribution: 'OpenTopoData / Mapzen terrain data',
		}
	}

	return { datum: null, attribution: null }
}

function pruneCache(now: number) {
	for (const [key, entry] of cache) {
		if (entry.expiresAt <= now) cache.delete(key)
	}

	while (cache.size >= MAX_CACHE_ENTRIES) {
		const oldestKey = cache.keys().next().value
		if (typeof oldestKey !== 'string') break
		cache.delete(oldestKey)
	}
}

async function withRateLimit<T>(operation: () => Promise<T>): Promise<T> {
	if (queuedRequestCount >= MAX_QUEUED_REQUESTS) {
		throw new ElevationLookupError(
			'rate_limited',
			'The elevation lookup queue is full.',
		)
	}

	queuedRequestCount += 1

	let releaseQueue!: () => void
	const previousRequest = requestQueue
	requestQueue = new Promise<void>((resolve) => {
		releaseQueue = resolve
	})
	let queueReleased = false

	try {
		await previousRequest

		const waitMs = Math.max(0, nextRequestAt - Date.now())
		if (waitMs > 0) await delay(waitMs)

		const minIntervalMs = parsePositiveInteger(
			process.env.OPENTOPO_DATA_MIN_INTERVAL_MS,
			DEFAULT_MIN_REQUEST_INTERVAL_MS,
		)
		nextRequestAt = Date.now() + minIntervalMs
		queuedRequestCount -= 1
		releaseQueue()
		queueReleased = true

		return await operation()
	} finally {
		if (!queueReleased) {
			queuedRequestCount -= 1
			releaseQueue()
		}
	}
}

async function requestElevation(
	latitude: number,
	longitude: number,
): Promise<TerrainElevationResult> {
	if (
		process.env.NODE_ENV === 'production' &&
		!process.env.OPENTOPO_DATA_API_URL
	) {
		throw new ElevationLookupError(
			'upstream_error',
			'OPENTOPO_DATA_API_URL must be configured.',
		)
	}

	const apiUrl = (process.env.OPENTOPO_DATA_API_URL ?? DEFAULT_API_URL).replace(
		/\/$/,
		'',
	)
	const dataset = process.env.OPENTOPO_DATA_DATASET ?? DEFAULT_DATASETS
	const datasetPath = dataset.split(',').map(encodeURIComponent).join(',')
	const url = new URL(`${apiUrl}/${datasetPath}`)
	url.searchParams.set('locations', `${latitude},${longitude}`)

	const controller = new AbortController()
	const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)

	try {
		const response = await fetch(url, {
			headers: { Accept: 'application/json' },
			signal: controller.signal,
		})

		if (response.status === 429) {
			throw new ElevationLookupError(
				'rate_limited',
				'OpenTopoData rate limit reached.',
			)
		}

		if (!response.ok) {
			throw new ElevationLookupError(
				'upstream_error',
				`OpenTopoData responded with HTTP ${response.status}.`,
			)
		}

		const parsed = responseSchema.safeParse(await response.json())

		if (!parsed.success || parsed.data.status !== 'OK') {
			throw new ElevationLookupError(
				'invalid_response',
				'OpenTopoData returned an invalid response.',
			)
		}

		const firstResult = parsed.data.results?.[0]

		if (!firstResult || firstResult.elevation === null) {
			throw new ElevationLookupError(
				'unavailable',
				'No elevation is available for this location.',
			)
		}

		return {
			elevation: firstResult.elevation,
			dataset: firstResult.dataset,
			...datasetMetadata(firstResult.dataset),
			latitude,
			longitude,
		}
	} catch (error) {
		if (error instanceof ElevationLookupError) throw error

		if (controller.signal.aborted) {
			throw new ElevationLookupError(
				'timeout',
				'OpenTopoData did not respond in time.',
			)
		}

		throw new ElevationLookupError(
			'upstream_error',
			'OpenTopoData could not be reached.',
		)
	} finally {
		clearTimeout(timeout)
	}
}

export function getTerrainElevation(
	latitude: number,
	longitude: number,
): Promise<TerrainElevationResult> {
	if (!isValidLocation({ latitude, longitude })) {
		return Promise.reject(
			new ElevationLookupError(
				'invalid_location',
				'Latitude or longitude is invalid.',
			),
		)
	}

	const key = coordinateCacheKey(latitude, longitude)
	const now = Date.now()
	const cached = cache.get(key)

	if (cached && cached.expiresAt > now) {
		return Promise.resolve({ ...cached.result, latitude, longitude })
	}

	const pending = inFlight.get(key)
	if (pending) {
		return pending.then((result) => ({ ...result, latitude, longitude }))
	}

	pruneCache(now)

	const request = withRateLimit(() => requestElevation(latitude, longitude))
		.then((result) => {
			cache.set(key, {
				result,
				expiresAt: Date.now() + DEFAULT_CACHE_TTL_MS,
			})

			return result
		})
		.finally(() => inFlight.delete(key))

	inFlight.set(key, request)

	return request.then((result) => ({ ...result, latitude, longitude }))
}

export async function resolveDeviceHeightAboveSeaLevel(
	latitude: number,
	longitude: number,
	heightAboveGround: number,
) {
	const terrainElevation = await getTerrainElevation(latitude, longitude)

	return {
		heightAboveSeaLevel: calculateHeightAboveSeaLevel(
			terrainElevation.elevation,
			heightAboveGround,
		),
		dataset: terrainElevation.dataset,
	}
}
