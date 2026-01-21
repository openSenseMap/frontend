import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import {
	redirect,
	Link,
	useLoaderData,
	Form,
	type LoaderFunctionArgs,
} from 'react-router'
import { useTranslation } from 'react-i18next'
import ErrorMessage from '~/components/error-message'
import { NavBar } from '~/components/nav-bar'
import { Button } from '~/components/ui/button'
import { Textarea } from '~/components/ui/textarea'
import { getDeviceWithoutSensors } from '~/models/device.server'
import { getSensorsFromDevice } from '~/models/sensor.server'
import { getUserId } from '~/utils/session.server'

//*****************************************************
export async function loader({ request, params }: LoaderFunctionArgs) {
	//* if user is not logged in, redirect to home
	const userId = await getUserId(request)
	if (!userId) return redirect('/')

	if (!params.deviceId) {
		throw new Response('Device not found', { status: 502 })
	}
	//* get device data
	const deviceData = await getDeviceWithoutSensors({ id: params.deviceId })
	//* get sensors data
	const sensorsData = await getSensorsFromDevice(params.deviceId)

	return { deviceData, sensorsData }
}

//*****************************************************
export async function action() {
	return {}
}

//**********************************
export default function DeviceOnverview() {
	const { deviceData } = useLoaderData<typeof loader>()
	const [sketch, setSketch] = useState(String || null)
	const { t } = useTranslation('script')

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		if (!deviceData?.id) return

		const formData = new FormData(event.currentTarget)

		const enableDebug = (formData.get('enable_debug') !== null).toString()
		const displayEnabled = (formData.get('display_enabled') !== null).toString()

		const params = new URLSearchParams()
		for (const [key, value] of formData.entries()) {
			if (typeof value === 'string') params.append(key, value)
		}

		params.set('enable_debug', enableDebug)
		params.set('display_enabled', displayEnabled)

		const response = await fetch(
			`/api/boxes/${deviceData.id}/script?${params.toString()}`,
			{ method: 'GET' },
		)

		const text = await response.text()
		setSketch(text)
	}

	return (
		<div className="h-full bg-slate-100">
			<NavBar />
			<div className="flex w-full flex-col gap-6 p-8 md:flex-row md:gap-8 md:pt-4">
				<div className="rounded text-[#676767]">
					<Link to="/profile/me">
						{' '}
						<ArrowLeft className="mr-2 inline h-5 w-5" />
						{t('back_to_dashboard')}
					</Link>
				</div>
				<div className="flex-grow bg-white p-4 dark:bg-dark-boxes dark:text-dark-text">
					<Form method="post" noValidate onSubmit={handleSubmit}>
						{/* Heading */}
						<div>
							{/* Title */}
							<div className="mt-2 flex justify-between">
								<div>
									<span className="text-2xl font-bold text-light-green dark:text-dark-green">
										{t('configuration')}
									</span>
								</div>
							</div>
						</div>

						{/* divider */}
						<hr className="my-3 mt-6 h-px border-0 bg-[#dcdada] dark:bg-gray-700" />

						<div className="space-y-5 pt-4">
							{/* <Form method="post" className="space-y-6" noValidate> */}
							{/* PORT */}
							<div>
								<label
									htmlFor="port"
									className="txt-base block font-bold tracking-normal"
								>
									{t('fine_dust_port')}
								</label>

								<div className="mt-1">
									<select
										id="port"
										name="port"
										onChange={(e) => console.log(e)}
										className="w-full appearance-auto rounded border border-gray-200 px-2 py-1.5 text-base"
									>
										<option value="Serial1">{t('serial_1')}</option>
										<option value="Serial2">{t('serial_2')}</option>
									</select>
								</div>
							</div>

							{/* Soil moisture & temp port */}
							<div>
								<label
									htmlFor="soilDigitalPort"
									className="txt-base block font-bold tracking-normal"
								>
									{t('soil_moisture_temp')}
								</label>

								<div className="mt-1">
									<select
										id="soilDigitalPort"
										name="soilDigitalPort"
										onChange={(e) => console.log(e)}
										className="w-full appearance-auto rounded border border-gray-200 px-2 py-1.5 text-base"
									>
										<option value="A">A</option>
										<option value="B">B</option>
										<option value="C">C</option>
									</select>
								</div>
							</div>

							{/* sound port */}
							<div>
								<label
									htmlFor="soundMeterPort"
									className="txt-base block font-bold tracking-normal"
								>
									{t('sound_level_port')}
								</label>

								<div className="mt-1">
									<select
										id="soundMeterPort"
										name="soundMeterPort"
										onChange={(e) => console.log(e)}
										className="w-full appearance-auto rounded border border-gray-200 px-2 py-1.5 text-base"
									>
										<option value="A">A</option>
										<option value="B">B</option>
										<option value="C">C</option>
									</select>
								</div>
							</div>

							{/* Windspeed port */}
							<div>
								<label
									htmlFor="windSpeedPort"
									className="txt-base block font-bold tracking-normal"
								>
									{t('wind_port')}
								</label>

								<div className="mt-1">
									<select
										id="windSpeedPort"
										name="windSpeedPort"
										className="w-full appearance-auto rounded border border-gray-200 px-2 py-1.5 text-base"
									>
										<option value="A">A</option>
										<option value="B">B</option>
										<option value="C">C</option>
									</select>
								</div>
							</div>

							{/* WIFI SSID */}
							<div>
								<label
									htmlFor="ssid"
									className="txt-base block font-bold tracking-normal"
								>
									{t('wifi_ssid')}
								</label>

								<div className="mt-1">
									<input
										id="ssid"
										required
										autoFocus={true}
										name="ssid"
										type="text"
										aria-describedby="name-error"
										className="w-full rounded border border-gray-200 px-2 py-1 text-base"
									/>
								</div>
							</div>

							{/* WIFI PAasword */}
							<div>
								<label
									htmlFor="password"
									className="txt-base block font-bold tracking-normal"
								>
									{t('wifi_password')}
								</label>

								<div className="mt-1">
									<input
										id="password"
										required
										autoFocus={true}
										name="password"
										type="password"
										aria-describedby="name-error"
										className="w-full rounded border border-gray-200 px-2 py-1 text-base"
									/>
								</div>
							</div>
							<div className="flex flex-col gap-3">
								<label className="flex items-center gap-2">
									<input
										id="enable_debug"
										name="enable_debug"
										type="checkbox"
										className="h-4 w-4"
									/>
									<span className="txt-base font-bold tracking-normal">
										{t('enable_debug')}
									</span>
								</label>

								<label className="flex items-center gap-2">
									<input
										id="display_enabled"
										name="display_enabled"
										type="checkbox"
										className="h-4 w-4"
									/>
									<span className="txt-base font-bold tracking-normal">
										{t('display_enabled')}
									</span>
								</label>
							</div>

							<Button type="submit">{t('compile_sketch')}</Button>

							{/* </Form> */}
						</div>
					</Form>
					<div className="py-6">
						<span className="py-1 text-sm text-gray-500 dark:text-gray-400">
							{t('your_sketch')}
						</span>
						<Textarea
							id="mqtt-connection-options"
							placeholder={t('enter_connection_options')}
							className="!min-h-[320px] resize-none"
							value={sketch}
						/>
					</div>
				</div>
			</div>
		</div>
	)
}

export function ErrorBoundary() {
	return (
		<div className="flex h-screen w-screen items-center justify-center">
			<ErrorMessage />
		</div>
	)
}
