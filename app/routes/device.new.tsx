import { type ActionFunctionArgs, redirect, type LoaderFunctionArgs } from "react-router";
import ValidationStepperForm from "~/components/device/new/new-device-stepper";
import { NavBar } from "~/components/nav-bar";
import { createDeviceIntegrations } from "~/lib/integration-service.server";
import { createDevice } from "~/models/device.server";
import { getIntegrations } from "~/models/integration.server";
import { getUser, getUserId } from "~/utils/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
	const user = await getUser(request)
	if (!user) {
		return redirect('/login')
	}
	const integrations = await getIntegrations();

  return { integrations };
}

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData()
	const rawData = formData.get('formData') as string

	try {
		const userId = await getUserId(request)

		if (!userId) {
			throw new Error('User is not authenticated.')
		}

    const data = JSON.parse(rawData);
    const advanced = data.advanced;

    const selectedSensors = data['sensor-selection'].selectedSensors

    
		const devicePayload = {
			name: data['general-info'].name,
			exposure: data['general-info'].exposure,
			expiresAt: data['general-info'].temporaryExpirationDate,
			tags:
				data['general-info'].tags?.map((tag: { value: string }) => tag.value) ||
				[],
			latitude: data.location.latitude,
			longitude: data.location.longitude,

			...(data['device-selection'].model !== 'custom' && {
				model: data['device-selection'].model,

				sensorTemplates: selectedSensors.map((sensor: any) => sensor.id),
			}),

			...(data['device-selection'].model === 'custom' && {
				sensors: selectedSensors.map((sensor: any) => ({
					title: sensor.title,
					sensorType: sensor.sensorType,
					unit: sensor.unit,
					icon: sensor.icon,
				})),
			}),
    };

    const newDevice = await createDevice(devicePayload, userId);

    await createDeviceIntegrations(newDevice.id, advanced);

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
			<div className="flex-grow overflow-auto bg-gray-100">
				<div className="flex h-full w-full justify-center py-10">
					<div className="flex h-full w-full items-center justify-center rounded-lg p-6 dark:bg-transparent dark:text-dark-text dark:shadow-none">
						<ValidationStepperForm />
					</div>
				</div>
			</div>
		</div>
	)
}
