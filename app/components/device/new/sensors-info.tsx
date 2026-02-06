import { useState, useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { z } from 'zod'
import { CustomDeviceConfig } from './custom-device-config'
import { Card, CardContent } from '~/components/ui/card'
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
	const selectedDevice = watch('model')
	const [selectedDeviceModel, setSelectedDeviceModel] = useState<string | null>(
		null,
	)
	const [sensors, setSensors] = useState<Sensor[]>([])
	const [selectedSensors, setSelectedSensors] = useState<Sensor[]>([])

	useEffect(() => {
		if (selectedDevice) {
			const deviceModel = selectedDevice.startsWith('homeV2')
				? 'senseBoxHomeV2'
				: selectedDevice
			setSelectedDeviceModel(deviceModel)

			if (deviceModel !== 'custom') {
				const fetchedSensors = getSensorsForModel(deviceModel)
				setSensors(fetchedSensors)
			} else {
				setSensors([])
			}
		}
	}, [selectedDevice])

	useEffect(() => {
		const savedSelectedSensors = watch('selectedSensors') || []
		setSelectedSensors(savedSelectedSensors)
	}, [watch])

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

	if (!selectedDevice) {
		return <p className="text-center text-lg">Please select a device first.</p>
	}

	if (selectedDevice === 'custom') {
		return <CustomDeviceConfig />
	}

	return (
		<div className="flex h-full flex-col items-center">
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

						return (
							<Card
								key={group.sensorType}
								className={cn(
									'transform cursor-pointer overflow-hidden transition-all duration-300 ease-in-out hover:scale-105',
									isGroupSelected
										? 'shadow-lg ring-2 ring-primary'
										: 'hover:shadow-md',
								)}
								onClick={
									selectedDeviceModel === 'senseBoxHomeV2'
										? () => handleGroupToggle(group)
										: undefined
								}
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

											return (
												<li
													key={sensor.title}
													className={cn(
														'cursor-pointer rounded-md px-2 py-1 text-sm text-gray-600',
														isSelected
															? 'bg-primary text-white'
															: 'hover:bg-gray-100',
													)}
													onClick={
														selectedDeviceModel !== 'senseBoxHomeV2'
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
