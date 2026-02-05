import { Label } from '@radix-ui/react-label'
import {
	LucideCopy,
	LucideCopyCheck,
	LucideEye,
	LucideEyeOff,
	RefreshCw,
	Save,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import {
	type LoaderFunctionArgs,
	redirect,
	Form,
	useLoaderData,
	type ActionFunctionArgs,
} from 'react-router'
import { Checkbox } from '@/components/ui/checkbox'
import ErrorMessage from '~/components/error-message'
import { Callout } from '~/components/ui/alert'
import {
	addOrReplaceDeviceApiKey,
	findDeviceApiKey,
	getDevice,
	updateDevice,
} from '~/models/device.server'
import { getUserId } from '~/utils/session.server'

export async function loader({ request, params }: LoaderFunctionArgs) {
	//* if user is not logged in, redirect to home
	const userId = await getUserId(request)
	if (!userId) return redirect('/')

	const deviceId = params.deviceId
	if (typeof deviceId !== 'string') throw 'deviceID not found'

	const t = await findDeviceApiKey(deviceId)
	const device = await getDevice({ id: deviceId })
	return { key: t?.apiKey, deviceAuthEnabled: device?.useAuth ?? false }
}

export async function action({ request, params }: ActionFunctionArgs) {
	const { deviceId } = params
	if (typeof deviceId !== 'string') throw 'deviceID not found'

	switch (request.method) {
		case 'POST':
			const formData = await request.formData()
			const enableAuth = formData.has('enableAuth')
			await updateDevice(deviceId, { useAuth: enableAuth })
			break
		case 'PUT':
			const device = await getDevice({ id: deviceId })
			if (device === undefined) throw 'device not found'
			await addOrReplaceDeviceApiKey(device)
			break
	}

	return ''
}

export default function EditBoxSecurity() {
	const { t } = useTranslation('settings')
	const { key, deviceAuthEnabled } = useLoaderData<typeof loader>()
	const [keyVisible, setTokenvisibility] = useState(false)
	const [authEnabled, setAuthEnabled] = useState(deviceAuthEnabled)
	const [copiedToClipboard, setCopiedToClipboard] = useState(false)

	const copyKeyToClipboard = async () => {
		if (!key) return
		await navigator.clipboard.writeText(key)
		setCopiedToClipboard(true)
	}

	useEffect(() => {
		if (!copiedToClipboard) return
		const timer = window.setTimeout(() => {
			setCopiedToClipboard(false)
		}, 2_500)

		return () => {
			window.clearTimeout(timer)
		}
	}, [copiedToClipboard])

	return (
		<div className="font-helvetica text-[14px]">
			<Form method="POST" noValidate>
				<div className="mt-2 flex justify-between">
					<h1 className="text-4xl">{t('device_security.page_title')}</h1>
					<button className="h-12 w-12 rounded-full border-[1.5px] border-[#9b9494] hover:bg-[#e7e6e6]">
						<Save className="mx-auto h-5 w-5 lg:h-7 lg:w-7" />
					</button>
				</div>

				<hr className="my-3 mt-6 h-px border-0 bg-[#dcdada] dark:bg-gray-700" />

				<p className="py-4">
					<Trans t={t} i18nKey="device_security.explanation_text">
						Devices should use their API key shown on this page to authenticate
						requests sent to the openSenseMap API. This ensures that only
						authenticated devices update the state of the device on
						openSenseMap. The API key is appended to every request made to the
						API. More information can be found{' '}
						<a
							href="https://docs.opensensemap.org/#api-Measurements-postNewMeasurement"
							className="underline"
						>
							in the docs
						</a>
						.
					</Trans>
				</p>

				<Callout variant="caution">
					{t('device_security.warning_deactive_auth')}
				</Callout>

				<div className="flex flex-wrap items-center gap-4 py-5">
					<Checkbox
						name="enableAuth"
						id="enableAuth"
						defaultChecked={authEnabled}
						value="true"
						onChange={() => setAuthEnabled(!authEnabled)}
					/>
					<Label htmlFor="enableAuth" className="cursor-pointer pt-1">
						{t('device_security.auth_enable_checkbox_label')}
					</Label>
				</div>

				<div>
					<Label htmlFor="api-key" className="cursor-pointer">
						{t('device_security.api_key_label')}
					</Label>
					<div className="mt-1 flex">
						<span>
							<button
								className="btn btn-default w-12 rounded-br-none rounded-tr-none disabled:opacity-40"
								onClick={() => setTokenvisibility(!keyVisible)}
								disabled={!deviceAuthEnabled}
								type="button"
							>
								{keyVisible ? (
									<LucideEyeOff size={20.5} />
								) : (
									<LucideEye size={20.5} />
								)}
							</button>
						</span>
						<input
							name="api-key"
							value={key}
							className="form-control rounded-none border-[#ccc;]"
							type={keyVisible ? 'text' : 'password'}
							disabled
						/>
						<span>
							<button
								className="btn btn-default relative h-full w-12 rounded-bl-none rounded-tl-none disabled:opacity-40"
								onClick={() => copyKeyToClipboard()}
								type="button"
								disabled={!deviceAuthEnabled}
							>
								<LucideCopyCheck
									size={20.5}
									className={`bottom-0 left-0 right-0 top-0 mx-auto my-auto ${copiedToClipboard ? 'scale-100 opacity-100' : 'scale-50 opacity-0'} absolute text-green-700 transition-transform`}
								/>
								<LucideCopy
									size={20.5}
									className={`bottom-0 left-0 right-0 top-0 mx-auto my-auto ${copiedToClipboard ? 'opacity-0' : 'opacity-100'} absolute`}
								/>
							</button>
						</span>
					</div>
				</div>
				<br />
			</Form>
			<Form method="PUT">
				<Callout variant="warning">
					<p>
						<Trans t={t} i18nKey="device_security.generate_new_key_warning">
							Generating a new key will require you to update your device (e.g.
							change the sketch/ code).
							<b>This step can not be undone.</b>
						</Trans>
					</p>
					<button
						className="btn flex items-center space-x-2 bg-[#e9e9ed] disabled:opacity-40"
						disabled={!deviceAuthEnabled}
					>
						<RefreshCw className="mr-2 inline h-4 w-4 align-sub" />
						{t('device_security.generate_new_key_button')}
					</button>
				</Callout>
			</Form>
		</div>
	)
}

export function ErrorBoundary() {
	return (
		<div className="flex h-full w-full items-center justify-center">
			<ErrorMessage />
		</div>
	)
}
