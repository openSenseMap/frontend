import { Languages } from 'lucide-react'
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
		<div className="group relative">
			<Button
				variant="topbar"
				size="topbarPill"
				onClick={toggleLanguage}
				disabled={fetcher.state !== 'idle'}
				aria-label={`Current language: ${locale.toUpperCase()}`}
			>
				<Languages />
			</Button>

			<div className="bg-popover text-popover-foreground pointer-events-none absolute top-full left-1/2 mt-2 -translate-x-1/2 rounded-md px-2 py-1 text-xs opacity-0 shadow-md transition-opacity group-hover:opacity-100">
				{locale.toUpperCase()}
			</div>
		</div>
	)
}
