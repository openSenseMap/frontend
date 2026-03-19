import tailwindStylesheetUrl from '/app/styles/tailwind.css?url'
import appStylesheetUrl from '/app/styles/app.css?url'
import clsx from 'clsx'
import { invariant } from 'node_modules/@formatjs/intl/src/utils'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
	data,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useRouteLoaderData,
	type MetaFunction,
} from 'react-router'
import { type Route } from './+types/root'
import { Toaster } from './components/ui/toaster'
import { i18nCookie } from './cookies'
import { getLocale, i18nextMiddleware } from './middleware/i18next'
import { getEnv } from './utils/env.server'
import { getUser } from './utils/session.server'

export const middleware: Route.MiddlewareFunction[] = [i18nextMiddleware]

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

export async function loader({ context, request }: Route.LoaderArgs) {
	const locale = getLocale(context)
	const user = await getUser(request)
	return data(
		{
			user: user,
			locale: locale,
			ENV: getEnv(),
		},
		{
			headers: { 'Set-Cookie': await i18nCookie.serialize(locale) },
		},
	)
}

export const useRootRouteLoaderData = () => {
	const rootData = useRouteLoaderData<typeof loader>('root')
	invariant(rootData !== undefined, 'root loader should always return data')
	return rootData
}

export default function App({
	loaderData: { locale, ENV },
}: Route.ComponentProps) {
	const { i18n } = useTranslation()
	useEffect(() => {
		if (i18n.language !== locale) {
			void i18n.changeLanguage(locale)
		}
	}, [locale, i18n])

	return (
		<html
			lang={i18n.language}
			dir={i18n.dir(i18n.language)}
			className={clsx('light h-full')}
		>
			<head>
				<Meta />
				{/* <PreventFlashOnWrongTheme ssrTheme={Boolean(data.theme)} /> */}
				<Links />
			</head>
			<body className="h-full dark:bg-dark-background dark:text-dark-text">
				<Outlet />
				<Toaster />
				<ScrollRestoration />
				<Scripts />
				<script
					dangerouslySetInnerHTML={{
						__html: `window.ENV = ${JSON.stringify(ENV)}`,
					}}
				/>
			</body>
		</html>
	)
}
