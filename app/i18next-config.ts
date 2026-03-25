import { type InitOptions } from 'i18next'

export const i18nextOptions = {
	supportedLngs: ['en', 'de'] as const,
	fallbackLng: 'en',
	defaultNS: 'common',
} satisfies InitOptions

/**
 * This type is representing the supported languages in the app.
 * Derived from {@link i18nextOptions.supportedLngs}.
 */
export type SupportedLanguage = (typeof i18nextOptions.supportedLngs)[number]
