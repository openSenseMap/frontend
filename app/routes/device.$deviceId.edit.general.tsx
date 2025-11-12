import { Save } from 'lucide-react'
import React, { useState } from 'react'
import {
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
	data,
	redirect,
	Form,
	useActionData,
	useLoaderData,
	useOutletContext,
} from 'react-router'
import invariant from 'tiny-invariant'
import ErrorMessage from '~/components/error-message'
import {
	updateDevice,
	deleteDevice,
	getDeviceWithoutSensors,
} from '~/models/device.server'
import { verifyLogin } from '~/models/user.server'
import { getUserEmail, getUserId } from '~/utils/session.server'

//*****************************************************
export async function loader({ request, params }: LoaderFunctionArgs) {
	//* if user is not logged in, redirect to home
	const userId = await getUserId(request)
	if (!userId) return redirect('/')

	const deviceID = params.deviceId

	if (typeof deviceID !== 'string') {
		return redirect('/profile/me')
	}

	const deviceData = await getDeviceWithoutSensors({ id: deviceID })

	return { device: deviceData }
}

//*****************************************************
export async function action({ request, params }: ActionFunctionArgs) {
	const formData = await request.formData()
	const { intent, name, exposure, passwordDelete } =
		Object.fromEntries(formData)

	const exposureLowerCase = exposure.toString().toLowerCase()

	const errors = {
		exposure: exposure ? null : 'Invalid exposure.',
		passwordDelete: passwordDelete ? null : 'Password is required.',
	}

	const deviceID = params.deviceId
	invariant(typeof deviceID === 'string', ' Device id not found.')
	invariant(typeof name === 'string', 'Device name is required.')
	invariant(typeof exposure === 'string', 'Device name is required.')

	if (
		exposureLowerCase !== 'indoor' &&
		exposureLowerCase !== 'outdoor' &&
		exposureLowerCase !== 'mobile' &&
		exposureLowerCase !== 'unknown'
	) {
		return data({
			errors: {
				exposure: exposure ? null : 'Invalid exposure.',
				passwordDelete: errors.passwordDelete,
			},
			status: 400,
		})
	}

	switch (intent) {
		case 'save': {
			await updateDevice(deviceID, { name, exposure: exposureLowerCase })
			return data({
				errors: {
					exposure: null,
					passwordDelete: null,
				},
				status: 200,
			})
		}
		case 'delete': {
			//* check password validaty
			if (errors.passwordDelete) {
				return data({
					errors,
					status: 400,
				})
			}
			//* 1. get user email
			const userEmail = await getUserEmail(request)
			invariant(typeof userEmail === 'string', 'email not found')
			invariant(typeof passwordDelete === 'string', 'password must be a string')
			//* 2. check entered password
			const user = await verifyLogin(userEmail, passwordDelete)
			//* 3. retrun error if password is not correct
			if (!user) {
				return data(
					{
						errors: {
							exposure: exposure ? null : 'Invalid exposure.',
							passwordDelete: 'Invalid password',
						},
					},
					{ status: 400 },
				)
			}
			//* 4. delete device
			await deleteDevice({ id: deviceID })

			return redirect('/profile/me')
		}
	}

	return redirect('')
}

//**********************************
export default function () {
	const { device } = useLoaderData<typeof loader>()
	const actionData = useActionData<typeof action>()
	const [passwordDelVal, setPasswordVal] = useState('') //* to enable delete account button
	//* focus when an error occured
	const nameRef = React.useRef<HTMLInputElement>(null)
	const passwordDelRef = React.useRef<HTMLInputElement>(null)
	const [name, setName] = useState(device?.name)
	const [exposure, setExposure] = useState(device?.exposure)
	//* to view toast on edit page
	const [setToastOpen] = useOutletContext<[(_open: boolean) => void]>()

	React.useEffect(() => {
		if (actionData) {
			const hasErrors = Object.values(actionData?.errors).some(
				(errorMessage) => errorMessage,
			)

			//* when device data updated successfully
			if (!hasErrors) {
				setToastOpen(true)
				// setToastOpenTest(true);
			}
			//* when password is null
			else if (hasErrors && actionData?.errors?.passwordDelete) {
				passwordDelRef.current?.focus()
			}
		}
	}, [actionData, setToastOpen])

	return (
		<div className="grid grid-rows-1">
			{/* general form */}
			<div className="flex min-h-full items-center justify-center">
				<div className="mx-auto w-full font-helvetica">
					{/* Form */}
					<Form method="post" noValidate>
						{/* Heading */}
						<div>
							{/* Title */}
							<div className="mt-2 flex justify-between">
								<div>
									<h1 className="text-4xl">General</h1>
								</div>
								<div>
									<button
										type="submit"
										name="intent"
										value="save"
										disabled={
											name === device?.name && exposure === device?.exposure
										}
										className="h-12 w-12 rounded-full border-[1.5px] border-[#9b9494] hover:bg-[#e7e6e6]"
									>
										<Save className="mx-auto h-5 w-5 lg:h-7 lg:w-7" />
									</button>
								</div>
							</div>
						</div>

						{/* divider */}
						<hr className="my-3 mt-6 h-px border-0 bg-[#dcdada] dark:bg-gray-700" />

						<div className="space-y-5 pt-4">
							{/* <Form method="post" className="space-y-6" noValidate> */}
							{/* Name */}
							<div>
								<label
									htmlFor="name"
									className="txt-base block font-bold tracking-normal"
								>
									Name *
								</label>

								<div className="mt-1">
									<input
										id="name"
										required
										autoFocus={true}
										name="name"
										type="text"
										defaultValue={device?.name}
										onChange={(e) => setName(e.target.value)}
										ref={nameRef}
										aria-describedby="name-error"
										className="w-full rounded border border-gray-200 px-2 py-1 text-base"
									/>
								</div>
							</div>

							{/* Exposure */}
							<div className="mt-3">
								<label
									htmlFor="exposure"
									className="txt-base block font-bold tracking-normal"
								>
									Exposure
								</label>

								<div className="mt-1">
									<select
										id="exposure"
										name="exposure"
										defaultValue={device?.exposure || 'UNKNOWN'}
										onChange={(e) =>
											setExposure(
												e.target.value as
													| 'indoor'
													| 'outdoor'
													| 'mobile'
													| 'unknown',
											)
										}
										className="w-full appearance-auto rounded border border-gray-200 px-2 py-1.5 text-base"
									>
										<option value="indoor">indoor</option>
										<option value="outdoor">outdoor</option>
										<option value="mobile">mobile</option>
										<option value="unknown">unknown</option>
									</select>
								</div>
							</div>

							{/* Delete device */}
							<div>
								<h1 className="mt-7 text-3xl text-[#FF4136]">
									Delete senseBox
								</h1>
							</div>

							<div className="my-5 rounded border border-[#faebcc] bg-[#fcf8e3] p-4 text-[#8a6d3b]">
								<p>
									If you really want to delete your station, please type your
									current password - all measurements will be deleted as well.
								</p>
							</div>
							<div>
								<input
									id="passwordDelete"
									name="passwordDelete"
									type="password"
									placeholder="Password"
									ref={passwordDelRef}
									// defaultValue={123}
									className="w-full rounded border border-gray-200 px-2 py-2 text-base placeholder-[#999]"
									value={passwordDelVal}
									onChange={(e) => setPasswordVal(e.target.value)}
								/>
								{actionData?.errors?.passwordDelete && (
									<div className="pt-1 text-[#FF0000]" id="email-error">
										{actionData.errors.passwordDelete}
									</div>
								)}
							</div>
							{/* Delete button */}
							<div className="flex justify-end">
								<button
									type="submit"
									name="intent"
									value="delete"
									disabled={!passwordDelVal}
									className="mb-5 rounded border border-gray-200 px-4 py-2 text-black hover:bg-[#e6e6e6] disabled:border-[#ccc] disabled:text-[#8a8989]"
								>
									Delete senseBox
								</button>
							</div>
							{/* </Form> */}
						</div>
					</Form>
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
