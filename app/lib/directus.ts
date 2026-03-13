import {
	createDirectus,
	type DirectusClient,
	rest,
	type RestClient,
} from '@directus/sdk'
import { type supportedLanguages } from '~/i18next-options'

const directusUrl = process.env.DIRECTUS_URL || 'http://localhost:8055'

export type UseCase = {
	id: number | string
	status: string
	image: string
	title: string
	description: string
	content: string
	language: (typeof supportedLanguages)[number]
}

export type Feature = {
	id: number | string
	title: string
	description: string
	icon: string
	language: (typeof supportedLanguages)[number]
}

export type Partner = {
	id: number | string
	name: string
	logo: string
	link: string
}

export type StaticPage = {
	slug: string
	language: StaticPageTranslation[]
}
export type StaticPageTranslation = {
	static_pages_slug: string
	static_pages_languages_code: string
	title: string
	content: string
}

type DirectusCollection = {
	use_cases: UseCase[]
	features: Feature[]
	partners: Partner[]
	static_pages: StaticPage[]
	static_pages_translations: StaticPageTranslation[]
}

const directus = createDirectus<DirectusCollection>(directusUrl).with(rest())

export function getDirectusClient(): DirectusClient<DirectusCollection> &
	RestClient<DirectusCollection> {
	return directus
}
