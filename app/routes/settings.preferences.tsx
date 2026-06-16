import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { data, redirect, useLoaderData } from 'react-router'
import { type Route } from './+types/settings.preferences'
import { AutosaveStatusText } from '~/components/autosave-status.text'
import { LanguageSelect } from '~/components/language-select'
import { ThemeSelect } from '~/components/theme-select'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Checkbox } from '~/components/ui/checkbox'
import { Label } from '~/components/ui/label'
import { useToast } from '~/components/ui/use-toast'
import { useAutosaveFetcher } from '~/hooks/use-autosave-fetcher'
import { getUserById, updateUserPreferencesById } from '~/db/models/user.server'
import { syncNewsletterSubscriptionWithMailgun } from '~/services/newsletter-service.server'
import { getUserId } from '~/services/session-service.server'

type PreferencesValues = {
	newsletterOptIn: boolean
}

type PreferencesActionData = {
	success: boolean
	newsletterSyncFailed: boolean
	newsletterOptIn: boolean
}

export async function loader({ request }: Route.LoaderArgs) {
	const userId = await getUserId(request)
	if (!userId) return redirect('/')

	const user = await getUserById(userId)
	if (!user) return redirect('/')

	return { newsletterOptIn: user.newsletterOptIn }
}

export async function action({ request }: Route.ActionArgs) {
	const userId = await getUserId(request)
	if (!userId) return redirect('/')

	const user = await getUserById(userId)
	if (!user) return redirect('/')

	const formData = await request.formData()
	const newsletterOptIn = formData.get('newsletterOptIn') === 'on'

	if (newsletterOptIn === user.newsletterOptIn) {
		return data({
			success: true,
			newsletterSyncFailed: false,
			newsletterOptIn,
		})
	}

	const updatedUser = await updateUserPreferencesById(user.id, {
		newsletterOptIn,
	})

	try {
		await syncNewsletterSubscriptionWithMailgun(updatedUser)
		return data({
			success: true,
			newsletterSyncFailed: false,
			newsletterOptIn,
		})
	} catch {
		return data({
			success: false,
			newsletterSyncFailed: true,
			newsletterOptIn,
		})
	}
}

export default function PreferencesSettingsPage() {
	const { newsletterOptIn: initialNewsletterOptIn } =
		useLoaderData<typeof loader>()
	const { toast } = useToast()
	const { t } = useTranslation('settings')
	const [newsletterOptIn, setNewsletterOptIn] = useState(initialNewsletterOptIn)

	const autosave = useAutosaveFetcher<PreferencesValues, PreferencesActionData>(
		{
			values: { newsletterOptIn },
			lastSavedValues: { newsletterOptIn: initialNewsletterOptIn },
			enabled: false,
			getPayload: (values) => ({
				newsletterOptIn: values.newsletterOptIn ? 'on' : 'false',
			}),
			isSuccess: (data) => data.success && !data.newsletterSyncFailed,
			getSavedValues: (data, submittedValues) => ({
				newsletterOptIn:
					data.newsletterOptIn ?? submittedValues.newsletterOptIn,
			}),
			onError: () => {
				toast({
					title: t('newsletter_sync_failed'),
					variant: 'destructive',
				})
			},
		},
	)

	useEffect(() => {
		setNewsletterOptIn(initialNewsletterOptIn)
		autosave.resetLastSaved({ newsletterOptIn: initialNewsletterOptIn })
	}, [initialNewsletterOptIn, autosave.resetLastSaved])

	const handleNewsletterChange = useCallback(
		(checked: boolean) => {
			const nextValues = { newsletterOptIn: checked }
			setNewsletterOptIn(checked)
			autosave.submit(nextValues)
		},
		[autosave],
	)

	return (
		<Card className="border-border bg-card text-card-foreground">
			<CardHeader>
				<CardTitle>{t('preferences')}</CardTitle>
			</CardHeader>

			<CardContent className="divide-border divide-y">
				<div className="flex items-center justify-between gap-4 py-4 first:pt-0">
					<div>
						<div className="text-foreground font-medium">{t('language')}</div>
					</div>

					<LanguageSelect />
				</div>

				<div className="flex items-center justify-between gap-4 py-4 last:pb-0">
					<div>
						<div className="text-foreground font-medium">{t('theme')}</div>
						<div className="text-muted-foreground text-sm">
							{t('theme_description')}
						</div>
					</div>

					<ThemeSelect />
				</div>

				<div className="flex items-center justify-between gap-4 py-4 last:pb-0">
					<div className="flex items-center gap-2">
						<Checkbox
							id="newsletterOptIn"
							name="newsletterOptIn"
							value="on"
							checked={newsletterOptIn}
							onCheckedChange={(checked) =>
								handleNewsletterChange(checked === true)
							}
							disabled={autosave.isSaving}
						/>
						<Label htmlFor="newsletterOptIn" className="text-sm leading-5">
							{t('receive_newsletter_messages')}
						</Label>
					</div>

					<AutosaveStatusText
						status={autosave.status}
						namespace="settings"
						className="min-h-5 text-sm"
					/>
				</div>
			</CardContent>
		</Card>
	)
}
