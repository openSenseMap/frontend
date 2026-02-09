import {
	createDirectus,
	type DirectusClient,
	rest,
	type RestClient,
} from '@directus/sdk'

const directusUrl = process.env.DIRECTUS_URL || 'http://localhost:8055'

export type UseCase = {
	id: number | string
	status: string
	image: string
	title: string
	description: string
	content: string
	language: 'de' | 'en'
}

export type Feature = {
	id: number | string
	title: string
	description: string
	icon: string
	language: 'de' | 'en'
}

export type Partner = {
	id: number | string
	name: string
	logo: string
	link: string
}

type DirectusCollection = {
	use_cases: UseCase[]
	features: Feature[]
	partners: Partner[]
}

const directus = createDirectus<DirectusCollection>(directusUrl).with(rest())

export function getDirectusClient(): DirectusClient<DirectusCollection> &
	RestClient<DirectusCollection> {
	return directus
}
