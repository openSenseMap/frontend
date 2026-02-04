import { Label } from '@radix-ui/react-label'
import {
	LucideCopy,
	LucideEye,
	LucideEyeOff,
	RefreshCw,
	Save,
} from 'lucide-react'
import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { type LoaderFunctionArgs, redirect, Form } from 'react-router'
import { Checkbox } from '@/components/ui/checkbox'
import ErrorMessage from '~/components/error-message'
import { Callout } from '~/components/ui/alert'
import { getUserId } from '~/utils/session.server'

export async function loader({ request }: LoaderFunctionArgs) {
	//* if user is not logged in, redirect to home
	const userId = await getUserId(request)
	if (!userId) return redirect('/')

	return ''
}

export async function action() {
	return ''
}

export default function EditBoxSecurity() {
	const { t } = useTranslation('settings')
	const [keyVisible, setTokenvisibility] = useState(false)

	const copyKeyToClipboard = async () => {
		const key = 'dummy token'
		await navigator.clipboard.writeText(key)
	}

	return (
		<Form method="post" className="font-helvetica text-[14px]" noValidate>
			<div className="mt-2 flex justify-between">
				<h1 className="text-4xl">{t('device_security.page_title')}</h1>
				<button
					name="intent"
					value="save"
					className="h-12 w-12 rounded-full border-[1.5px] border-[#9b9494] hover:bg-[#e7e6e6]"
				>
					<Save className="mx-auto h-5 w-5 lg:h-7 lg:w-7" />
				</button>
			</div>

			<hr className="my-3 mt-6 h-px border-0 bg-[#dcdada] dark:bg-gray-700" />

			<p className="py-4">
				<Trans t={t} i18nKey="device_security.explanation_text">
					Devices should use their API key shown on this page to authenticate
					requests sent to the openSenseMap API. This ensures that only
					authenticated devices update the state of the device on openSenseMap.
					The API key is appended to every request made to the API. More
					information can be found{' '}
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
				<Checkbox id="enableAuth" />
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
							className="btn btn-default w-12 rounded-br-none rounded-tr-none"
							onClick={() => setTokenvisibility(!keyVisible)}
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
						id="api-key"
						defaultValue="dummy token"
						className="form-control rounded-none border-[#ccc;]"
						type={keyVisible ? 'text' : 'password'}
						disabled
					/>
					<span>
						<button
							className="btn btn-default w-12 rounded-bl-none rounded-tl-none"
							onClick={() => copyKeyToClipboard()}
							type="button"
						>
							<LucideCopy size={20.5} />
						</button>
					</span>
				</div>
			</div>
			<br />

			<Callout variant="warning">
				<p>
					<Trans t={t} i18nKey="device_security.generate_new_key_warning">
						Generating a new key will require you to update your device (e.g.
						change the sketch/ code).
						<b>This step can not be undone.</b>
					</Trans>
				</p>
				<button className="btn flex items-center space-x-2 bg-[#e9e9ed]">
					<RefreshCw className="mr-2 inline h-4 w-4 align-sub" />
					{t('device_security.generate_new_key_button')}
				</button>
			</Callout>
		</Form>
	)
}

export function ErrorBoundary() {
	return (
		<div className="flex h-full w-full items-center justify-center">
			<ErrorMessage />
		</div>
	)
}
