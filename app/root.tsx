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
import ErrorMessage from './components/error-message'
import { Toaster } from './components/ui/toaster'
import { getLocale, i18nCookie, i18nextMiddleware } from './middleware/i18next'
import { updateUserlocale } from './models/user.server'
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
			<body className="h-full dark:bg-dark-background dark:text-dark-text">
				<div className="flex h-screen w-screen items-center justify-center">
					<ErrorMessage />
				</div>
			</body>
		</html>
	)
}
