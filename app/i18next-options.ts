import { type InitOptions } from 'i18next'

export const supportedLanguages = ['en', 'de'] as const

export default {
	supportedLngs: supportedLanguages,
	fallbackLng: 'en',
	defaultNS: 'common',
} satisfies InitOptions
