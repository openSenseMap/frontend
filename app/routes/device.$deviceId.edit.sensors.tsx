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
	useNavigation,
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
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { useToast } from '@/components/ui/use-toast'
import { useTranslation } from 'react-i18next'
import { Button } from '~/components/ui/button'
import { Callout } from '~/components/ui/alert'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'

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

	let persistedOrder = 0

	for (const sensor of updatedSensorsDataJson) {
		if (sensor?.new === true && sensor?.edited === true) {
			await addNewSensor({
				title: sensor.title,
				unit: sensor.unit,
				sensorType: sensor.sensorType,
				icon: sensor.icon,
				deviceId,
				order: persistedOrder,
			})
			persistedOrder++
		} else if (sensor?.deleted === true) {
			await deleteSensor(sensor.id)
		} else if (!sensor?.new) {
			await updateSensor({
				id: sensor.id,
				title: sensor.title,
				unit: sensor.unit,
				sensorType: sensor.sensorType,
				icon: sensor.icon,
				order: persistedOrder,
			})
			persistedOrder++
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
	const navigation = useNavigation()
	const isSubmitting = navigation.state !== 'idle'

	const { copyToClipboard } = useCopyToClipboard()
	const { toast } = useToast()
	const { t } = useTranslation('edit-device-sensors')

	const copiedTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
		null,
	)
	const [copiedSensorId, setCopiedSensorId] = React.useState<string | null>(
		null,
	)
	const [sensorsData, setSensorsData] = useState(data)

	/* temp impl. until figuring out how to updating state of nested objects  */
	const [tepmState, setTepmState] = useState(false)

	const dragIndexRef = React.useRef<number | null>(null)
	//* to view toast on edit-page
	const [setToastOpen] = useOutletContext<[(_open: boolean) => void]>()

	// Need to look up original sensor id in case a new sensor is prepended
	// in edit mode and the operation is cancelled
	const getOriginalSensor = React.useCallback(
		(sensor: any, index: number) =>
			sensor?.id
				? data.find((item: any) => item.id === sensor.id)
				: data[index],
		[data],
	)

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
					title: t('sensor_id_copied'),
					variant: 'success',
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
										disabled={isSubmitting}
										onClick={() => {
											setSensorsData([
												{
													title: undefined,
													unit: undefined,
													sensorType: undefined,
													editing: true,
													new: true,
													notValidInput: true,
												},
												...sensorsData,
											])
										}}
										className="gap-2"
									>
										<Plus className="h-4 w-4" />
										{t('add')}
									</Button>

									<Button
										type="submit"
										name="intent"
										value="save"
										disabled={isSubmitting}
										className="gap-2"
									>
										<Save className="h-4 w-4" />
										{t('save')}
									</Button>
								</div>
							</div>
						</div>

						{/* divider */}
						<hr className="bg-border my-3 mt-6 h-px border-0" />

						<Callout variant="warning">
							<p>{t('sensor_delete_warning')}</p>
						</Callout>

						<ul className="border-border bg-card text-card-foreground mt-2 overflow-hidden rounded-md border">
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
										className="border-border hover:bg-muted/30 border-t p-4 first:border-t-0"
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
																	<Button
																		type="button"
																		variant="outline"
																		size="sm"
																		className="rounded-l-none border-l-0 px-2"
																	>
																		<ChevronDownIcon className="h-4 w-4" />
																	</Button>
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
																					<Icon className="text-muted-foreground h-4 w-4" />
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
											<div className="border-border col-span-8 border-r sm:col-span-8">
												{/* shown by default */}
												{!sensor?.editing && (
													<span className="table-cell align-middle leading-[1.75]">
														<strong className="block">
															{t('phenomenon')}:
															<span className="text-muted-foreground px-1">
																{sensor?.title}
															</span>
														</strong>
														<span className="text-foreground inline-flex max-w-full items-center gap-1">
															<strong className="text-foreground">ID:</strong>
															<div className="bg-muted text-muted-foreground border-border rounded-md border">
																<code>{sensor.id}</code>
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
															</div>
														</span>
														<strong className="text-foreground block">
															{t('unit')}:
															<span className="text-muted-foreground px-1 font-normal">
																{sensor?.unit}
															</span>
														</strong>
														<strong className="text-foreground block">
															{t('type')}:
															<span className="text-muted-foreground px-1 font-normal">
																{sensor?.sensorType}
															</span>
														</strong>
													</span>
												)}

												{/* shown when edit button clicked */}
												{sensor?.editing && (
													<div className="mb-4 pr-4">
														<div className="mb-4 space-y-1.5">
															<Label
																htmlFor={`phenomenon-${sensor.id ?? index}`}
																className="font-bold"
															>
																{t('phenomenon')}:
															</Label>

															<Input
																id={`phenomenon-${sensor.id ?? index}`}
																type="text"
																defaultValue={sensor?.title}
																placeholder="Phenomenon"
																aria-invalid={sensor.notValidInput}
																onChange={(e) => {
																	setTepmState(!tepmState)
																	sensor.title = e.target.value
																	sensor.notValidInput =
																		sensor.title.length === 0
																}}
															/>
														</div>

														<div className="mb-4 space-y-1.5">
															<Label
																htmlFor={`unit-${sensor.id ?? index}`}
																className="font-bold"
															>
																{t('unit')}:
															</Label>

															<Input
																id={`unit-${sensor.id ?? index}`}
																type="text"
																defaultValue={sensor?.unit}
																placeholder="Unit"
																aria-invalid={sensor.notValidInput}
																onChange={(e) => {
																	setTepmState(!tepmState)
																	sensor.unit = e.target.value
																	sensor.notValidInput =
																		sensor.unit.length === 0
																}}
															/>
														</div>

														<div className="mb-4 space-y-1.5">
															<Label
																htmlFor={`type-${sensor.id ?? index}`}
																className="font-bold"
															>
																{t('type')}:
															</Label>

															<Input
																id={`type-${sensor.id ?? index}`}
																type="text"
																defaultValue={sensor?.sensorType}
																placeholder="Type"
																aria-invalid={sensor.notValidInput}
																onChange={(e) => {
																	setTepmState(!tepmState)
																	sensor.sensorType = e.target.value
																	sensor.notValidInput =
																		sensor.sensorType.length === 0
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
															<Button
																type="button"
																variant="secondary"
																size="sm"
																className="mt-2 mb-1 flex gap-1"
																onClick={() => {
																	setTepmState(!tepmState)
																	sensor.editing = true
																}}
															>
																<Edit className="h-4 w-4" />
																{t('edit')}
															</Button>

															{/* delete button */}
															<Button
																type="button"
																variant="destructive"
																size="sm"
																className="mt-2 mb-1 flex gap-1"
																onClick={() => {
																	setTepmState(!tepmState)
																	sensor.deleting = true
																	sensor.deleted = true
																}}
															>
																<Trash2 className="h-4 w-4" />
																{t('delete')}
															</Button>
														</span>
													)}
												</span>

												{sensor?.editing && (
													<div className="table-cell h-55.5 align-middle leading-[1.6]">
														{sensor?.notValidInput && (
															<div className="bg-destructive text-destructive-foreground mb-2 rounded-md px-2 py-1 text-xs font-medium">
																{t('fill_required_fields')}
															</div>
														)}

														<Button
															type="button"
															size="sm"
															disabled={sensor?.notValidInput}
															className="mt-2 mb-1 flex w-full items-center justify-start gap-1"
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
															<Save className="h-4 w-4" />
															{t('save')}
														</Button>

														<Button
															type="button"
															variant="outline"
															size="sm"
															className="mt-2 mb-1 flex w-full items-center justify-start gap-1"
															onClick={() => {
																setTepmState(!tepmState)

																if (sensor?.new) {
																	sensorsData.splice(index, 1)
																} else {
																	const originalSensor = getOriginalSensor(
																		sensor,
																		index,
																	)
																	sensor.editing = false
																	sensor.title = originalSensor?.title
																	sensor.unit = originalSensor?.unit
																	sensor.sensorType = originalSensor?.sensorType
																}
															}}
														>
															<X className="h-4 w-4" />
															{t('cancel')}
														</Button>
													</div>
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
