import { setTimeout as delay } from 'node:timers/promises'
import { z } from 'zod'
import {
	type ElevationLookupErrorCode,
	type TerrainElevationResult,
} from '~/lib/elevation'
import { isValidLocation } from '~/lib/location'

const DEFAULT_API_URL = 'https://api-eu.gpxz.io/v1/elevation/otd-compat'
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
				elevation: z.number().finite(),
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
	return { datum: 'EGM2008', attribution: 'GPXZ elevation dataset ' + dataset }
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
			process.env.GPXZ_MIN_INTERVAL_MS,
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
	if (process.env.NODE_ENV === 'production' && !process.env.GPXZ_API_URL) {
		throw new ElevationLookupError(
			'upstream_error',
			'GPXZ_API_URL must be configured.',
		)
	}
	if (!process.env.GPXZ_API_KEY) {
		throw new ElevationLookupError(
			'upstream_error',
			'GPXZ_API_KEY must be configured.',
		)
	}

	const apiUrl = (process.env.GPXZ_API_URL ?? DEFAULT_API_URL).replace(
		/\/$/,
		'',
	)
	const url = new URL(`${apiUrl}`)
	url.searchParams.set('locations', `${latitude},${longitude}`)

	const api_key = process.env.GPXZ_API_KEY

	const controller = new AbortController()
	const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)

	try {
		const headers: Record<string, string> = {
			Accept: 'application/json',
			'x-api-key': api_key ?? '',
		}

		const response = await fetch(url, {
			headers: headers,
			signal: controller.signal,
		})

		if (response.status === 429) {
			throw new ElevationLookupError('rate_limited', 'GPXZ rate limit reached.')
		}

		if (!response.ok) {
			throw new ElevationLookupError(
				'upstream_error',
				`GPXZ responded with HTTP ${response.status}.`,
			)
		}

		const parsed = responseSchema.safeParse(await response.json())

		if (!parsed.success || parsed.data.status !== 'OK') {
			throw new ElevationLookupError(
				'invalid_response',
				'GPXZ returned an invalid response.',
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
				'GPXZ api did not respond in time.',
			)
		}

		throw new ElevationLookupError(
			'upstream_error',
			'GPXZ api could not be reached.',
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
