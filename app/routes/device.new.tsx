import { redirect } from 'react-router'
import { type Route } from './+types/device.new'
import ValidationStepperForm from '~/components/device/new/new-device-stepper'
import { NavBar } from '~/components/nav-bar'
import { getIntegrations } from '~/db/models/integration.server'
import { createDevice } from '~/services/device-service.server'
import { createDeviceIntegrations } from '~/services/integration-service.server'
import { getUser, getUserId } from '~/services/session-service.server'
import { getElevation, calculateFinalHeight } from '~/services/elevation.service'

export async function loader({ request }: Route.LoaderArgs) {
	const user = await getUser(request)
	if (!user) {
		return redirect('/explore/login')
	}
	const integrations = await getIntegrations()

	return { integrations }
}

export async function action({ request }: Route.ActionArgs) {
	const formData = await request.formData()
	const rawData = formData.get('formData') as string

	try {
		const userId = await getUserId(request)

		if (!userId) {
			throw new Error('User is not authenticated.')
		}

		const data = JSON.parse(rawData)
		const advanced = data.advanced

		const selectedSensors = data['sensor-selection'].selectedSensors

		// Get coordinates
		const latitude = data.location.latitude
		const longitude = data.location.longitude

		// Get height above ground from user input
		const heightAboveGround = data.location.height

		// Fetch terrain elevation from OpenTopoData API
		let finalHeight: number | null | undefined = heightAboveGround
		if (latitude !== undefined && longitude !== undefined) {
			const terrainElevation = await getElevation(latitude, longitude)
			finalHeight = calculateFinalHeight(terrainElevation, heightAboveGround)

			// If elevation fetch failed, log but continue with heightAboveGround as fallback
			if (finalHeight === null && terrainElevation === null && heightAboveGround !== undefined) {
				console.warn('Terrain elevation not available, using height above ground as final height')
				finalHeight = heightAboveGround
			}
		}

		const devicePayload = {
			name: data['general-info'].name.trim(),
			description: data['general-info'].description?.trim() || null,
			exposure: data['general-info'].exposure,
			expiresAt: data['general-info'].temporaryExpirationDate,
			tags:
				data['general-info'].tags?.map((tag: { value: string }) => tag.value) ||
				[],
			latitude: data.location.latitude,
			longitude: data.location.longitude,
			height: finalHeight,

			...(data['device-selection'].model !== 'custom' && {
				model: data['device-selection'].model,

				sensorTemplates: selectedSensors.map((sensor: any) => sensor.id),
			}),

			...(data['device-selection'].model === 'custom' && {
				model: data['device-selection'].model,
				sensors: selectedSensors.map((sensor: any) => ({
					title: sensor.title,
					sensorType: sensor.sensorType,
					unit: sensor.unit,
					icon: sensor.icon,
				})),
				deviceSchema: data['sensor-selection'].deviceSchema,
				deviceSchemaVersionId: data['sensor-selection'].deviceSchemaVersionId,
			}),
		}

		const newDevice = await createDevice(userId, devicePayload)

		await createDeviceIntegrations(newDevice.id, advanced)

		return redirect('/profile/me')
	} catch (error) {
		console.error('Error creating device:', error)
		return redirect('/profile/me')
	}
}

export default function NewDevice() {
	return (
		<div className="flex h-screen flex-col">
			<NavBar />
			<div className="bg-background grow overflow-auto">
				<div className="flex h-full w-full justify-center py-10">
					<div className="dark:text-dark-text flex h-full w-full items-center justify-center rounded-lg p-6 dark:bg-transparent dark:shadow-none">
						<ValidationStepperForm />
					</div>
				</div>
			</div>
		</div>
	)
}
