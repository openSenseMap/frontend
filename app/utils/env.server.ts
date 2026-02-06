import { z } from 'zod'

const schema = z.object({
	NODE_ENV: z.enum(['production', 'development', 'test'] as const),
	DATABASE_URL: z.string(),
	PG_CLIENT_SSL: z.string(),
	SESSION_SECRET: z.string(),
	MAPBOX_GEOCODING_API: z.string().url(),
	MAPBOX_ACCESS_TOKEN: z.string(),
	OSEM_API_URL: z.string().url(),
	DIRECTUS_URL: z.string().url(),
	SENSORWIKI_API_URL: z.string().url(),
	MYBADGES_API_URL: z.string().url(),
	MYBADGES_URL: z.string().url(),
	MYBADGES_SERVERADMIN_USERNAME: z.string(),
	MYBADGES_SERVERADMIN_PASSWORD: z.string(),
	MYBADGES_ISSUERID_OSEM: z.string(),
	MYBADGES_CLIENT_ID: z.string(),
	MYBADGES_CLIENT_SECRET: z.string(),
})

declare global {
	namespace NodeJS {
		interface ProcessEnv extends z.infer<typeof schema> {}
	}
}

export function init() {
	const parsed = schema.safeParse(process.env)

	if (parsed.success === false) {
		console.error(
			'❌ Invalid environment variables:',
			parsed.error.flatten().fieldErrors,
		)
	}
}

export function getEnv() {
	return {
		MODE: process.env.NODE_ENV,
		MAPBOX_GEOCODING_API: process.env.MAPBOX_GEOCODING_API,
		MAPBOX_ACCESS_TOKEN: process.env.MAPBOX_ACCESS_TOKEN,
		DIRECTUS_URL: process.env.DIRECTUS_URL,
		MYBADGES_API_URL: process.env.MYBADGES_API_URL,
		MYBADGES_URL: process.env.MYBADGES_URL,
		SENSORWIKI_API_URL: process.env.SENSORWIKI_API_URL,
	}
}

type ENV = ReturnType<typeof getEnv>

declare global {
	var ENV: ENV
	interface Window {
		ENV: ENV
	}
}
