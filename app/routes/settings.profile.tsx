import { CopyIcon, CopyCheckIcon, InfoIcon } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Outlet, useLoaderData } from 'react-router'
import { type Route } from './+types/settings.profile'

import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Switch } from '~/components/ui/switch'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '~/components/ui/tooltip'
import { useToast } from '~/components/ui/use-toast'

import { getProfileByUserId, updateProfile } from '~/db/models/profile.server'
import { getUserById } from '~/db/models/user.server'
import { useCopyToClipboard } from '~/hooks/use-copy-to-clipboard'
import {
	AUTOSAVE_DELAY_MS,
	useAutosaveFetcher,
} from '~/hooks/use-autosave-fetcher'
import { getInitials } from '~/lib/strings'
import { requireUserId } from '~/services/session-service.server'
import { AutosaveStatusText } from '~/components/autosave-status.text'

export async function loader({ request }: Route.LoaderArgs) {
	const userId = await requireUserId(request)

	const [user, profile] = await Promise.all([
		getUserById(userId),
		getProfileByUserId(userId),
	])

	if (!user || !profile) {
		throw new Error('User profile not found')
	}

	if (!user.name) {
		throw new Error('Username not found')
	}

	const publicProfileUrl = new URL(
		`/profile/${encodeURIComponent(user.name)}`,
		request.url,
	).toString()

	return {
		profile,
		publicProfileUrl,
	}
}

export type ProfileActionData =
	| {
			intent: 'autosave-profile'
			success: true
			updatedProfile: {
				id: string
				displayName: string
				public: boolean
				userId: string
			}
	  }
	| {
			intent: 'autosave-profile'
			success: false
			message: string
	  }

export async function action({
	request,
}: Route.ActionArgs): Promise<ProfileActionData> {
	const userId = await requireUserId(request)
	const profile = await getProfileByUserId(userId)

	if (!profile || !userId) {
		return {
			intent: 'autosave-profile',
			success: false,
			message: 'Something went wrong.',
		}
	}

	const formData = await request.formData()

	const intent = String(formData.get('intent') ?? '')
	const displayName = String(formData.get('displayName') ?? '').trim()
	const isPublic = formData.get('isPublic') === 'true'

	if (intent !== 'autosave-profile') {
		return {
			intent: 'autosave-profile',
			success: false,
			message: 'Invalid intent.',
		}
	}

	if (displayName.length < 3 || displayName.length > 40) {
		return {
			intent: 'autosave-profile',
			success: false,
			message: 'Display name must be between 3 and 40 characters.',
		}
	}

	const updatedProfile = await updateProfile(profile.id, displayName, isPublic)

	if (!updatedProfile) {
		return {
			intent: 'autosave-profile',
			success: false,
			message: 'Profile could not be updated.',
		}
	}

	return {
		intent: 'autosave-profile',
		success: true,
		updatedProfile: {
			id: updatedProfile.id,
			displayName: updatedProfile.displayName,
			public: updatedProfile.public ?? false,
			userId: updatedProfile.userId,
		},
	}
}

type ProfileAutosaveValues = {
	displayName: string
	isPublic: boolean
}

export default function EditUserProfilePage() {
	const data = useLoaderData<typeof loader>()

	const [displayName, setDisplayName] = useState(data.profile.displayName)
	const [isPublic, setIsPublic] = useState(data.profile.public ?? false)

	const { t } = useTranslation('settings')
	const { toast } = useToast()

	const publicProfileUrl = data.publicProfileUrl
	const { copiedToClipboard, copyToClipboard } = useCopyToClipboard()

	const validateAutosave = useCallback((values: ProfileAutosaveValues) => {
		const nextDisplayName = values.displayName.trim()

		return nextDisplayName.length >= 3 && nextDisplayName.length <= 40
	}, [])

	const getAutosavePayload = useCallback((values: ProfileAutosaveValues) => {
		return {
			intent: 'autosave-profile',
			displayName: values.displayName.trim(),
			isPublic: String(values.isPublic),
		}
	}, [])

	const isAutosaveSuccess = useCallback((actionData: ProfileActionData) => {
		return actionData.intent === 'autosave-profile' && actionData.success
	}, [])

	const getSavedValues = useCallback(
		(
			actionData: ProfileActionData,
			submittedValues: ProfileAutosaveValues,
		): ProfileAutosaveValues => {
			if (!actionData.success) return submittedValues

			return {
				displayName: actionData.updatedProfile.displayName,
				isPublic: actionData.updatedProfile.public,
			}
		},
		[],
	)

	const handleAutosaveError = useCallback(
		(actionData: ProfileActionData) => {
			if (actionData.success) return

			toast({
				title: t('something_went_wrong'),
				description: actionData.message,
				variant: 'destructive',
			})
		},
		[toast, t],
	)

	const autosave = useAutosaveFetcher<ProfileAutosaveValues, ProfileActionData>(
		{
			values: {
				displayName,
				isPublic,
			},
			lastSavedValues: {
				displayName: data.profile.displayName,
				isPublic: data.profile.public ?? false,
			},
			debounceMs: AUTOSAVE_DELAY_MS,
			validate: validateAutosave,
			getPayload: getAutosavePayload,
			isSuccess: isAutosaveSuccess,
			getSavedValues,
			onError: handleAutosaveError,
		},
	)

	useEffect(() => {
		setDisplayName(data.profile.displayName)
		setIsPublic(data.profile.public ?? false)

		autosave.resetLastSaved({
			displayName: data.profile.displayName,
			isPublic: data.profile.public ?? false,
		})
	}, [data.profile.displayName, data.profile.public, autosave.resetLastSaved])

	const handlePublicChange = useCallback(
		(checked: boolean) => {
			setIsPublic(checked)

			const nextValues = {
				displayName,
				isPublic: checked,
			}

			if (validateAutosave(nextValues)) {
				autosave.submit(nextValues)
			}
		},
		[autosave, displayName, validateAutosave],
	)

	const handleCopyPublicProfileUrl = async () => {
		const copied = await copyToClipboard(publicProfileUrl)

		if (!copied) return

		toast({
			title: t('copied'),
			variant: 'success',
		})
	}

	return (
		<Card className="dark:bg-dark-boxes space-y-6 dark:border-white">
			<CardHeader>
				<CardTitle>{t('profile_settings')}</CardTitle>
				<CardDescription>{t('profile_settings_description')}</CardDescription>
				<AutosaveStatusText status={autosave.status} namespace="settings" />
			</CardHeader>

			<CardContent className="flex">
				<div className="w-1/2 justify-center space-y-6">
					<div className="space-y-2">
						<div className="flex items-center space-x-2">
							<Label htmlFor="displayName">{t('displayName')}</Label>

							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<InfoIcon className="text-muted-foreground h-4 w-4" />
									</TooltipTrigger>
									<TooltipContent>
										<p>{t('if_public')}</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</div>

						<Input
							minLength={3}
							maxLength={40}
							type="text"
							id="displayName"
							name="displayName"
							placeholder={t('enter_display_name')}
							value={displayName}
							onChange={(event) => setDisplayName(event.target.value)}
						/>
					</div>

					<div className="space-y-2">
						<div className="flex items-center space-x-2">
							<Label htmlFor="isPublic">{t('public_profile')}</Label>

							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<InfoIcon className="text-muted-foreground h-4 w-4" />
									</TooltipTrigger>
									<TooltipContent>
										<p>
											{t('if_activated_public_1')}{' '}
											<Link to="/profile/me" target="__blank">
												<span className="underline">
													{t('if_activated_public_2')}
												</span>
											</Link>
											{t('if_activated_public_3')}
										</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</div>

						<Switch
							id="isPublic"
							name="isPublic"
							checked={isPublic}
							onCheckedChange={handlePublicChange}
						/>

						{isPublic && (
							<div className="mt-3 space-y-2">
								<Label htmlFor="publicProfileUrl">
									{t('public_profile_link')}
								</Label>

								<div className="flex gap-2">
									<Input
										id="publicProfileUrl"
										value={publicProfileUrl}
										readOnly
										onFocus={(event) => event.target.select()}
									/>

									<Button
										type="button"
										variant="outline"
										onClick={handleCopyPublicProfileUrl}
									>
										{copiedToClipboard ? (
											<CopyCheckIcon className="h-4 w-4" />
										) : (
											<CopyIcon className="h-4 w-4" />
										)}
									</Button>
								</div>
							</div>
						)}
					</div>
				</div>

				<div className="flex w-1/2 justify-center">
					<div className="relative h-52 w-52">
						<Avatar className="h-full w-full">
							<AvatarImage
								className="aspect-auto h-full w-full rounded-full object-cover"
								src={'/resources/file/' + data.profile.profileImage?.id}
							/>
							<AvatarFallback>
								{getInitials(data.profile?.displayName ?? '')}
							</AvatarFallback>
						</Avatar>

						<Link
							preventScrollReset
							to="photo"
							className="border-night-700 bg-night-500 pointer-events-auto absolute top-3 -right-3 flex h-4 w-4 items-center justify-center rounded-full border-4 p-5"
							title={t('change_profile_photo')}
							aria-label={t('change_profile_photo')}
						>
							&#x270E;
						</Link>
					</div>
				</div>
			</CardContent>

			<Outlet />
		</Card>
	)
}
