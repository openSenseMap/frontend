import i18next from 'i18next'
import { Globe } from 'lucide-react'
import { useEffect } from 'react'
import { useFetcher, useLoaderData } from 'react-router'
import { Button } from '~/components/ui/button'
import { type loader } from '~/root'

export default function LanguageSelector() {
	const data = useLoaderData<typeof loader>()
	const fetcher = useFetcher()

	// When loader locale changes (e.g. after login), sync state
	useEffect(() => {
		if (!data?.locale) return
		const updateLang = async () => {
			await i18next.changeLanguage(data.locale)
		}
		void updateLang()
	}, [data.locale])

	const toggleLanguage = async () => {
		const newLocale = (data?.locale ?? 'en') === 'en' ? 'de' : 'en' // Toggle between "en" and "de"
		void fetcher.submit(
			{ language: newLocale },
			{ method: 'post', action: '/action/set-language' }, // Persist the new language
		)
		await i18next.changeLanguage(newLocale) // Change the language in the app
	}

	return (
		<Button
			variant="ghost"
			size="icon"
			onClick={toggleLanguage}
			className="hover:bg-transparent hover:text-black dark:hover:text-white"
		>
			<Globe />
			{(data?.locale ?? 'en') === 'de' ? <p>DE</p> : <p>EN</p>}
		</Button>
	)
}
