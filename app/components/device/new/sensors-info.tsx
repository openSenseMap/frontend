import { InfoIcon } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { z } from 'zod'
import { CustomDeviceConfig } from './custom-device-config'
import { Card, CardContent } from '~/components/ui/card'
import { useToast } from '~/components/ui/use-toast'
import { cn } from '~/lib/utils'
import { getSensorsForModel } from '~/utils/model-definitions'

export const sensorSchema = z.object({
	title: z.string(),
	unit: z.string(),
	sensorType: z.string(),
	icon: z.string().optional(),
	image: z.string().optional(),
})

export type Sensor = z.infer<typeof sensorSchema>

type SensorGroup = {
	sensorType: string
	sensors: Sensor[]
	image?: string
}

export function SensorSelectionStep() {
	const { watch, setValue } = useFormContext()
	const { toast } = useToast()
	const selectedDevice = watch('model')
	const [selectedDeviceModel, setSelectedDeviceModel] = useState<string | null>(
		null,
	)
	const [sensors, setSensors] = useState<Sensor[]>([])
	const [selectedSensors, setSelectedSensors] = useState<Sensor[]>([])
	const [highlightedGroup, setHighlightedGroup] = useState<string | null>(null)

	useEffect(() => {
		if (selectedDevice) {
			const deviceModel = selectedDevice.startsWith('homeV2')
				? 'senseBoxHomeV2'
				: selectedDevice
			setSelectedDeviceModel(deviceModel)

			const fetchSensors = () => {
				const fetchedSensors = getSensorsForModel(deviceModel)
				setSensors(fetchedSensors)
			}
			fetchSensors()
		}
	}, [selectedDevice])

	useEffect(() => {
		const savedSelectedSensors = watch('selectedSensors') || []
		setSelectedSensors(savedSelectedSensors)
	}, [watch])

	// Clear highlight after a delay
	useEffect(() => {
		if (highlightedGroup) {
			const timer = setTimeout(() => {
				setHighlightedGroup(null)
			}, 2000)
			return () => clearTimeout(timer)
		}
	}, [highlightedGroup])

	const groupSensorsByType = (sensors: Sensor[]): SensorGroup[] => {
		const grouped = sensors.reduce(
			(acc, sensor) => {
				if (!acc[sensor.sensorType]) {
					acc[sensor.sensorType] = []
				}
				acc[sensor.sensorType].push(sensor)
				return acc
			},
			{} as Record<string, Sensor[]>,
		)
	const groupSensorsByType = (sensors: Sensor[]): SensorGroup[] => {
		const grouped = sensors.reduce(
			(acc, sensor) => {
				if (!acc[sensor.sensorType]) {
					acc[sensor.sensorType] = []
				}
				acc[sensor.sensorType].push(sensor)
				return acc
			},
			{} as Record<string, Sensor[]>,
		)

		return Object.entries(grouped).map(([sensorType, sensors]) => ({
			sensorType,
			sensors,
			image: sensors.find((sensor) => sensor.image)?.image,
		}))
	}
		return Object.entries(grouped).map(([sensorType, sensors]) => ({
			sensorType,
			sensors,
			image: sensors.find((sensor) => sensor.image)?.image,
		}))
	}

	const sensorGroups = groupSensorsByType(sensors)
	const sensorGroups = groupSensorsByType(sensors)

	const handleGroupToggle = (group: SensorGroup) => {
		const isGroupSelected = group.sensors.every((sensor) =>
			selectedSensors.some(
				(s) => s.title === sensor.title && s.sensorType === sensor.sensorType,
			),
		)

		const updatedSensors = isGroupSelected
			? selectedSensors.filter(
					(s) =>
						!group.sensors.some(
							(sensor) =>
								s.title === sensor.title && s.sensorType === sensor.sensorType,
						),
				)
			: [
					...selectedSensors,
					...group.sensors.filter(
						(sensor) =>
							!selectedSensors.some(
								(s) =>
									s.title === sensor.title &&
									s.sensorType === sensor.sensorType,
							),
					),
				]

		setSelectedSensors(updatedSensors)
		setValue('selectedSensors', updatedSensors)
	}

	const handleCardClick = (group: SensorGroup) => {
		if (selectedDeviceModel === 'senseBoxHomeV2') {
			// For senseBoxHomeV2, clicking the card selects the whole group
			handleGroupToggle(group)
		} else {
			// For other devices, highlight parameters and show info toast
			setHighlightedGroup(group.sensorType)
			toast({
				title: 'Select Parameters',
				description:
					'Click on the individual parameters below to select the sensors you want to use.',
				duration: 3000,
			})
		}
	}

	const handleSensorToggle = (sensor: Sensor) => {
		const isAlreadySelected = selectedSensors.some(
			(s) => s.title === sensor.title && s.sensorType === sensor.sensorType,
		)
	const handleSensorToggle = (sensor: Sensor) => {
		const isAlreadySelected = selectedSensors.some(
			(s) => s.title === sensor.title && s.sensorType === sensor.sensorType,
		)

		const updatedSensors = isAlreadySelected
			? selectedSensors.filter(
					(s) =>
						!(s.title === sensor.title && s.sensorType === sensor.sensorType),
				)
			: [...selectedSensors, sensor]

		setSelectedSensors(updatedSensors)
		setValue('selectedSensors', updatedSensors)
	}
		const updatedSensors = isAlreadySelected
			? selectedSensors.filter(
					(s) =>
						!(s.title === sensor.title && s.sensorType === sensor.sensorType),
				)
			: [...selectedSensors, sensor]

		setSelectedSensors(updatedSensors)
		setValue('selectedSensors', updatedSensors)
	}

	if (!selectedDevice) {
		return <p className="text-center text-lg">Please select a device first.</p>
	}
	if (!selectedDevice) {
		return <p className="text-center text-lg">Please select a device first.</p>
	}

	if (selectedDevice === 'Custom') {
		return <CustomDeviceConfig />
	}

	const isSenseBoxHomeV2 = selectedDeviceModel === 'senseBoxHomeV2'

	return (
		<div className="flex h-full flex-col items-center">
			{/* Instruction banner */}
			<div className="bg-blue-50 border-blue-200 text-blue-800 mb-4 w-full rounded-md border p-3 text-sm">
				{isSenseBoxHomeV2 ? (
					<span>
						Click on a sensor card to select all its parameters at once.
					</span>
				) : (
					<span className="inline-flex items-center gap-1">
						<InfoIcon className="text-slate-500" />
						<p>
							Click on individual parameters within each card to select the
							sensors you need.
						</p>
					</span>
				)}
			</div>

			<div className="container mx-auto space-y-6 overflow-auto rounded-md bg-white p-4">
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					{sensorGroups.map((group) => {
						const isGroupSelected = group.sensors.every((sensor) =>
							selectedSensors.some(
								(s) =>
									s.title === sensor.title &&
									s.sensorType === sensor.sensorType,
							),
						)
						const isHighlighted = highlightedGroup === group.sensorType

						return (
							<Card
								key={group.sensorType}
								className={cn(
									'transform cursor-pointer overflow-hidden transition-all duration-300 ease-in-out hover:scale-105',
									isGroupSelected
										? 'shadow-lg ring-2 ring-primary'
										: 'hover:shadow-md',
									isHighlighted && 'ring-blue-400 bg-blue-50 ring-2',
								)}
								onClick={() => handleCardClick(group)}
							>
								<CardContent className="p-6">
									<h3
										className="mb-4 break-words text-xl font-semibold"
										style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}
										title={group.sensorType}
									>
										{group.sensorType}
									</h3>

									<ul className="mb-4 space-y-2">
										{group.sensors.map((sensor) => {
											const isSelected = selectedSensors.some(
												(s) =>
													s.title === sensor.title &&
													s.sensorType === sensor.sensorType,
											)
									<ul className="mb-4 space-y-2">
										{group.sensors.map((sensor) => {
											const isSelected = selectedSensors.some(
												(s) =>
													s.title === sensor.title &&
													s.sensorType === sensor.sensorType,
											)

											return (
												<li
													key={sensor.title}
													className={cn(
														'cursor-pointer rounded-md px-2 py-1 text-sm transition-all duration-200',
														isSelected
															? 'bg-primary text-white'
															: 'text-gray-600 hover:bg-gray-100',
														// Highlight animation when card is clicked (non-senseBoxHomeV2)
														isHighlighted &&
															!isSelected &&
															'text-blue-800 animate-pulse bg-blue-100 font-medium',
													)}
													onClick={
														!isSenseBoxHomeV2
															? (e) => {
																	e.stopPropagation()
																	handleSensorToggle(sensor)
																}
															: undefined
													}
												>
													{sensor.title} ({sensor.unit})
												</li>
											)
										})}
									</ul>
									<div className="flex h-32 w-32 items-center justify-center rounded-md">
										{group.image && (
											<img
												src={group.image}
												alt={`${group.sensorType} placeholder`}
												className="h-full w-full rounded-md object-cover"
											/>
										)}
									</div>
								</CardContent>
							</Card>
						)
					})}
				</div>
			</div>
		</div>
	)
}
