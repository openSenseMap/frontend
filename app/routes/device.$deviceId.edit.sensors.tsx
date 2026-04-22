import {
	ChevronDownIcon,
	Trash2,
	ClipboardCopy,
	Edit,
	GripVertical,
	Plus,
	Save,
	Undo2,
	X,
} from 'lucide-react'
import React, { useState } from 'react'
import {
	redirect,
	Form,
	useActionData,
	useLoaderData,
	useOutletContext,
} from 'react-router'
import invariant from 'tiny-invariant'
import { type Route } from './+types/device.$deviceId.edit.sensors'
import {
	DropdownMenu,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { reconcileDeviceIntegrations } from '~/db/models/integration.server'
import {
	addNewSensor,
	deleteSensor,
	getSensorsFromDevice,
	updateSensor,
} from '~/db/models/sensor.server'
import { assignIcon, getIcon, iconsList } from '~/lib/sensoricons'
import { getUserId } from '~/services/session-service.server'

//*****************************************************
export async function loader({ request, params }: Route.LoaderArgs) {
	//* if user is not logged in, redirect to home
	const userId = await getUserId(request)
	if (!userId) return redirect('/')

	const deviceID = params.deviceId
	if (typeof deviceID !== 'string') {
		return 'deviceID not found'
	}
	const rawSensorsData = await getSensorsFromDevice(deviceID)

	return rawSensorsData as any
}

//*****************************************************
export async function action({ request, params }: Route.ActionArgs) {
	const userId = await getUserId(request)
	if (!userId) return redirect('/')

	const formData = await request.formData()
	const { updatedSensorsData } = Object.fromEntries(formData)

	if (typeof updatedSensorsData !== 'string') {
		return { isUpdated: false }
	}

	const deviceId = params.deviceId
	invariant(deviceId, 'deviceID not found!')

	const updatedSensorsDataJson = JSON.parse(updatedSensorsData)

	for (const [index, sensor] of updatedSensorsDataJson.entries()) {
		if (sensor?.new === true && sensor?.edited === true) {
			await addNewSensor({
				title: sensor.title,
				unit: sensor.unit,
				sensorType: sensor.sensorType,
				deviceId,
				order: index,
			})
		} else if (sensor?.deleted === true) {
			await deleteSensor(sensor.id)
		} else if (!sensor?.new) {
			await updateSensor({
				id: sensor.id,
				title: sensor.title,
				unit: sensor.unit,
				sensorType: sensor.sensorType,
				order: index,
			})
		}
	}

	const currentSensors = await getSensorsFromDevice(deviceId)
	const validSensorIds = currentSensors
		.map((sensor: any) => sensor._id || sensor.id)
		.filter(Boolean)

	await reconcileDeviceIntegrations({
		deviceId,
		validSensorIds,
	})

	return { isUpdated: true }
}

//**********************************
export default function EditBoxSensors() {
	const data = useLoaderData<typeof loader>()
	const actionData = useActionData<typeof action>()

	const [sensorsData, setSensorsData] = useState(data)

	/* temp impl. until figuring out how to updating state of nested objects  */
	const [tepmState, setTepmState] = useState(false)

	const dragIndexRef = React.useRef<number | null>(null)
	//* to view toast on edit-page
	const [setToastOpen] = useOutletContext<[(_open: boolean) => void]>()

	React.useEffect(() => {
		//* if sensors data were updated successfully
		if (actionData && actionData?.isUpdated) {
			//* show notification when data is successfully updated
			setToastOpen(true)
			// window.location.reload();
			//* reset sensor data elements
			for (let index = sensorsData.length - 1; index >= 0; index--) {
				const sensor = sensorsData[index]
				if (
					sensor.deleted ||
					(sensor.new == true && sensor.notValidInput == true)
				) {
					sensorsData.splice(index, 1)
				} else if (sensor.editing == true) {
					delete sensor.editing
				}
			}
		}
	}, [actionData, setToastOpen]) // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<div className="grid grid-rows-1">
			{/* sensor form */}
			<div className="flex min-h-full items-center justify-center">
				<div className="font-helvetica mx-auto w-full text-[14px]">
					{/* Form */}
					<Form method="post" noValidate>
						{/* Heading */}
						<div>
							{/* Title */}
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
										onClick={() => {
											setSensorsData([
												...sensorsData,
												{
													title: undefined,
													unit: undefined,
													sensorType: undefined,
													editing: true,
													new: true,
													notValidInput: true,
												},
											])
										}}
										className="mr-2 h-12 w-12 rounded-full border-[1.5px] border-[#9b9494] hover:bg-[#e7e6e6]"
									>
										<Plus className="mx-auto h-5 w-5 lg:h-7 lg:w-7" />
									</button>
									{/* Save button */}
									<button
										name="intent"
										value="save"
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

						<ul className="mt-0 rounded-[3px] border border-solid border-[#d1d5da] pt-0">
							{sensorsData?.map((sensor: any, index: number) => {
								return (
									<li
										key={sensor.id ?? index}
										draggable={!sensor.editing}
										onDragStart={() => {
											dragIndexRef.current = index
										}}
										onDragOver={(e) => {
											e.preventDefault()
										}}
										onDrop={() => {
											const from = dragIndexRef.current
											if (from === null || from === index) return
											const reordered = [...sensorsData]
											const [moved] = reordered.splice(from, 1)
											reordered.splice(index, 0, moved)
											setSensorsData(reordered)
											dragIndexRef.current = null
										}}
										className="border-t border-solid border-[#e1e4e8] p-4"
									>
										<div className="grid grid-cols-12">
											{/* drag handle */}
											{!sensor?.editing && (
												<div className="col-span-1 m-auto flex cursor-grab items-center justify-center text-[#aaa] active:cursor-grabbing">
													<GripVertical className="h-5 w-5" />
												</div>
											)}
											{sensor?.editing && <div className="col-span-1" />}

											{/* left side -> sensor icons list */}
											<div className="col-span-1 m-auto sm:col-span-1">
												{sensor?.editing ? (
													<span className="table-cell h-[222px] w-[30%] text-center align-middle">
														<div className="relative inline-block align-middle">
															{/* view icon */}
															<button
																id="split-button"
																type="button"
																className="btn btn-default rounded-tr-none rounded-br-none px-[4px] py-[6px]"
																onClick={() => {
																	setTepmState(!tepmState)
																}}
															>
																{sensor.icon
																	? getIcon(sensor.icon)
																	: assignIcon(sensor.sensorType, sensor.title)}
															</button>

															{/* down arrow icon */}
															<DropdownMenu>
																<DropdownMenuTrigger asChild>
																	<button
																		id="dropdownDefaultButton"
																		type="button"
																		// className="btn btn-default"
																		className="btn btn-default rounded-tl-none rounded-bl-none border-l-0 px-px pt-[5px] pb-[4px]"
																		data-dropdown-toggle="dropdown"
																	>
																		<ChevronDownIcon className="m-0 inline h-6 w-6 p-0" />
																	</button>
																</DropdownMenuTrigger>
																<DropdownMenuContent
																	align="end"
																	className="max-w-[150px] min-w-fit"
																>
																	<DropdownMenuGroup className="flex h-fit flex-wrap">
																		{iconsList?.map((icon: any) => {
																			const Icon = icon.name
																			return (
																				<DropdownMenuItem
																					className="p-[0.2rem]"
																					key={icon.id}
																					onClick={() => {
																						setTepmState(!tepmState)
																						sensor.icon = icon.id
																					}}
																				>
																					<Icon className="mr-1 ml-[6px] inline-block h-4 w-4 align-text-bottom text-[#818a91]" />
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
															: assignIcon(sensor.sensorType, sensor.title)}
													</span>
												)}
											</div>
											{/* middle -> sensor attributes */}
											<div className="col-span-8 border-r border-solid border-[#e1e4e8] sm:col-span-8">
												{/* shown by default */}
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
																	void navigator.clipboard.writeText(sensor?.id)
																}}
															>
																<ClipboardCopy className="mr-1 ml-[6px] inline-block h-4 w-4 align-text-bottom text-[#818a91]" />
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

												{/* shown when edit button clicked */}
												{sensor?.editing && (
													<div className="mb-4 pr-4">
														<div className="mb-4">
															<label
																htmlFor="phenomenom"
																className="mb-1 inline-block font-bold"
															>
																Phenomenon:
															</label>
															<input
																type="text"
																defaultValue={sensor?.title}
																placeholder="Phenomenon"
																className="form-control"
																onChange={(e) => {
																	setTepmState(!tepmState)
																	sensor.title = e.target.value
																	if (sensor.title.length === 0) {
																		sensor.notValidInput = true
																	} else {
																		sensor.notValidInput = false
																	}
																}}
															/>
														</div>
														<div className="mb-4">
															<label
																htmlFor="unit"
																className="mb-1 inline-block font-bold"
															>
																Unit:
															</label>
															<input
																type="text"
																defaultValue={sensor?.unit}
																placeholder="Unit"
																className="form-control"
																onChange={(e) => {
																	setTepmState(!tepmState)
																	sensor.unit = e.target.value
																	if (sensor.unit.length === 0) {
																		sensor.notValidInput = true
																	} else {
																		sensor.notValidInput = false
																	}
																}}
															/>
														</div>
														<div className="mb-4">
															<label
																htmlFor="type"
																className="mb-1 inline-block font-bold"
															>
																Type
															</label>
															<input
																type="text"
																defaultValue={sensor?.sensorType}
																placeholder="Type"
																className="form-control"
																onChange={(e) => {
																	setTepmState(!tepmState)
																	sensor.sensorType = e.target.value
																	if (sensor.sensorType.length === 0) {
																		sensor.notValidInput = true
																	} else {
																		sensor.notValidInput = false
																	}
																}}
															/>
														</div>
													</div>
												)}
											</div>

											{/* right side -> Save, delete, cancel buttons */}
											<div className="col-span-2 ml-4 sm:col-span-2">
												{/* buttons shown by default */}
												<span className="table-cell align-middle leading-[1.6]">
													{/* warning text - delete */}
													{sensor?.deleting && (
														<span className="bg-[#d9534f] p-[3px] leading-[1.6] text-[#fff]">
															This sensor will be deleted.
														</span>
													)}

													{/* undo button */}
													{sensor?.deleting && (
														<button
															type="button"
															onClick={() => {
																setTepmState(!tepmState)
																sensor.deleting = false
															}}
															className="mt-2 mb-1 block rounded-[3px] border-[#2e6da4] bg-[#337ab7] px-[5px] py-[3px] pt-1 text-[14px] leading-[1.6] text-[#fff] hover:border-[#204d74] hover:bg-[#286090]"
														>
															<Undo2 className="mr-1 inline-block h-[17px] w-[16px] align-sub" />
															Undo
														</button>
													)}

													{!sensor?.editing && !sensor?.deleting && (
														<span>
															{/* edit button */}
															{/* ToDo: why onClick not updating the state unless dummy unrelated state is updated */}
															<button
																type="button"
																onClick={() => {
																	setTepmState(!tepmState)
																	sensor.editing = true
																}}
																className="mt-2 mb-1 block rounded-[3px] border-[#2e6da4] bg-[#337ab7] px-[5px] py-[3px] pt-1 text-[14px] leading-[1.6] text-[#fff] hover:border-[#204d74] hover:bg-[#286090]"
															>
																<Edit className="mr-1 inline-block h-[17px] w-[15px] align-sub" />
																Edit
															</button>

															{/* delete button */}
															<button
																type="button"
																onClick={() => {
																	setTepmState(!tepmState)
																	sensor.deleting = true
																	sensor.deleted = true
																	return false
																}}
																className="mt-2 mb-1 block rounded-[3px] border-[#d43f3a] bg-[#d9534f] px-[5px] py-[3px] pt-1 text-[14px] leading-[1.6] text-[#fff] hover:border-[#ac2925] hover:bg-[#c9302c]"
															>
																<Trash2 className="mr-1 inline-block h-[17px] w-[16px] align-sub" />
																Delete
															</button>
														</span>
													)}
												</span>

												{sensor?.editing && (
													<span className="table-cell h-[222px] align-middle leading-[1.6]">
														{/* invalid input text */}
														{sensor?.notValidInput && (
															<span className="bg-[#d9534f] p-[3px] leading-[1.6] text-[#fff]">
																Please fill out all required fields.
															</span>
														)}

														{/* save button */}
														<button
															type="button"
															disabled={sensor?.notValidInput}
															className="mt-2 mb-1 block rounded-[3px] border-[#2e6da4] bg-[#337ab7] px-[5px] py-[3px] pt-1 text-[14px] leading-[1.6] text-[#fff] hover:border-[#204d74] hover:bg-[#286090] disabled:cursor-not-allowed"
															onClick={() => {
																setTepmState(!tepmState)
																if (
																	sensor.title &&
																	sensor.unit &&
																	sensor.sensorType
																) {
																	sensor.notValidInput = false
																	sensor.editing = false
																	sensor.edited = true
																} else {
																	sensor.notValidInput = true
																}
															}}
														>
															<Save className="mr-1 inline-block h-[17px] w-[15px] align-sub" />
															Save
														</button>

														{/* cancel button */}
														<button
															type="button"
															onClick={() => {
																setTepmState(!tepmState)
																if (sensor?.new) {
																	sensorsData.splice(index, 1)
																} else {
																	sensor.editing = false
																	//* restore data
																	sensor.title = data[index].title
																	sensor.unit = data[index].unit
																	sensor.sensorType = data[index].sensorType
																}
															}}
															className="mt-2 mb-1 block rounded-[3px] border-[#ac2925] bg-[#d9534f] px-[5px] py-[3px] pt-1 text-[14px] leading-[1.6] text-[#fff] hover:border-[#ac2925] hover:bg-[#c9302c]"
														>
															<X className="mr-1 inline-block h-[17px] w-[15px] scale-[1.2] align-sub" />
															Cancel
														</button>
													</span>
												)}
											</div>
										</div>
									</li>
								)
							})}
						</ul>

						{/* As there's no way to send data wiht form on submit to action (see: https://github.com/remix-run/react-router/discussions/10264) */}
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
