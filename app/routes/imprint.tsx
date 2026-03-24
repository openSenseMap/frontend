import { readItem, readItems } from '@directus/sdk'
import { useEffect, useEffectEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
	Link,
	useLoaderData,
	useRevalidator,
	type LoaderFunctionArgs,
} from 'react-router'
import LanguageSelector from '~/components/landing/header/language-selector'
import { MarkdownContent } from '~/components/markdown-content'
import i18nextOptions, { type supportedLanguages } from '~/i18next-options'
import i18next from '~/i18next.server'
import {
	getDirectusClient,
	type StaticPageTranslation,
	type StaticPage,
} from '~/lib/directus'

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const locale = (await i18next.getLocale(
		request,
	)) as (typeof supportedLanguages)[number]
	const locales =
		locale == i18nextOptions.fallbackLng
			? [locale]
			: [locale, i18nextOptions.fallbackLng]
	const directus = getDirectusClient()
	return directus
		.request<StaticPage>(readItem('static_pages', 'imprint'))
		.then((data) => {
			return directus
				.request<StaticPageTranslation[]>(
					readItems('static_pages_translations', {
						limit: locales.length,
						filter: {
							static_pages_slug: {
								_eq: data.slug,
							},
							_or: locales.map((l) => ({
								static_pages_languages_code: {
									_istarts_with: l,
								},
							})),
						},
					}),
				)
				.then(
					(i) =>
						i.sort((a, b) => {
							const aIdx = locales.findIndex((l) =>
								a.static_pages_languages_code.startsWith(l),
							)
							const bIdx = locales.findIndex((l) =>
								b.static_pages_languages_code.startsWith(l),
							)
							return aIdx - bIdx
						})[0],
				)
		})
}

export default function Imprint() {
	const data = useLoaderData<typeof loader>()
	const [, i18n] = useTranslation()
	const revalidator = useRevalidator()

	const reloadOnLanguageChanged = useEffectEvent(async () => {
		await revalidator.revalidate()
	})

	useEffect(() => {
		i18n.on('languageChanged', reloadOnLanguageChanged)
		return () => i18n.off('languageChanged', reloadOnLanguageChanged)
	}, [i18n])

	return (
		<>
			<header>
				<nav className="relative mx-auto flex h-16 max-w-7xl justify-between py-6 dark:border-gray-300 dark:bg-black">
					<div className="container flex flex-wrap items-center justify-between px-4 font-serif">
						<div className="flex max-w-screen-xl flex-wrap items-center justify-between">
							<Link to="/" className="flex items-center md:pr-10">
								<img
									src="/logo.png"
									className="mr-3 h-6 sm:h-9"
									alt="osem Logo"
								/>
								<span className="hidden self-center whitespace-nowrap text-xl text-light-green dark:text-dark-green md:block">
									openSenseMap
								</span>
							</Link>
						</div>
						<div>
							<div className="flex items-center justify-center md:order-2">
								<LanguageSelector />
							</div>
						</div>
					</div>
				</nav>
			</header>
			<main className="mx-auto mt-8 flex max-w-7xl flex-col justify-center px-4 sm:px-6 lg:px-8">
				<h1 className="my-4 text-4xl">{data.title}</h1>
				<MarkdownContent>{data.content}</MarkdownContent>
			</main>
		</>
	)
}