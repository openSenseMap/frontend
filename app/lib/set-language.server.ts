import { i18nCookie } from '~/cookies'

export async function setLanguageCookie(lang: string) {
	return await i18nCookie.serialize(lang)
}
