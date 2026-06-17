import {
	ChevronDownIcon,
	Trash2,
	Edit,
	GripVertical,
	Plus,
	Save,
	Undo2,
	X,
	LucideCopy,
	LucideCopyCheck,
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
import {
	detachDeviceSchema,
	getDeviceWithoutSensors,
} from '~/db/models/device.server'
import { getSharedDeviceSchemaVersion } from '~/db/models/device-schema.server'
import { assignIcon, getIcon, iconsList } from '~/lib/sensoricons'
import { getUserId } from '~/services/session-service.server'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { useToast } from '@/components/ui/use-toast'
import { useTranslation } from 'react-i18next'
import { Button } from '~/components/ui/button'

//*****************************************************
export async function loader({ request, params }: Route.LoaderArgs) {
	//* if user is not logged in, redirect to home
	const userId = await getUserId(request)
	if (!userId) return redirect('/')

	const deviceID = params.deviceId
	if (typeof deviceID !== 'string') {
		return 'deviceID not found'
	}
	const device = await getDeviceWithoutSensors({ id: deviceID })

	if (!device || device.userId !== userId) {
		return redirect('/')
	}

	const [rawSensorsData, deviceSchema] = await Promise.all([
		getSensorsFromDevice(deviceID),
		device.deviceSchemaVersionId
			? getSharedDeviceSchemaVersion(device.deviceSchemaVersionId, userId)
			: Promise.resolve(undefined),
	])

	return {
		sensors: rawSensorsData,
		deviceSchema: deviceSchema
			? {
					name: device.deviceSchemaName ?? deviceSchema.name,
					version: device.deviceSchemaVersion ?? deviceSchema.version,
					hash: device.deviceSchemaHash,
					sensors: deviceSchema.content.sensors,
				}
			: null,
	} as any
}

//*****************************************************
export async function action({ request, params }: Route.ActionArgs) {
	const userId = await getUserId(request)
	if (!userId) return redirect('/')

	const formData = await request.formData()
	const { intent, updatedSensorsData } = Object.fromEntries(formData)

	const deviceId = params.deviceId
	invariant(deviceId, 'deviceID not found!')

	const device = await getDeviceWithoutSensors({ id: deviceId })
	if (!device || device.userId !== userId) return redirect('/')

	if (intent === 'detach-schema') {
		await detachDeviceSchema({ id: deviceId, userId })
		return { isUpdated: true, isDetached: true }
	}

	if (typeof updatedSensorsData !== 'string') {
		return { isUpdated: false, message: 'No sensor data submitted.' }
	}

	const updatedSensorsDataJson = JSON.parse(updatedSensorsData)
	const currentSensors = await getSensorsFromDevice(deviceId)
	const currentSensorsById = new Map(
		currentSensors.map((sensor) => [sensor.id, sensor]),
	)
	const deviceSchema = device.deviceSchemaVersionId
		? await getSharedDeviceSchemaVersion(device.deviceSchemaVersionId, userId)
		: null

	if (deviceSchema) {
		if (currentSensors.length !== deviceSchema.content.sensors.length) {
			return {
				isUpdated: false,
				message:
					'This device no longer matches its schema. Detach it from the schema before editing sensors.',
			}
		}

		const schemaSensorsById = new Map(
			deviceSchema.content.sensors.map((schemaSensor) => [
				schemaSensor.id,
				schemaSensor,
			]),
		)
		const schemaSensorsByExistingSensorId = new Map(
			currentSensors.map((sensor, index) => {
				const schemaSensorId =
					sensor.data &&
					typeof sensor.data === 'object' &&
					!Array.isArray(sensor.data)
						? (sensor.data as { deviceSchemaSensorId?: unknown })
								.deviceSchemaSensorId
						: null

				return [
					sensor.id,
					typeof schemaSensorId === 'string'
						? (schemaSensorsById.get(schemaSensorId) ??
							deviceSchema.content.sensors[index])
						: deviceSchema.content.sensors[index],
				]
			}),
		)

		for (const [index, submittedSensor] of updatedSensorsDataJson.entries()) {
			const sensorId = submittedSensor?.id
			const existingSensor =
				typeof sensorId === 'string' ? currentSensorsById.get(sensorId) : null
			const schemaSensor =
				typeof sensorId === 'string'
					? schemaSensorsByExistingSensorId.get(sensorId)
					: null

			if (
				submittedSensor?.new === true ||
				submittedSensor?.deleted === true ||
				!existingSensor ||
				!schemaSensor
			) {
				return {
					isUpdated: false,
					message:
						'Schema-backed sensors cannot be added or deleted. Detach the device from its schema first.',
				}
			}

			await updateSensor({
				id: existingSensor.id,
				title: schemaSensor.title,
				unit: schemaSensor.unit,
				sensorType: schemaSensor.sensorType,
				icon: submittedSensor.icon ?? existingSensor.icon,
				data: {
					...(existingSensor.data &&
					typeof existingSensor.data === 'object' &&
					!Array.isArray(existingSensor.data)
						? existingSensor.data
						: {}),
					deviceSchemaSensorId: schemaSensor.id,
				},
				order: index,
			})
		}

		return { isUpdated: true }
	}

	for (const [index, sensor] of updatedSensorsDataJson.entries()) {
		if (sensor?.new === true && sensor?.edited === true) {
			await addNewSensor({
				title: sensor.title,
				unit: sensor.unit,
				sensorType: sensor.sensorType,
				icon: sensor.icon,
				deviceId,
				order: index,
			})
		} else if (sensor?.deleted === true) {
			if (!currentSensorsById.has(sensor.id)) {
				return { isUpdated: false, message: 'Sensor not found.' }
			}
			await deleteSensor(sensor.id)
		} else if (!sensor?.new) {
			if (!currentSensorsById.has(sensor.id)) {
				return { isUpdated: false, message: 'Sensor not found.' }
			}
			await updateSensor({
				id: sensor.id,
				title: sensor.title,
				unit: sensor.unit,
				sensorType: sensor.sensorType,
				icon: sensor.icon,
				order: index,
			})
		}
	}

	const nextSensors = await getSensorsFromDevice(deviceId)
	const validSensorIds = nextSensors
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

	const { copyToClipboard } = useCopyToClipboard()
	const { toast } = useToast()
	const { t } = useTranslation('edit-device-sensors')

	const copiedTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
		null,
	)
	const [copiedSensorId, setCopiedSensorId] = React.useState<string | null>(
		null,
	)
	const originalSensorsData = Array.isArray(data) ? data : data.sensors
	const deviceSchema = Array.isArray(data) ? null : data.deviceSchema
	const isSchemaBacked = !!deviceSchema
	const isSchemaOutOfSync =
		isSchemaBacked && originalSensorsData.length !== deviceSchema.sensors.length
	const [sensorsData, setSensorsData] = useState(originalSensorsData)

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
		} else if (actionData?.message) {
			toast({
				title: t('save_failed'),
				description: actionData.message,
				variant: 'destructive',
			})
		}
	}, [actionData, setToastOpen, toast, t]) // eslint-disable-line react-hooks/exhaustive-deps

	React.useEffect(() => {
		setSensorsData(originalSensorsData)
	}, [originalSensorsData])

	const handleCopySensorId = React.useCallback(
		async (sensorId: string | null) => {
			try {
				const copied = await copyToClipboard(sensorId)

				if (!copied) return

				setCopiedSensorId(sensorId)

				if (copiedTimeoutRef.current) {
					clearTimeout(copiedTimeoutRef.current)
				}

				copiedTimeoutRef.current = setTimeout(() => {
					setCopiedSensorId(null)
				}, 2000)

				toast({
					title: t('copied'),
					description: t('sensor_id_copied'),
				})
			} catch {
				toast({
					title: t('copy_failed'),
					description: t('copy_failed_desc'),
					variant: 'destructive',
				})
			}
		},
		[copyToClipboard, toast],
	)

	return (
		<div className="w-full min-w-0">
			<div className="w-full">
				<div className="font-helvetica w-full text-[14px]">
					{/* Form */}
					<Form method="post" noValidate>
						{/* Heading */}
						<div>
							{/* Title */}
							<div className="mt-2 flex justify-between">
								<div>
									<h1 className="text-4xl">Sensor</h1>
								</div>
								<div className="flex items-center gap-3">
									<Button
										type="button"
										variant="outline"
										disabled={isSchemaBacked}
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
										className="gap-2"
									>
										<Plus className="h-4 w-4" />
										{t('add')}
									</Button>

									{isSchemaBacked && (
										<Button
											type="submit"
											name="intent"
											value="detach-schema"
											variant="outline"
											onClick={(event) => {
												if (!window.confirm(t('schema_detach_confirm'))) {
													event.preventDefault()
												}
											}}
										>
											{t('schema_detach')}
										</Button>
									)}

									<Button
										type="submit"
										name="intent"
										value="save"
										className="gap-2"
									>
										<Save className="h-4 w-4" />
										{t('save')}
									</Button>
								</div>
							</div>
						</div>

						{/* divider */}
						<hr className="my-3 mt-6 h-px border-0 bg-[#dcdada] dark:bg-gray-700" />

						<div className="my-5 rounded border border-[#faebcc] bg-[#fcf8e3] p-4 text-[#8a6d3b]">
							<p>{t('sensor_delete_warning')}</p>
						</div>

						{isSchemaBacked && (
							<div className="my-5 rounded border border-blue-200 bg-blue-50 p-4 text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100">
								<p className="font-semibold">
									{t('schema_notice_title', {
										name: deviceSchema.name,
										version: deviceSchema.version,
									})}
								</p>
								<p className="mt-1">{t('schema_notice_text')}</p>
								{isSchemaOutOfSync && (
									<p className="mt-2 font-semibold">
										{t('schema_out_of_sync')}
									</p>
								)}
							</div>
						)}

						<ul className="mt-0 rounded-[3px] border border-solid border-[#d1d5da] pt-0">
							{sensorsData?.map((sensor: any, index: number) => {
								const isSchemaSensor = isSchemaBacked && !sensor?.new
								const canEditSchemaFields = !isSchemaSensor

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
													<span className="table-cell h-55.5 w-[30%] text-center align-middle">
														<div className="relative inline-block align-middle">
															{/* view icon */}
															<button
																id="split-button"
																type="button"
																className="btn btn-default rounded-tr-none rounded-br-none px-1 py-1.5"
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
																		className="btn btn-default rounded-tl-none rounded-bl-none border-l-0 px-px pt-1.25 pb-1"
																		data-dropdown-toggle="dropdown"
																	>
																		<ChevronDownIcon className="m-0 inline h-6 w-6 p-0" />
																	</button>
																</DropdownMenuTrigger>
																<DropdownMenuContent
																	align="end"
																	className="max-w-37.5 min-w-fit"
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
																					<Icon className="mr-1 ml-1.5 inline-block h-4 w-4 align-text-bottom text-[#818a91]" />
																				</DropdownMenuItem>
																			)
																		})}
																	</DropdownMenuGroup>
																</DropdownMenuContent>
															</DropdownMenu>
														</div>
													</span>
												) : (
													<span className="table-cell h-22.5 w-[30%] text-center align-middle">
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
															{t('phenomenon')}:
															<span className="px-1 text-[#626161]">
																{sensor?.title}
															</span>
														</strong>
														<strong>ID: </strong>
														<code className="rounded-sm bg-[#f9f2f4] px-1 py-0.5 text-[#c7254e]">
															{sensor?.id}
															<button
																type="button"
																aria-label={`Copy sensor ID ${sensor?.id}`}
																title="Copy sensor ID"
																onClick={(e) => {
																	e.stopPropagation()
																	void handleCopySensorId(sensor?.id)
																}}
															>
																{copiedSensorId === sensor?.id ? (
																	<LucideCopyCheck
																		size={20.5}
																		className={`mr-1 ml-1.5 inline-block h-4 w-4 align-text-bottom text-green-700`}
																	/>
																) : (
																	<LucideCopy
																		size={20.5}
																		className={`mr-1 ml-1.5 inline-block h-4 w-4 align-text-bottom text-[#818a91]`}
																	/>
																)}
															</button>
														</code>
														<strong className="block">
															{t('unit')}:
															<span className="px-1 text-[#626161]">
																{sensor?.unit}
															</span>
														</strong>
														<strong className="block">
															{t('type')}:
															<span className="px-1 text-[#626161]">
																{sensor?.sensorType}
															</span>
														</strong>
													</span>
												)}

												{/* shown when edit button clicked */}
												{sensor?.editing && (
													<div className="mb-4 pr-4">
														{isSchemaSensor && (
															<div className="mb-4 rounded border border-blue-200 bg-blue-50 p-3 text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100">
																{t('schema_fields_locked')}
															</div>
														)}
														<div className="mb-4">
															<label
																htmlFor="phenomenom"
																className="mb-1 inline-block font-bold"
															>
																{t('phenomenon')}:
															</label>
															<input
																type="text"
																defaultValue={sensor?.title}
																placeholder="Phenomenon"
																className="form-control"
																disabled={!canEditSchemaFields}
																onChange={(e) => {
																	if (!canEditSchemaFields) return
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
																{t('unit')}:
															</label>
															<input
																type="text"
																defaultValue={sensor?.unit}
																placeholder="Unit"
																className="form-control"
																disabled={!canEditSchemaFields}
																onChange={(e) => {
																	if (!canEditSchemaFields) return
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
																{t('type')}
															</label>
															<input
																type="text"
																defaultValue={sensor?.sensorType}
																placeholder="Type"
																className="form-control"
																disabled={!canEditSchemaFields}
																onChange={(e) => {
																	if (!canEditSchemaFields) return
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
														<span className="bg-[#d9534f] p-0.75 leading-[1.6] text-[#fff]">
															{t('sensor_will_be_deleted')}
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
															className="mt-2 mb-1 block rounded-[3px] border-[#2e6da4] bg-[#337ab7] px-1.25 py-0.75 pt-1 text-[14px] leading-[1.6] text-[#fff] hover:border-[#204d74] hover:bg-[#286090]"
														>
															<Undo2 className="mr-1 inline-block h-4.25 w-4 align-sub" />
															{t('undo')}
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
																className="mt-2 mb-1 block rounded-[3px] border-[#2e6da4] bg-[#337ab7] px-1.25 py-0.75 pt-1 text-[14px] leading-[1.6] text-[#fff] hover:border-[#204d74] hover:bg-[#286090]"
															>
																<Edit className="mr-1 inline-block h-4.25 w-3.75 align-sub" />
																{isSchemaSensor ? t('edit_icon') : t('edit')}
															</button>

															{/* delete button */}
															{!isSchemaSensor && (
																<button
																	type="button"
																	onClick={() => {
																		setTepmState(!tepmState)
																		sensor.deleting = true
																		sensor.deleted = true
																		return false
																	}}
																	className="mt-2 mb-1 block rounded-[3px] border-[#d43f3a] bg-[#d9534f] px-1.25 py-0.75 pt-1 text-[14px] leading-[1.6] text-[#fff] hover:border-[#ac2925] hover:bg-[#c9302c]"
																>
																	<Trash2 className="mr-1 inline-block h-4.25 w-4 align-sub" />
																	{t('delete')}
																</button>
															)}
														</span>
													)}
												</span>

												{sensor?.editing && (
													<span className="table-cell h-55.5 align-middle leading-[1.6]">
														{/* invalid input text */}
														{sensor?.notValidInput && (
															<span className="bg-[#d9534f] p-0.75 leading-[1.6] text-[#fff]">
																{t('fill_required_fields')}
															</span>
														)}

														{/* save button */}
														<button
															type="button"
															disabled={sensor?.notValidInput}
															className="mt-2 mb-1 block rounded-[3px] border-[#2e6da4] bg-[#337ab7] px-1.25 py-0.75 pt-1 text-[14px] leading-[1.6] text-[#fff] hover:border-[#204d74] hover:bg-[#286090] disabled:cursor-not-allowed"
															onClick={() => {
																setTepmState(!tepmState)
																if (
																	isSchemaSensor ||
																	(sensor.title &&
																		sensor.unit &&
																		sensor.sensorType)
																) {
																	sensor.notValidInput = false
																	sensor.editing = false
																	sensor.edited = true
																} else {
																	sensor.notValidInput = true
																}
															}}
														>
															<Save className="mr-1 inline-block h-4.25 w-3.75 align-sub" />
															{t('save')}
														</button>

														{/* cancel button */}
														<button
															type="button"
															onClick={() => {
																setTepmState(!tepmState)
																if (sensor?.new) {
																	sensorsData.splice(index, 1)
																} else {
																	const originalSensor =
																		originalSensorsData.find(
																			(original: any) =>
																				original.id === sensor.id,
																		)
																	sensor.editing = false
																	//* restore data
																	sensor.title = originalSensor?.title
																	sensor.unit = originalSensor?.unit
																	sensor.sensorType = originalSensor?.sensorType
																	sensor.icon = originalSensor?.icon
																}
															}}
															className="mt-2 mb-1 block rounded-[3px] border-[#ac2925] bg-[#d9534f] px-1.25 py-0.75 pt-1 text-[14px] leading-[1.6] text-[#fff] hover:border-[#ac2925] hover:bg-[#c9302c]"
														>
															<X className="mr-1 inline-block h-4.25 w-3.75 scale-[1.2] align-sub" />
															{t('cancel')}
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
