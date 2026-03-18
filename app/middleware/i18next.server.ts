import Backend from 'i18next-fs-backend/cjs' // Even though unintuitive, cjs is what we want: https://github.com/i18next/i18next-fs-backend/issues/57
import { initReactI18next } from 'react-i18next'
import { createI18nextMiddleware } from 'remix-i18next/middleware'
import 'i18next'
import { i18nCookie } from '~/cookies'
import i18nextOptions from '~/i18next-options'

export const [i18nextMiddleware, getLocale, getInstance] =
	createI18nextMiddleware({
		detection: {
			supportedLanguages: [...i18nextOptions.supportedLngs],
			fallbackLanguage: i18nextOptions.fallbackLng,
			cookie: i18nCookie,
			// findLocale: async (request) => {
			// 	const user = await getUser(request)
			// 	if (user?.language)
			// 		return user.language.slice(0, 2)

			// 	const acceptLanguage = request.headers.get('accept-language')
			// 	if (acceptLanguage) {
			// 		const browserLang = acceptLanguage
			// 			.split(',')[0]
			// 			.split('-')[0]
			// 			.toLowerCase()

			// 		if (supportedLngs.includes(browserLang as any))
			// 			return browserLang
			// 	}

			// 	return null
			// },
		},
		i18next: {
			backend: { loadPath: './public/locales/{{lng}}/{{ns}}.json' },
			defaultNS: i18nextOptions.defaultNS,
		},
		plugins: [Backend, initReactI18next],
	})
