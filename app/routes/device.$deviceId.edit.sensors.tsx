import {
	ChevronDownIcon,
	Trash2,
	ClipboardCopy,
	Edit,
	Plus,
	Save,
	Undo2,
	X,
} from 'lucide-react'
import React, { useState, useCallback } from 'react'
import {
	redirect,
	Form,
	useActionData,
	useLoaderData,
	useOutletContext,
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
} from 'react-router'
import invariant from 'tiny-invariant'
import {
	DropdownMenu,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import ErrorMessage from '~/components/error-message'
import {
	addNewSensor,
	deleteSensor,
	getSensorsFromDevice,
	updateSensor,
} from '~/models/sensor.server'
import { assignIcon, getIcon, iconsList } from '~/utils/sensoricons'
import { getUserId } from '~/utils/session.server'

// Type for sensor data with editing state
interface SensorData {
	id?: string
	title?: string
	unit?: string
	sensorType?: string
	icon?: string
	editing?: boolean
	edited?: boolean
	new?: boolean
	deleted?: boolean
	deleting?: boolean
	notValidInput?: boolean
}

//*****************************************************
export async function loader({ request, params }: LoaderFunctionArgs) {
	const userId = await getUserId(request)
	if (!userId) return redirect('/')

	const deviceID = params.deviceId
	if (typeof deviceID !== 'string') {
		return 'deviceID not found'
	}
	const rawSensorsData = await getSensorsFromDevice(deviceID)

	return rawSensorsData as SensorData[]
}

//*****************************************************
export async function action({ request, params }: ActionFunctionArgs) {
	const formData = await request.formData()
	const { updatedSensorsData } = Object.fromEntries(formData)

	if (typeof updatedSensorsData !== 'string') {
		return { isUpdated: false }
	}
	const updatedSensorsDataJson = JSON.parse(updatedSensorsData) as SensorData[]

	for (const sensor of updatedSensorsDataJson) {
		if (sensor?.new === true && sensor?.edited === true) {
			const deviceID = params.deviceId
			invariant(deviceID, `deviceID not found!`)

			await addNewSensor({
				title: sensor.title!,
				unit: sensor.unit!,
				sensorType: sensor.sensorType!,
				deviceId: deviceID,
			})
		} else if (sensor?.edited === true) {
			await updateSensor({
				id: sensor.id!,
				title: sensor.title!,
				unit: sensor.unit!,
				sensorType: sensor.sensorType!,
			})
		} else if (sensor?.deleted === true) {
			await deleteSensor(sensor.id!)
		}
	}

	return { isUpdated: true }
}

//**********************************
export default function EditBoxSensors() {
	const data = useLoaderData<typeof loader>()
	const actionData = useActionData<typeof action>()
	const [sensorsData, setSensorsData] = useState<SensorData[]>(
		data as SensorData[],
	)
	const [setToastOpen] = useOutletContext<[(_open: boolean) => void]>()

	// Helper to update a sensor immutably
	const updateSensorState = useCallback(
		(index: number, updates: Partial<SensorData>) => {
			setSensorsData((prev) =>
				prev.map((sensor, i) =>
					i === index ? { ...sensor, ...updates } : sensor,
				),
			)
		},
		[],
	)

	// Helper to remove a sensor from state
	const removeSensorFromState = useCallback((index: number) => {
		setSensorsData((prev) => prev.filter((_, i) => i !== index))
	}, [])

	// Helper to add a new sensor
	const addNewSensorToState = useCallback(() => {
		setSensorsData((prev) => [
			...prev,
			{
				title: '',
				unit: '',
				sensorType: '',
				editing: true,
				new: true,
				notValidInput: true,
			},
		])
	}, [])

	// Helper to validate sensor fields
	const validateSensor = (sensor: SensorData): boolean => {
		return Boolean(sensor.title && sensor.unit && sensor.sensorType)
	}

	// Helper to reset sensor to original data
	const resetSensor = useCallback(
		(index: number) => {
			const originalData = (data as SensorData[])[index]
			updateSensorState(index, {
				editing: false,
				title: originalData.title,
				unit: originalData.unit,
				sensorType: originalData.sensorType,
				notValidInput: false,
			})
		},
		[data, updateSensorState],
	)

	React.useEffect(() => {
		if (actionData?.isUpdated) {
			setToastOpen(true)

			// Clean up state after successful update
			setSensorsData((prev) =>
				prev
					.filter((sensor) => !sensor.deleted) // Remove deleted sensors
					.map((sensor) => ({
						...sensor,
						editing: false,
						edited: false,
						new: false,
						notValidInput: false,
					})),
			)
		}
	}, [actionData, setToastOpen])

	return (
		<div className="grid grid-rows-1">
			<div className="flex min-h-full items-center justify-center">
				<div className="mx-auto w-full font-helvetica text-[14px]">
					<Form method="post" noValidate>
						{/* Heading */}
						<div>
							<div className="mt-2 flex justify-between">
								<div>
									<h1 className="text-4xl">Sensor</h1>
								</div>
								<div>
									{/* Add button */}
									<button
										name="intent"
										value="add"
										type="button"
										onClick={addNewSensorToState}
										className="mr-2 h-12 w-12 rounded-full border-[1.5px] border-[#9b9494] hover:bg-[#e7e6e6]"
									>
										<Plus className="mx-auto h-5 w-5 lg:h-7 lg:w-7" />
									</button>
									{/* Save button */}
									<button
										name="intent"
										value="save"
										type="submit"
										className="h-12 w-12 rounded-full border-[1.5px] border-[#9b9494] hover:bg-[#e7e6e6]"
									>
										<Save className="mx-auto h-5 w-5 lg:h-7 lg:w-7" />
									</button>
								</div>
							</div>
						</div>

						{/* divider */}
						<hr className="my-3 mt-6 h-px border-0 bg-[#dcdada] dark:bg-gray-700" />

						<div className="my-5 rounded border border-[#faebcc] bg-[#fcf8e3] p-4 text-[#8a6d3b]">
							<p>
								Data measured by sensors that you are going to delete will be
								deleted as well. If you add new sensors, don't forget to
								retrieve your new script (see tab 'Script').
							</p>
						</div>

						<ul className="mt-0 rounded-[3px] border-[1px] border-solid border-[#d1d5da] pt-0">
							{sensorsData?.map((sensor, index) => (
								<li
									key={sensor.id ?? `new-${index}`}
									className="border-t-[1px] border-solid border-[#e1e4e8] p-4"
								>
									<div className="grid grid-cols-12">
										{/* Left side -> sensor icons */}
										<div className="col-span-2 m-auto sm:col-span-2">
											{sensor?.editing ? (
												<span className="table-cell h-[222px] w-[30%] text-center align-middle">
													<div className="relative inline-block align-middle">
														{/* View icon */}
														<button
															id="split-button"
															type="button"
															className="btn btn-default rounded-br-none rounded-tr-none px-[4px] py-[6px]"
														>
															{sensor.icon
																? getIcon(sensor.icon)
																: assignIcon(
																		sensor.sensorType ?? '',
																		sensor.title ?? '',
																	)}
														</button>

														{/* Icon dropdown */}
														<DropdownMenu>
															<DropdownMenuTrigger asChild>
																<button
																	id="dropdownDefaultButton"
																	type="button"
																	className="btn btn-default rounded-bl-none rounded-tl-none border-l-[0px] px-[1px] pb-[4px] pt-[5px]"
																>
																	<ChevronDownIcon className="m-0 inline h-6 w-6 p-0" />
																</button>
															</DropdownMenuTrigger>
															<DropdownMenuContent
																align="end"
																className="min-w-fit max-w-[150px]"
															>
																<DropdownMenuGroup className="flex h-fit flex-wrap">
																	{iconsList?.map((icon: any) => {
																		const Icon = icon.name
																		return (
																			<DropdownMenuItem
																				className="p-[0.2rem]"
																				key={icon.id}
																				onClick={() =>
																					updateSensorState(index, {
																						icon: icon.id,
																					})
																				}
																			>
																				<Icon className="ml-[6px] mr-1 inline-block h-4 w-4 align-text-bottom text-[#818a91]" />
																			</DropdownMenuItem>
																		)
																	})}
																</DropdownMenuGroup>
															</DropdownMenuContent>
														</DropdownMenu>
													</div>
												</span>
											) : (
												<span className="table-cell h-[90px] w-[30%] text-center align-middle">
													{sensor.icon
														? getIcon(sensor.icon)
														: assignIcon(
																sensor.sensorType ?? '',
																sensor.title ?? '',
															)}
												</span>
											)}
										</div>

										{/* Middle -> sensor attributes */}
										<div className="col-span-8 border-r-[1px] border-solid border-[#e1e4e8] sm:col-span-8">
											{/* Display mode */}
											{!sensor?.editing && (
												<span className="table-cell align-middle leading-[1.75]">
													<strong className="block">
														Phenomenon:
														<span className="px-1 text-[#626161]">
															{sensor?.title}
														</span>
													</strong>
													<strong>ID: </strong>
													<code className="rounded-sm bg-[#f9f2f4] px-1 py-[2px] text-[#c7254e]">
														{sensor?.id}
														<button
															type="button"
															onClick={() => {
																void navigator.clipboard.writeText(
																	sensor?.id ?? '',
																)
															}}
														>
															<ClipboardCopy className="ml-[6px] mr-1 inline-block h-4 w-4 align-text-bottom text-[#818a91]" />
														</button>
													</code>
													<strong className="block">
														Unit:
														<span className="px-1 text-[#626161]">
															{sensor?.unit}
														</span>
													</strong>
													<strong className="block">
														Type:
														<span className="px-1 text-[#626161]">
															{sensor?.sensorType}
														</span>
													</strong>
												</span>
											)}

											{/* Edit mode */}
											{sensor?.editing && (
												<div className="mb-4 pr-4">
													{/* Phenomenon */}
													<div className="mb-4">
														<label
															htmlFor={`phenomenon-${index}`}
															className="mb-1 inline-block font-[700]"
														>
															Phenomenon:
														</label>
														<input
															id={`phenomenon-${index}`}
															type="text"
															value={sensor?.title ?? ''}
															placeholder="Phenomenon"
															className="form-control"
															onChange={(e) => {
																const value = e.target.value
																updateSensorState(index, {
																	title: value,
																	notValidInput: !validateSensor({
																		...sensor,
																		title: value,
																	}),
																})
															}}
														/>
													</div>

													{/* Unit */}
													<div className="mb-4">
														<label
															htmlFor={`unit-${index}`}
															className="mb-1 inline-block font-[700]"
														>
															Unit:
														</label>
														<input
															id={`unit-${index}`}
															type="text"
															value={sensor?.unit ?? ''}
															placeholder="Unit"
															className="form-control"
															onChange={(e) => {
																const value = e.target.value
																updateSensorState(index, {
																	unit: value,
																	notValidInput: !validateSensor({
																		...sensor,
																		unit: value,
																	}),
																})
															}}
														/>
													</div>

													{/* Type */}
													<div className="mb-4">
														<label
															htmlFor={`type-${index}`}
															className="mb-1 inline-block font-[700]"
														>
															Type:
														</label>
														<input
															id={`type-${index}`}
															type="text"
															value={sensor?.sensorType ?? ''}
															placeholder="Type"
															className="form-control"
															onChange={(e) => {
																const value = e.target.value
																updateSensorState(index, {
																	sensorType: value,
																	notValidInput: !validateSensor({
																		...sensor,
																		sensorType: value,
																	}),
																})
															}}
														/>
													</div>
												</div>
											)}
										</div>

										{/* Right side -> action buttons */}
										<div className="col-span-2 ml-4 sm:col-span-2">
											<span className="table-cell align-middle leading-[1.6]">
												{/* Delete warning */}
												{sensor?.deleting && (
													<>
														<span className="bg-[#d9534f] p-[3px] leading-[1.6] text-[#fff]">
															This sensor will be deleted.
														</span>
														<button
															type="button"
															onClick={() =>
																updateSensorState(index, {
																	deleting: false,
																	deleted: false,
																})
															}
															className="mb-1 mt-2 block rounded-[3px] border-[#2e6da4] bg-[#337ab7] px-[5px] py-[3px] pt-1 text-[14px] leading-[1.6] text-[#fff] hover:border-[#204d74] hover:bg-[#286090]"
														>
															<Undo2 className="mr-1 inline-block h-[17px] w-[16px] align-sub" />
															Undo
														</button>
													</>
												)}

												{/* Default buttons (not editing, not deleting) */}
												{!sensor?.editing && !sensor?.deleting && (
													<span>
														<button
															type="button"
															onClick={() =>
																updateSensorState(index, { editing: true })
															}
															className="mb-1 mt-2 block rounded-[3px] border-[#2e6da4] bg-[#337ab7] px-[5px] py-[3px] pt-1 text-[14px] leading-[1.6] text-[#fff] hover:border-[#204d74] hover:bg-[#286090]"
														>
															<Edit className="mr-1 inline-block h-[17px] w-[15px] align-sub" />
															Edit
														</button>

														<button
															type="button"
															onClick={() =>
																updateSensorState(index, {
																	deleting: true,
																	deleted: true,
																})
															}
															className="mb-1 mt-2 block rounded-[3px] border-[#d43f3a] bg-[#d9534f] px-[5px] py-[3px] pt-1 text-[14px] leading-[1.6] text-[#fff] hover:border-[#ac2925] hover:bg-[#c9302c]"
														>
															<Trash2 className="mr-1 inline-block h-[17px] w-[16px] align-sub" />
															Delete
														</button>
													</span>
												)}
											</span>

											{/* Editing buttons */}
											{sensor?.editing && (
												<span className="table-cell h-[222px] align-middle leading-[1.6]">
													{sensor?.notValidInput && (
														<span className="bg-[#d9534f] p-[3px] leading-[1.6] text-[#fff]">
															Please fill out all required fields.
														</span>
													)}

													{/* Save button */}
													<button
														type="button"
														disabled={sensor?.notValidInput}
														className="mb-1 mt-2 block rounded-[3px] border-[#2e6da4] bg-[#337ab7] px-[5px] py-[3px] pt-1 text-[14px] leading-[1.6] text-[#fff] hover:border-[#204d74] hover:bg-[#286090] disabled:cursor-not-allowed disabled:opacity-50"
														onClick={() => {
															if (validateSensor(sensor)) {
																updateSensorState(index, {
																	notValidInput: false,
																	editing: false,
																	edited: true,
																})
															} else {
																updateSensorState(index, {
																	notValidInput: true,
																})
															}
														}}
													>
														<Save className="mr-1 inline-block h-[17px] w-[15px] align-sub" />
														Save
													</button>

													{/* Cancel button */}
													<button
														type="button"
														onClick={() => {
															if (sensor?.new) {
																removeSensorFromState(index)
															} else {
																resetSensor(index)
															}
														}}
														className="mb-1 mt-2 block rounded-[3px] border-[#ac2925] bg-[#d9534f] px-[5px] py-[3px] pt-1 text-[14px] leading-[1.6] text-[#fff] hover:border-[#ac2925] hover:bg-[#c9302c]"
													>
														<X className="mr-1 inline-block h-[17px] w-[15px] scale-[1.2] align-sub" />
														Cancel
													</button>
												</span>
											)}
										</div>
									</div>
								</li>
							))}
						</ul>

						{/* Hidden input for form submission */}
						<input
							name="updatedSensorsData"
							type="hidden"
							value={JSON.stringify(sensorsData)}
						/>
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
