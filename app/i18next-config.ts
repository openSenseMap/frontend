import { type InitOptions } from 'i18next'

export const i18nextOptions = {
	supportedLngs: ['en', 'de'] as const,
	fallbackLng: 'en',
	defaultNS: 'common',
} satisfies InitOptions

export type SupportedLanguage = (typeof i18nextOptions.supportedLngs)[number]
