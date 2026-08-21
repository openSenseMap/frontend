import { data as responseData, redirect } from 'react-router'
import { type Route } from './+types/device.new'
import ValidationStepperForm from '~/components/device/new/new-device-stepper'
import { NavBar } from '~/components/nav-bar'
import { getIntegrations } from '~/db/models/integration.server'
import { createDevice } from '~/services/device-service.server'
import { createDeviceIntegrations } from '~/services/integration-service.server'
import { getUser, getUserId } from '~/services/session-service.server'
import { calculateHeightAboveSeaLevel } from '~/lib/elevation'
import { newDeviceSubmissionSchema } from '~/lib/new-device-form'
import {
	ElevationLookupError,
	getTerrainElevation,
} from '~/services/elevation-service.server'

export type NewDeviceActionData = {
	ok: false
	error:
		| 'invalid_device_form'
		| 'elevation_required_error'
		| 'device_creation_failed'
}

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
	const rawData = formData.get('formData')
	const userId = await getUserId(request)

	if (!userId) return redirect('/explore/login')

	if (typeof rawData !== 'string') {
		return responseData<NewDeviceActionData>(
			{ ok: false, error: 'invalid_device_form' },
			{ status: 400 },
		)
	}

	let submittedData: unknown

	try {
		submittedData = JSON.parse(rawData) as unknown
	} catch {
		return responseData<NewDeviceActionData>(
			{ ok: false, error: 'invalid_device_form' },
			{ status: 400 },
		)
	}

	const parsedSubmission = newDeviceSubmissionSchema.safeParse(submittedData)

	if (!parsedSubmission.success) {
		return responseData<NewDeviceActionData>(
			{ ok: false, error: 'invalid_device_form' },
			{ status: 400 },
		)
	}

	const submission = parsedSubmission.data
	const generalInfo = submission['general-info']
	const { model } = submission['device-selection']
	const sensorSelection = submission['sensor-selection']
	const selectedSensors = sensorSelection.selectedSensors
	const { latitude, longitude, heightAboveGround } = submission.location
	let terrainElevation

	try {
		terrainElevation = await getTerrainElevation(latitude, longitude)
	} catch (error) {
		console.error(
			'Could not calculate device height above sea level:',
			error instanceof ElevationLookupError ? error.code : error,
		)

		return responseData<NewDeviceActionData>(
			{ ok: false, error: 'elevation_required_error' },
			{ status: 503 },
		)
	}

	const finalHeight = calculateHeightAboveSeaLevel(
		terrainElevation.elevation,
		heightAboveGround,
	)

	try {
		const commonDevicePayload = {
			name: generalInfo.name,
			description: generalInfo.description?.trim() || null,
			exposure: generalInfo.exposure,
			expiresAt: generalInfo.temporaryExpirationDate?.toISOString(),
			tags: generalInfo.tags?.map((tag) => tag.value) ?? [],
			latitude,
			longitude,
			height: finalHeight,
		}

		const devicePayload =
			model === 'custom'
				? {
						...commonDevicePayload,
						model,
						sensors: selectedSensors.map((sensor) => ({
							title: sensor.title,
							sensorType: sensor.sensorType,
							unit: sensor.unit,
							icon: sensor.icon,
						})),
						deviceSchema: sensorSelection.deviceSchema,
						deviceSchemaVersionId: sensorSelection.deviceSchemaVersionId,
					}
				: {
						...commonDevicePayload,
						model,
						sensorTemplates: selectedSensors.flatMap((sensor) =>
							sensor.id ? [sensor.id] : [],
						),
					}

		const newDevice = await createDevice(userId, devicePayload)

		await createDeviceIntegrations(newDevice.id, submission.advanced)

		return redirect('/profile/me')
	} catch (error) {
		console.error('Error creating device:', error)
		return responseData<NewDeviceActionData>(
			{ ok: false, error: 'device_creation_failed' },
			{ status: 500 },
		)
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
