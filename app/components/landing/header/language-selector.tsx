import { Globe } from 'lucide-react'
import { useFetcher } from 'react-router'
import { Button } from '~/components/ui/button'
import { useRootRouteLoaderData } from '~/root'

export default function LanguageSelector() {
	const { locale } = useRootRouteLoaderData()
	const fetcher = useFetcher()

	const toggleLanguage = () => {
		const newLocale = locale === 'en' ? 'de' : 'en'
		void fetcher.submit(
			{ 'set-language': newLocale },
			{ method: 'post', action: '/' },
		)
	}

	return (
		<Button
			variant="ghost"
			size="icon"
			onClick={toggleLanguage}
			className="hover:bg-transparent hover:text-black dark:hover:text-white"
			disabled={fetcher.state !== 'idle'}
		>
			<Globe />
			{locale === 'de' ? <p>DE</p> : <p>EN</p>}
		</Button>
	)
}
