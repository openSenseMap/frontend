import { Check, Copy, Info } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import {
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
	Form,
	redirect,
	useActionData,
	useLoaderData,
	useNavigation,
} from 'react-router'
import ErrorMessage from '~/components/error-message'
import { getBoxTransfer, createBoxTransfer } from '~/lib/transfer-service.server'
import { getDevice } from '~/models/device.server'
import  { type Claim } from '~/schema'
import { getUserId } from '~/utils/session.server'

type LoaderData = {
	deviceId: string
	deviceName: string
	existingTransfer: Claim | null
}

type ActionData = {
	success: boolean
	message?: string
	error?: string
	transfer?: Claim
}

export async function loader({
	request,
	params,
}: LoaderFunctionArgs): Promise<LoaderData | Response> {
	const userId = await getUserId(request)
	if (!userId) return redirect('/')

	const deviceId = params.deviceId
	if (!deviceId) {
		throw new Response('Missing deviceId', { status: 400 })
	}

	const device = await getDevice({ id: deviceId })
	if (!device) {
		throw new Response('Device not found', { status: 404 })
	}

	if (device.user.id !== userId) {
		throw new Response('Forbidden', { status: 403 })
	}

	let existingTransfer: Claim | null = null

	try {
		existingTransfer = await getBoxTransfer(userId, deviceId)
	} catch (err) {
		const message = err instanceof Error ? err.message : ''
		if (
			!message.includes('Transfer not found') &&
			!message.includes('expired')
		) {
			throw err
		}
	}

	return {
		deviceId,
		deviceName: device.name ?? device.id,
		existingTransfer,
	}
}

export async function action({
	request,
	params,
}: ActionFunctionArgs): Promise<ActionData | Response> {
	const userId = await getUserId(request)
	if (!userId) return redirect('/')

	const deviceId = params.deviceId
	if (!deviceId) {
		return {
			success: false,
			error: 'Missing deviceId',
		}
	}

	const formData = await request.formData()
	const expiration = formData.get('expiration')?.toString()
	const confirmation = formData.get('type')?.toString()?.trim()

	const device = await getDevice({ id: deviceId })
	if (!device) {
		return {
			success: false,
			error: 'Device not found',
		}
	}

	const deviceName = device.name ?? device.id

	if (confirmation !== deviceName) {
		return {
			success: false,
			error: `Please type "${deviceName}" to confirm.`,
		}
	}

	const days = Number(expiration)
	if (!Number.isFinite(days) || days <= 0) {
		return {
			success: false,
			error: 'Invalid expiration value',
		}
	}

	const expiresAt = new Date()
	expiresAt.setDate(expiresAt.getDate() + days)

	try {
		const transfer = await createBoxTransfer(
			userId,
			deviceId,
			expiresAt.toISOString(),
		)

		return {
			success: true,
			message: 'Device successfully prepared for transfer',
			transfer,
		}
	} catch (err) {
		return {
			success: false,
			error:
				err instanceof Error ? err.message : 'Failed to create transfer.',
		}
	}
}

export default function EditDeviceTransfer() {
	const { deviceName, existingTransfer } = useLoaderData<typeof loader>()
	const actionData = useActionData<typeof action>()
	const navigation = useNavigation()
	const { t } = useTranslation('device-transfer')

	const [copied, setCopied] = useState(false)

	const isSubmitting = navigation.state === 'submitting'
	const transfer = actionData?.transfer ?? existingTransfer
	const transferToken = transfer?.token
	const transferExpiresAt = transfer?.expiresAt

	useEffect(() => {
		if (!copied) return
		const timeout = window.setTimeout(() => setCopied(false), 2000)
		return () => window.clearTimeout(timeout)
	}, [copied])

	const handleCopyToken = async () => {
		if (!transferToken) return

		try {
			await navigator.clipboard.writeText(transferToken)
			setCopied(true)
		} catch (err) {
			console.error('Failed to copy token:', err)
		}
	}

	return (
		<div className="grid grid-rows-1">
			<div className="flex min-h-full items-center justify-center">
				<div className="mx-auto w-full font-helvetica text-[14px]">
					<Form method="post" noValidate>
						<div>
							<div className="mt-2 flex justify-between">
								<div>
									<h1 className="text-4xl">Transfer</h1>
								</div>
							</div>
						</div>

						<hr className="my-3 mt-6 h-px border-0 bg-[#dcdada] dark:bg-gray-700" />

						<div className="my-5 rounded border border-[#faebcc] bg-[#fcf8e3] p-4 text-[#8a6d3b]">
							<p className="my-1 inline-flex">
								<Info className="mr-1 inline h-5 w-5 align-sub" />
								{t('transfer_device')}
							</p>
						</div>

						<div>
							<label
								htmlFor="expiration"
								className="txt-base block font-bold tracking-normal"
							>
								{t('expiration')}
							</label>

							<div className="mt-1">
								<select
									id="expiration"
									name="expiration"
									defaultValue="1"
									className="w-full appearance-auto rounded border border-gray-200 px-2 py-1.5 text-base"
								>
									<option value="1">{t('1_day')}</option>
									<option value="7">{t('7_days')}</option>
									<option value="30">{t('30_days')}</option>
									<option value="60">{t('60_days')}</option>
									<option value="90">{t('90_days')}</option>
								</select>
							</div>
						</div>

						<div className="my-3">
							<label
								htmlFor="type"
								className="txt-base block tracking-normal"
							>
									<Trans
										ns="device-transfer"
										i18nKey="type_to_confirm"
										values={{ deviceName }}
										components={{ b: <b /> }}
									/>
							</label>

							<div className="mt-1">
								<input
									id="type"
									autoFocus
									name="type"
									type="text"
									className="w-full rounded border border-gray-200 px-2 py-1 text-base"
								/>
							</div>
						</div>

						<button
							type="submit"
							disabled={isSubmitting || existingTransfer !== null}
							className="my-4 block w-full rounded-[3px] border-[#d43f3a] bg-[#d9534f] px-[12px] py-[6px] text-[14px] leading-[1.6] text-[#fff] hover:border-[#ac2925] hover:bg-[#c9302c] disabled:cursor-not-allowed disabled:opacity-70"
						>
							{isSubmitting ? t('submitting') : t('submit')}
						</button>
					</Form>

					{actionData?.error ? (
						<div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-red-700">
							{actionData.error}
						</div>
					) : null}

					{transferToken ? (
						<div className="mt-4 rounded border border-green-200 bg-green-50 p-4 text-green-800">
							<p className="font-bold">
								{actionData?.transfer
									? t('transfer_created')
									: t('active_token')}
							</p>
							<p className="mt-2">{t('give_token')}</p>

							<div className="mt-2 flex items-center gap-2">
								<code className="block flex-1 rounded bg-white px-3 py-2 text-base">
									{transferToken}
								</code>

								<button
									type="button"
									onClick={handleCopyToken}
									className="inline-flex items-center gap-2 rounded border border-green-300 bg-white px-3 py-2 text-sm text-green-800 hover:bg-green-100"
									aria-label={copied ? t('copied') : t('copy')}
									title={copied ? t('copied') : t('copy')}
								>
									{copied ? (
										<>
											<Check className="h-4 w-4" />
											{t('copied')}
										</>
									) : (
										<>
											<Copy className="h-4 w-4" />
											{t('copy')}
										</>
									)}
								</button>
							</div>

							{transferExpiresAt ? (
								<p className="mt-3 text-sm">
									{t('valid_until')}{' '}
									<b>
										{new Date(transferExpiresAt).toLocaleString(t('locale'), {
											dateStyle: 'medium',
											timeStyle: 'short',
										})}
									</b>
								</p>
							) : null}
						</div>
					) : null}
				</div>
			</div>
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