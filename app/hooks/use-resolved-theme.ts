import { useEffect, useState } from 'react'
import { useRootRouteLoaderData } from '~/root'
import { type ResolvedTheme } from '~/lib/theme'

function getDocumentTheme(fallback: ResolvedTheme): ResolvedTheme {
	if (typeof document === 'undefined') return fallback

	return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

export function useResolvedTheme() {
	const { theme: serverTheme } = useRootRouteLoaderData()
	const [theme, setTheme] = useState(() => getDocumentTheme(serverTheme))

	useEffect(() => {
		const root = document.documentElement
		const media = window.matchMedia('(prefers-color-scheme: dark)')
		const updateTheme = () => setTheme(getDocumentTheme(serverTheme))

		updateTheme()

		const observer = new MutationObserver(updateTheme)
		observer.observe(root, { attributes: true, attributeFilter: ['class'] })
		media.addEventListener('change', updateTheme)

		return () => {
			observer.disconnect()
			media.removeEventListener('change', updateTheme)
		}
	}, [serverTheme])

	return theme
}
