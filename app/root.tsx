import tailwindStylesheetUrl from '/app/styles/tailwind.css?url'
import appStylesheetUrl from '/app/styles/app.css?url'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import {
	data,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLoaderData,
	type LoaderFunctionArgs,
	type MetaFunction,
} from 'react-router'
import { useChangeLanguage } from 'remix-i18next/react'
import { Toaster } from './components/ui/toaster'
import { i18nCookie } from './cookies'
import i18next from './i18next.server'
import { getEnv } from './utils/env.server'
import { getUser } from './utils/session.server'

export const links = () => {
	return [
		{
			rel: 'preload',
			as: 'font',
			href: '/fonts/RobotoSlab-Medium.woff2',
			type: 'font/woff2',
			crossOrigin: 'anonymous',
		},
		{
			rel: 'preload',
			as: 'font',
			href: '/fonts/RobotoSlab-Regular.woff2',
			type: 'font/woff2',
			crossOrigin: 'anonymous',
		},
		{
			rel: 'preload',
			as: 'font',
			href: '/fonts/Urbanist-Medium.woff2',
			type: 'font/woff2',
			crossOrigin: 'anonymous',
		},
		{
			rel: 'preload',
			as: 'font',
			href: '/fonts/Urbanist-Regular.woff2',
			type: 'font/woff2',
			crossOrigin: 'anonymous',
		},
		{ rel: 'icon', href: '/favicon.ico' },
		{ rel: 'stylesheet', href: tailwindStylesheetUrl },
		{ rel: 'stylesheet', href: appStylesheetUrl },
	]
}

export const meta: MetaFunction = () => [
	{ charset: 'utf-8' },
	{ title: 'openSenseMap' },
	{ viewport: 'width=device-width,initial-scale=1' },
]

export async function loader({ request }: LoaderFunctionArgs) {
	const locale = await i18next.getLocale(request)
	const user = await getUser(request)
	// const themeSession = await getThemeSession(request);
	// const { getTheme } = await themeSessionResolver(request);
	return data(
		{
			user: user,
			locale: locale,
			ENV: getEnv(),
			// theme: getTheme(),
		},
		{
			headers: { 'Set-Cookie': await i18nCookie.serialize(locale) },
		},
	)
}

export let handle = {
	// In the handle export, we can add a i18n key with namespaces our route
	// will need to load. This key can be a single string or an array of strings.
	// TIP: In most cases, you should set this to your defaultNS from your i18n config
	// or if you did not set one, set it to the i18next default namespace "translation"
	i18n: 'common',
}

export default function AppWithProviders() {
	// const data = useLoaderData<typeof loader>();

	return (
		// <ThemeProvider specifiedTheme={data.theme} themeAction="/action/set-theme">
		<App />
		// </ThemeProvider>
	)
}

export function App() {
	const data = useLoaderData<typeof loader>()
	// const [theme] = useTheme();

	let { i18n } = useTranslation()

	// This hook will change the i18n instance language to the current locale
	// detected by the loader, this way, when we do something to change the
	// language, this locale will change and i18next will load the correct
	// translation files
	useChangeLanguage(data.locale)

	return (
		<html lang={data.locale} dir={i18n.dir()} className={clsx('light')}>
			<head>
				<Meta />
				{/* <PreventFlashOnWrongTheme ssrTheme={Boolean(data.theme)} /> */}
				<Links />
			</head>
			<body className="dark:bg-dark-background dark:text-dark-text">
				<Outlet />
				<Toaster />
				<ScrollRestoration />
				<Scripts />
				<script
					dangerouslySetInnerHTML={{
						__html: `window.ENV = ${JSON.stringify(data.ENV)}`,
					}}
				/>
			</body>
		</html>
	)
}
