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
import { getUserById } from '~/db/models/user.server'
import {
	disableNewsletterForUser,
	hasPendingNewsletterConfirmation,
	requestNewsletterConfirmation,
} from '~/services/newsletter-service.server'
import { getUserId } from '~/services/session-service.server'

type PreferencesValues = {
	newsletterRequested: boolean
}

type PreferencesActionData = {
	success: boolean
	newsletterSyncFailed: boolean
	newsletterConfirmationFailed: boolean
	newsletterOptIn: boolean
	newsletterOptInPending: boolean
	newsletterRequested: boolean
}

export async function loader({ request }: Route.LoaderArgs) {
	const userId = await getUserId(request)
	if (!userId) return redirect('/')

	const user = await getUserById(userId)
	if (!user) return redirect('/')

	const newsletterOptInPending = await hasPendingNewsletterConfirmation(user.id)

	return {
		newsletterOptIn: user.newsletterOptIn,
		newsletterOptInPending,
	}
}

export async function action({ request }: Route.ActionArgs) {
	const userId = await getUserId(request)
	if (!userId) return redirect('/')

	const user = await getUserById(userId)
	if (!user) return redirect('/')

	const formData = await request.formData()
	const newsletterRequested = formData.get('newsletterOptIn') === 'on'
	const newsletterOptInPending = await hasPendingNewsletterConfirmation(user.id)
	const currentNewsletterRequested =
		user.newsletterOptIn || newsletterOptInPending

	if (newsletterRequested === currentNewsletterRequested) {
		return data({
			success: true,
			newsletterSyncFailed: false,
			newsletterConfirmationFailed: false,
			newsletterOptIn: user.newsletterOptIn,
			newsletterOptInPending,
			newsletterRequested,
		})
	}

	try {
		if (newsletterRequested) {
			await requestNewsletterConfirmation(user)
			return data({
				success: true,
				newsletterSyncFailed: false,
				newsletterConfirmationFailed: false,
				newsletterOptIn: user.newsletterOptIn,
				newsletterOptInPending: true,
				newsletterRequested: true,
			})
		}

		const updatedUser = await disableNewsletterForUser(user)
		return data({
			success: true,
			newsletterSyncFailed: false,
			newsletterConfirmationFailed: false,
			newsletterOptIn: updatedUser.newsletterOptIn,
			newsletterOptInPending: false,
			newsletterRequested: false,
		})
	} catch {
		return data({
			success: false,
			newsletterSyncFailed: !newsletterRequested,
			newsletterConfirmationFailed: newsletterRequested,
			newsletterOptIn: user.newsletterOptIn,
			newsletterOptInPending,
			newsletterRequested: currentNewsletterRequested,
		})
	}
}

export default function PreferencesSettingsPage() {
	const {
		newsletterOptIn: initialNewsletterOptIn,
		newsletterOptInPending: initialNewsletterOptInPending,
	} = useLoaderData<typeof loader>()
	const { toast } = useToast()
	const { t } = useTranslation('settings')
	const [newsletterRequested, setNewsletterRequested] = useState(
		initialNewsletterOptIn || initialNewsletterOptInPending,
	)
	const [newsletterOptInPending, setNewsletterOptInPending] = useState(
		initialNewsletterOptInPending,
	)

	const autosave = useAutosaveFetcher<PreferencesValues, PreferencesActionData>(
		{
			values: { newsletterRequested },
			lastSavedValues: {
				newsletterRequested:
					initialNewsletterOptIn || initialNewsletterOptInPending,
			},
			enabled: false,
			getPayload: (values) => ({
				newsletterOptIn: values.newsletterRequested ? 'on' : 'false',
			}),
			isSuccess: (data) =>
				data.success &&
				!data.newsletterSyncFailed &&
				!data.newsletterConfirmationFailed,
			getSavedValues: (data, submittedValues) => ({
				newsletterRequested:
					data.newsletterRequested ?? submittedValues.newsletterRequested,
			}),
			onSuccess: (data) => {
				setNewsletterOptInPending(data.newsletterOptInPending)
			},
			onError: (data) => {
				setNewsletterRequested(data.newsletterRequested)
				setNewsletterOptInPending(data.newsletterOptInPending)
				toast({
					title: data.newsletterConfirmationFailed
						? t('newsletter_confirmation_failed')
						: t('newsletter_sync_failed'),
					variant: 'destructive',
				})
			},
		},
	)

	useEffect(() => {
		const nextNewsletterRequested =
			initialNewsletterOptIn || initialNewsletterOptInPending
		setNewsletterRequested(nextNewsletterRequested)
		setNewsletterOptInPending(initialNewsletterOptInPending)
		autosave.resetLastSaved({
			newsletterRequested: nextNewsletterRequested,
		})
	}, [
		initialNewsletterOptIn,
		initialNewsletterOptInPending,
		autosave.resetLastSaved,
	])

	const handleNewsletterChange = useCallback(
		(checked: boolean) => {
			const nextValues = { newsletterRequested: checked }
			setNewsletterRequested(checked)
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
							checked={newsletterRequested}
							onCheckedChange={(checked) =>
								handleNewsletterChange(checked === true)
							}
							disabled={autosave.isSaving}
						/>
						<Label htmlFor="newsletterOptIn" className="text-sm leading-5">
							{t('receive_newsletter_messages')}
							{newsletterRequested && newsletterOptInPending && (
								<span className="text-muted-foreground ml-2">
									{t('newsletter_confirmation_pending')}
								</span>
							)}
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
