import { Info } from 'lucide-react'
import {
	type ActionFunctionArgs,
	data,
	Form,
	type LoaderFunctionArgs,
	redirect,
	useActionData,
	useLoaderData,
	useNavigation,
} from 'react-router'
import ErrorMessage from '~/components/error-message'
import { createBoxTransfer } from '~/lib/transfer-service.server'
import { getDevice } from '~/models/device.server'
import { type Claim } from '~/schema'
import { getUserId } from '~/utils/session.server'

export async function loader({ request, params }: LoaderFunctionArgs) {
	const userId = await getUserId(request)
	if (!userId) return redirect('/')

	const deviceId = params.deviceId
	if (!deviceId) throw new Response('Missing deviceId', { status: 400 })

	const box = await getDevice({ id: deviceId })
	if (!box) throw new Response('Device not found', { status: 404 })
	if (box.user.id !== userId) throw new Response('Forbidden', { status: 403 })

	return { deviceId, boxName: box.name ?? box.id }
}

type ActionData = {
	success: boolean
	message?: string
	error?: string
	transfer?: Claim
}

export async function action({ request, params }: ActionFunctionArgs) {
	const userId = await getUserId(request)
	if (!userId) return redirect('/')

	const deviceId = params.deviceId
	if (!deviceId) {
		return data<ActionData>(
			{ success: false, error: 'Missing deviceId' },
			{ status: 400 },
		)
	}

	const formData = await request.formData()
	const expiration = formData.get('expiration')?.toString()
	const confirmation = formData.get('type')?.toString()?.trim()

	const box = await getDevice({ id: deviceId })
	if (!box) {
		return data<ActionData>(
			{ success: false, error: 'Device not found' },
			{ status: 404 },
		)
	}

	const confirmationTarget = box.name ?? box.id
	if (confirmation !== confirmationTarget) {
		return data<ActionData>(
			{
				success: false,
				error: `Please type "${confirmationTarget}" to confirm.`,
			},
			{ status: 400 },
		)
	}

	const days = Number(expiration)
	if (!Number.isFinite(days) || days <= 0) {
		return data<ActionData>(
			{ success: false, error: 'Invalid expiration value' },
			{ status: 400 },
		)
	}

	const expiresAt = new Date()
	expiresAt.setDate(expiresAt.getDate() + days)

	try {
		const transfer = await createBoxTransfer(userId, deviceId, expiresAt.toISOString())

		return data<ActionData>(
			{
				success: true,
				message: 'Box successfully prepared for transfer',
				transfer,
			},
			{ status: 201 },
		)
	} catch (err) {
		const message =
			err instanceof Error ? err.message : 'Failed to create transfer'

		return data<ActionData>(
			{ success: false, error: message },
			{ status: 400 },
		)
	}
}

export default function EditBoxTransfer() {
	const { boxName } = useLoaderData<typeof loader>()
	const actionData = useActionData<typeof action>()
	const navigation = useNavigation()


	const transferToken = actionData?.transfer?.token

	const isSubmitting = navigation.state === 'submitting'

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
								Transfer this device to another user!
							</p>
							<hr className="my-4 border-[#f7e1b5]" />
							<p className="my-1">
								Type <b>{boxName}</b> to confirm, then create a transfer token for
								the new owner.
							</p>
						</div>

						<div>
							<label
								htmlFor="expiration"
								className="txt-base block font-bold tracking-normal"
							>
								Expiration
							</label>

							<div className="mt-1">
								<select
									id="expiration"
									name="expiration"
									defaultValue="1"
									className="w-full appearance-auto rounded border border-gray-200 px-2 py-1.5 text-base"
								>
									<option value="1">1 day</option>
									<option value="7">7 days</option>
									<option value="30">30 days</option>
									<option value="60">60 days</option>
									<option value="90">90 days</option>
								</select>
							</div>
						</div>

						<div className="my-3">
							<label
								htmlFor="type"
								className="txt-base block font-bold tracking-normal"
							>
								Type <b>{boxName}</b> to confirm.
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
							disabled={isSubmitting}
							className="my-4 block w-full rounded-[3px] border-[#d43f3a] bg-[#d9534f] px-[12px] py-[6px] text-[14px] leading-[1.6] text-[#fff] hover:border-[#ac2925] hover:bg-[#c9302c] disabled:cursor-not-allowed disabled:opacity-70"
						>
							{isSubmitting
								? 'Creating transfer...'
								: 'I understand, transfer this device.'}
						</button>
					</Form>

					{/* {actionData?.error ? (
						<div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-red-700">
							{actionData.error}
						</div>
					) : null} */}

					{transferToken ? (
						<div className="mt-4 rounded border border-green-200 bg-green-50 p-4 text-green-800">
							<p className="font-bold">Transfer created</p>
							<p className="mt-2">Give this token to the new owner:</p>
							<code className="mt-2 block rounded bg-white px-3 py-2 text-base">
								{transferToken}
							</code>
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