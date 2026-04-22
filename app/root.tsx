import tailwindStylesheetUrl from '/app/styles/tailwind.css?url'
import appStylesheetUrl from '/app/styles/app.css?url'
import clsx from 'clsx'
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
import invariant from 'tiny-invariant'
import { type Route } from './+types/root'
import ErrorMessage from './components/error-message'
import { Toaster } from './components/ui/toaster'
import { updateUserlocale } from './db/models/user.server'
import { getLocale, i18nCookie, i18nextMiddleware } from './middleware/i18next'
import { tosUiMiddleware } from './middleware/tos-ui.server'
import { getEnv } from './utils/env.server'
import { getUser } from './utils/session.server'

export const middleware: Route.MiddlewareFunction[] = [
	i18nextMiddleware,
	tosUiMiddleware,
]

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
		{ rel: 'stylesheet', href: tailwindStylesheetUrl },
		{ rel: 'stylesheet', href: appStylesheetUrl },
		{ rel: 'icon', href: '/img/logo.svg', type: 'image/svg+xml' },
		{
			rel: 'icon',
			href: '/img/favicon-32x32.png',
			sizes: '32x32',
			type: 'image/png',
		},
		{ rel: 'apple-touch-icon', href: '/img/favicon-180x180.png' },
		{ rel: 'manifest', href: '/manifest.json' },
	]
}

export const meta: MetaFunction = () => [
	{ charset: 'utf-8' },
	{ title: 'openSenseMap' },
	{ viewport: 'width=device-width,initial-scale=1' },
	{ 'theme-color': '#3d843f', media: '(prefers-color-scheme: light)' },
	{ 'theme-color': '#6fa161', media: '(prefers-color-scheme: dark)' },
	{
		description:
			'The environmental data platform to promote education, environmental and climate protection, enthusiasm for STEM, citizen science, open data, and open source.',
	},
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
		// setting the cookie is required here to make sure we keep the server and client
		// instance of i18n in synch
		{
			headers: { 'Set-Cookie': await i18nCookie.serialize(locale) },
		},
	)
}

export async function action({ context, request }: Route.ActionArgs) {
	const formData = await request.formData()
	const setLang = formData.get('set-language')?.toString() ?? null

	if (setLang === null) return

	const locale = getLocale(context)
	if (setLang === locale) return

	const user = await getUser(request)
	// updating the user locale is sufficient,
	// because the loader will set the cookie to
	// the user locale on the next request
	if (user) await updateUserlocale(user.email, setLang)
	else {
		return data(
			{},
			{
				headers: { 'Set-Cookie': await i18nCookie.serialize(setLang) },
			},
		)
	}
}

/**
 * Convenience hook to get the {@link loader} data of the root route in order to access
 * e.g. the current locale, user or others.
 * @returns The loader data of the root route
 */
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
			<body className="dark:bg-dark-background dark:text-dark-text h-full">
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

/**
 * A catch-all error boundary that will render if any error is thrown in the app.
 * Add a function like this to subpages, if you want to create a more specific
 * error boundary for that page (e.g. with specific messages, styling etc.).
 *
 * Note that error boundaries are shown in place of the parent pages <Outlet />.
 */
export function ErrorBoundary() {
	return (
		<html className={clsx('light h-full')}>
			<head>
				<Meta />
				<Links />
			</head>
			<body className="dark:bg-dark-background dark:text-dark-text h-full">
				<div className="flex h-screen w-screen items-center justify-center">
					<ErrorMessage />
				</div>
			</body>
		</html>
	)
}
