import { createCookie } from 'react-router'

const isProduction = process.env.NODE_ENV === 'production'

export let i18nCookie = createCookie('i18n', {
	sameSite: 'lax',
	path: '/',
	secrets: process.env.SESSION_SECRET
		? [process.env.SESSION_SECRET]
		: ['s3cr3t'],
	secure: isProduction,
})
