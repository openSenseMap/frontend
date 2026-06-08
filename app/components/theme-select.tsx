import { useEffect } from 'react'
import { useFetcher, useRouteLoaderData } from 'react-router'
import invariant from 'tiny-invariant'
import { ThemePreferenceSchema, type ThemePreference } from '~/lib/theme'
import type { loader as rootLoader } from '~/root'

function parseThemePreference(value: unknown): ThemePreference | null {
	const result = ThemePreferenceSchema.safeParse(value)
	return result.success ? result.data : null
}

function resolveThemePreference(preference: ThemePreference): 'light' | 'dark' {
	if (preference === 'dark') return 'dark'
	if (preference === 'light') return 'light'

	return window.matchMedia('(prefers-color-scheme: dark)').matches
		? 'dark'
		: 'light'
}

function applyThemePreference(preference: ThemePreference) {
	const theme = resolveThemePreference(preference)
	const root = document.documentElement

	root.classList.remove('light', 'dark')
	root.classList.add(theme)
	root.style.colorScheme = theme
}

function useRootData() {
	const rootData = useRouteLoaderData<typeof rootLoader>('root')
	invariant(rootData, 'root loader data should be available')
	return rootData
}

export function ThemeSelect() {
	const { themePreference: serverThemePreference } = useRootData()
	const fetcher = useFetcher<{ ok: boolean }>()

	const optimisticThemePreference = parseThemePreference(
		fetcher.formData?.get('set-theme'),
	)

	const themePreference = optimisticThemePreference ?? serverThemePreference
	const isSaving = fetcher.state !== 'idle'

	useEffect(() => {
		applyThemePreference(themePreference)

		if (themePreference !== 'system') return

		const media = window.matchMedia('(prefers-color-scheme: dark)')
		const listener = () => applyThemePreference('system')

		media.addEventListener('change', listener)

		return () => {
			media.removeEventListener('change', listener)
		}
	}, [themePreference])

	return (
		<fetcher.Form
			method="post"
			action="/"
			className="inline-flex items-center gap-2"
		>
			<label htmlFor="theme-select" className="text-muted-foreground text-sm">
				Theme
			</label>

			<select
				id="theme-select"
				name="set-theme"
				value={themePreference}
				disabled={isSaving}
				onChange={(event) => {
					const nextThemePreference = parseThemePreference(
						event.currentTarget.value,
					)

					if (nextThemePreference) {
						applyThemePreference(nextThemePreference)
					}

					fetcher.submit(event.currentTarget.form)
				}}
				className="border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring rounded-md border px-2 py-1 text-sm shadow-sm transition-colors outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
			>
				<option value="system">System</option>
				<option value="light">Light</option>
				<option value="dark">Dark</option>
			</select>

			<noscript>
				<button
					type="submit"
					className="bg-primary text-primary-foreground rounded-md px-2 py-1 text-sm"
				>
					Save
				</button>
			</noscript>
		</fetcher.Form>
	)
}
