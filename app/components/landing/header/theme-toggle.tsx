import { SunMoon } from 'lucide-react'
import { useFetcher } from 'react-router'
import { Button } from '~/components/ui/button'
import type { ThemePreference } from '~/lib/theme'
import { useRootRouteLoaderData } from '~/root'

function applyThemePreference(preference: ThemePreference) {
	const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

	const resolvedTheme =
		preference === 'dark' || (preference === 'system' && prefersDark)
			? 'dark'
			: 'light'

	const root = document.documentElement

	root.classList.remove('light', 'dark')
	root.classList.add(resolvedTheme)
	root.style.colorScheme = resolvedTheme
}

function getCurrentResolvedTheme(): 'light' | 'dark' {
	return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

export default function ThemeToggle() {
	const { themePreference } = useRootRouteLoaderData()
	const fetcher = useFetcher()

	const toggleTheme = () => {
		const currentTheme = getCurrentResolvedTheme()

		const nextThemePreference: ThemePreference =
			currentTheme === 'dark' ? 'light' : 'dark'

		applyThemePreference(nextThemePreference)

		void fetcher.submit(
			{ 'set-theme': nextThemePreference },
			{ method: 'post', action: '/' },
		)
	}

	return (
		<div className="group relative">
			<Button
				variant="topbar"
				size="topbarPill"
				onClick={toggleTheme}
				disabled={fetcher.state !== 'idle'}
				aria-label={`Toggle theme. Current preference: ${themePreference}`}
			>
				<SunMoon />
			</Button>

			<div className="bg-popover text-popover-foreground pointer-events-none absolute top-full left-1/2 mt-2 -translate-x-1/2 rounded-md px-2 py-1 text-xs opacity-0 shadow-md transition-opacity group-hover:opacity-100">
				{themePreference === 'system'
					? 'System theme'
					: `${themePreference[0].toUpperCase()}${themePreference.slice(1)} theme`}
			</div>
		</div>
	)
}
