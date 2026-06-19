import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLoaderData } from 'react-router'
import { type Route } from './+types/settings.preferences'
import { AutosaveStatusText } from '~/components/autosave-status.text'
import { LanguageSelect } from '~/components/language-select'
import { ThemeSelect } from '~/components/theme-select'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Input, numberInputWithoutSteppers } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { useToast } from '~/components/ui/use-toast'
import {
	AUTOSAVE_DELAY_MS,
	useAutosaveFetcher,
} from '~/hooks/use-autosave-fetcher'
import {
	isOptionalMapViewInputValid,
	MAP_ZOOM_LIMITS,
	parseOptionalMapViewportInput,
} from '~/lib/location'
import { getProfileByUserId, updateProfile } from '~/db/models/profile.server'
import { requireUserId } from '~/services/session-service.server'

const DEFAULT_HOME_ZOOM = String(MAP_ZOOM_LIMITS.default)
export async function loader({ request }: Route.LoaderArgs) {
	const userId = await requireUserId(request)
	const profile = await getProfileByUserId(userId)

	if (!profile) {
		throw new Error('User profile not found')
	}

	return { profile }
}

export type PreferencesActionData =
	| {
			intent: 'autosave-map-preferences'
			success: true
			updatedProfile: {
				homeLatitude: number | null
				homeLongitude: number | null
				homeZoom: number | null
			}
	  }
	| {
			intent: 'autosave-map-preferences'
			success: false
			message: string
	  }

export async function action({
	request,
}: Route.ActionArgs): Promise<PreferencesActionData> {
	const userId = await requireUserId(request)
	const profile = await getProfileByUserId(userId)

	if (!profile) {
		return {
			intent: 'autosave-map-preferences',
			success: false,
			message: 'Something went wrong.',
		}
	}

	const formData = await request.formData()
	const intent = String(formData.get('intent') ?? '')
	const mapViewInput = {
		latitude: String(formData.get('homeLatitude') ?? ''),
		longitude: String(formData.get('homeLongitude') ?? ''),
		zoom: String(formData.get('homeZoom') ?? ''),
	}

	if (intent !== 'autosave-map-preferences') {
		return {
			intent: 'autosave-map-preferences',
			success: false,
			message: 'Invalid intent.',
		}
	}

	const parsedMapView = parseOptionalMapViewportInput(mapViewInput)

	if (!parsedMapView.success) {
		return {
			intent: 'autosave-map-preferences',
			success: false,
			message: parsedMapView.message,
		}
	}

	const updatedProfile = await updateProfile(profile.id, {
		displayName: profile.displayName,
		public: profile.public ?? false,
		homeLatitude: parsedMapView.data.latitude,
		homeLongitude: parsedMapView.data.longitude,
		homeZoom: parsedMapView.data.zoom,
	})

	if (!updatedProfile) {
		return {
			intent: 'autosave-map-preferences',
			success: false,
			message: 'Map preferences could not be updated.',
		}
	}

	return {
		intent: 'autosave-map-preferences',
		success: true,
		updatedProfile: {
			homeLatitude: updatedProfile.homeLatitude,
			homeLongitude: updatedProfile.homeLongitude,
			homeZoom: updatedProfile.homeZoom,
		},
	}
}

type MapPreferenceAutosaveValues = {
	homeLatitude: string
	homeLongitude: string
	homeZoom: string
}

function hasCompleteHomeLocation(values: Pick<
	MapPreferenceAutosaveValues,
	'homeLatitude' | 'homeLongitude'
>) {
	return (
		values.homeLatitude.trim().length > 0 &&
		values.homeLongitude.trim().length > 0
	)
}

function normalizeMapPreferenceValues(
	values: MapPreferenceAutosaveValues,
): MapPreferenceAutosaveValues {
	return {
		...values,
		homeZoom: hasCompleteHomeLocation(values)
			? values.homeZoom
			: DEFAULT_HOME_ZOOM,
	}
}

export default function PreferencesSettingsPage() {
	const data = useLoaderData<typeof loader>()
	const { t } = useTranslation('settings')
	const { toast } = useToast()

	const [homeLatitude, setHomeLatitude] = useState(
		data.profile.homeLatitude?.toString() ?? '',
	)
	const [homeLongitude, setHomeLongitude] = useState(
		data.profile.homeLongitude?.toString() ?? '',
	)
	const [homeZoom, setHomeZoom] = useState(
		data.profile.homeZoom?.toString() ?? DEFAULT_HOME_ZOOM,
	)
	const autosaveValues = normalizeMapPreferenceValues({
		homeLatitude,
		homeLongitude,
		homeZoom,
	})
	const homeZoomEnabled = hasCompleteHomeLocation(autosaveValues)

	const validateAutosave = useCallback(
		(values: MapPreferenceAutosaveValues) => {
			return isOptionalMapViewInputValid({
				latitude: values.homeLatitude,
				longitude: values.homeLongitude,
				zoom: values.homeZoom,
			})
		},
		[],
	)

	const getAutosavePayload = useCallback(
		(values: MapPreferenceAutosaveValues) => ({
			intent: 'autosave-map-preferences',
			homeLatitude: values.homeLatitude.trim(),
			homeLongitude: values.homeLongitude.trim(),
			homeZoom: values.homeZoom.trim(),
		}),
		[],
	)

	const isAutosaveSuccess = useCallback((actionData: PreferencesActionData) => {
		return (
			actionData.intent === 'autosave-map-preferences' && actionData.success
		)
	}, [])

	const getSavedValues = useCallback(
		(actionData: PreferencesActionData): MapPreferenceAutosaveValues => {
			if (!actionData.success) {
				return {
					homeLatitude,
					homeLongitude,
					homeZoom,
				}
			}

			return {
				homeLatitude: actionData.updatedProfile.homeLatitude?.toString() ?? '',
				homeLongitude:
					actionData.updatedProfile.homeLongitude?.toString() ?? '',
				homeZoom:
					actionData.updatedProfile.homeZoom?.toString() ?? DEFAULT_HOME_ZOOM,
			}
		},
		[homeLatitude, homeLongitude, homeZoom],
	)

	const handleAutosaveError = useCallback(
		(actionData: PreferencesActionData) => {
			if (actionData.success) return

			toast({
				title: t('something_went_wrong'),
				description: actionData.message,
				variant: 'destructive',
			})
		},
		[toast, t],
	)

	const autosave = useAutosaveFetcher<
		MapPreferenceAutosaveValues,
		PreferencesActionData
	>({
		values: autosaveValues,
		lastSavedValues: {
			homeLatitude: data.profile.homeLatitude?.toString() ?? '',
			homeLongitude: data.profile.homeLongitude?.toString() ?? '',
			homeZoom: data.profile.homeZoom?.toString() ?? DEFAULT_HOME_ZOOM,
		},
		debounceMs: AUTOSAVE_DELAY_MS,
		validate: validateAutosave,
		getPayload: getAutosavePayload,
		isSuccess: isAutosaveSuccess,
		getSavedValues,
		onError: handleAutosaveError,
	})

	useEffect(() => {
		const nextValues = {
			homeLatitude: data.profile.homeLatitude?.toString() ?? '',
			homeLongitude: data.profile.homeLongitude?.toString() ?? '',
			homeZoom: data.profile.homeZoom?.toString() ?? DEFAULT_HOME_ZOOM,
		}

		setHomeLatitude(nextValues.homeLatitude)
		setHomeLongitude(nextValues.homeLongitude)
		setHomeZoom(nextValues.homeZoom)
		autosave.resetLastSaved(nextValues)
	}, [
		data.profile.homeLatitude,
		data.profile.homeLongitude,
		data.profile.homeZoom,
		autosave.resetLastSaved,
	])

	const submitAutosave = useCallback(
		(nextValues: MapPreferenceAutosaveValues) => {
			const normalizedValues = normalizeMapPreferenceValues(nextValues)

			if (validateAutosave(normalizedValues)) {
				autosave.submit(normalizedValues)
			}
		},
		[autosave, validateAutosave],
	)

	const handleHomeLatitudeChange = useCallback(
		(value: string) => {
			setHomeLatitude(value)
			submitAutosave({
				homeLatitude: value,
				homeLongitude,
				homeZoom,
			})
		},
		[homeLongitude, homeZoom, submitAutosave],
	)

	const handleHomeLongitudeChange = useCallback(
		(value: string) => {
			setHomeLongitude(value)
			submitAutosave({
				homeLatitude,
				homeLongitude: value,
				homeZoom,
			})
		},
		[homeLatitude, homeZoom, submitAutosave],
	)

	const handleHomeZoomChange = useCallback(
		(value: string) => {
			setHomeZoom(value)

			if (!hasCompleteHomeLocation({ homeLatitude, homeLongitude })) return

			submitAutosave({
				homeLatitude,
				homeLongitude,
				homeZoom: value,
			})
		},
		[homeLatitude, homeLongitude, submitAutosave],
	)

	const clearHomeLocation = useCallback(() => {
		const nextValues = {
			homeLatitude: '',
			homeLongitude: '',
			homeZoom: DEFAULT_HOME_ZOOM,
		}

		setHomeLatitude(nextValues.homeLatitude)
		setHomeLongitude(nextValues.homeLongitude)
		setHomeZoom(nextValues.homeZoom)
		autosave.submit(nextValues)
	}, [autosave])

	return (
		<Card className="border-border bg-card text-card-foreground">
			<CardHeader>
				<CardTitle>{t('preferences')}</CardTitle>
				<AutosaveStatusText status={autosave.status} namespace="settings" />
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

				<div className="flex flex-col gap-4 py-4 last:pb-0">
					<div>
						<div className="text-foreground font-medium">
							{t('map_start_location')}
						</div>
						<div className="text-muted-foreground text-sm">
							{t('map_start_location_description')}
						</div>
					</div>

					<div className="grid gap-4 sm:grid-cols-3">
						<div className="space-y-2">
							<Label htmlFor="homeLatitude">{t('latitude')}</Label>
							<Input
								id="homeLatitude"
								name="homeLatitude"
								type="number"
								className={numberInputWithoutSteppers}
								inputMode="decimal"
								min={-90}
								max={90}
								step="any"
								placeholder="51.961563"
								value={homeLatitude}
								onChange={(event) =>
									handleHomeLatitudeChange(event.target.value)
								}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="homeLongitude">{t('longitude')}</Label>
							<Input
								id="homeLongitude"
								name="homeLongitude"
								type="number"
								className={numberInputWithoutSteppers}
								inputMode="decimal"
								min={-180}
								max={180}
								step="any"
								placeholder="7.628202"
								value={homeLongitude}
								onChange={(event) =>
									handleHomeLongitudeChange(event.target.value)
								}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="homeZoom">{t('zoom')}</Label>
							<Input
								id="homeZoom"
								name="homeZoom"
								type="number"
								inputMode="decimal"
								min={MAP_ZOOM_LIMITS.min}
								max={MAP_ZOOM_LIMITS.max}
								step={0.5}
								disabled={!homeZoomEnabled}
								value={homeZoom}
								onChange={(event) => handleHomeZoomChange(event.target.value)}
							/>
						</div>
					</div>

					<div>
						<Button type="button" variant="outline" onClick={clearHomeLocation}>
							{t('clear_home_location')}
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
