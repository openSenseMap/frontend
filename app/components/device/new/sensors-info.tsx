import { useState, useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { z } from 'zod'
import { CustomDeviceConfig } from './custom-device-config'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '~/components/ui/accordion'
import { Badge } from '~/components/ui/badge'
import { Checkbox } from '~/components/ui/checkbox'
import { Label } from '~/components/ui/label'
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

			const fetchedSensors = getSensorsForModel(deviceModel)
			setSensors(fetchedSensors)
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

	const isSensorSelected = (sensor: Sensor) =>
		selectedSensors.some(
			(s) => s.title === sensor.title && s.sensorType === sensor.sensorType,
		)

	const isGroupFullySelected = (group: SensorGroup) =>
		group.sensors.every((sensor) => isSensorSelected(sensor))

	const isGroupPartiallySelected = (group: SensorGroup) =>
		group.sensors.some((sensor) => isSensorSelected(sensor)) &&
		!isGroupFullySelected(group)

	const getSelectedCountForGroup = (group: SensorGroup) =>
		group.sensors.filter((sensor) => isSensorSelected(sensor)).length

	const handleSensorToggle = (sensor: Sensor) => {
		const isAlreadySelected = isSensorSelected(sensor)

		const updatedSensors = isAlreadySelected
			? selectedSensors.filter(
					(s) =>
						!(s.title === sensor.title && s.sensorType === sensor.sensorType),
				)
			: [...selectedSensors, sensor]

		setSelectedSensors(updatedSensors)
		setValue('selectedSensors', updatedSensors)
	}

	const handleGroupToggle = (group: SensorGroup) => {
		const isFullySelected = isGroupFullySelected(group)

		const updatedSensors = isFullySelected
			? selectedSensors.filter(
					(s) =>
						!group.sensors.some(
							(sensor) =>
								s.title === sensor.title && s.sensorType === sensor.sensorType,
						),
				)
			: [
					...selectedSensors,
					...group.sensors.filter((sensor) => !isSensorSelected(sensor)),
				]

		setSelectedSensors(updatedSensors)
		setValue('selectedSensors', updatedSensors)
	}

	if (!selectedDevice) {
		return <p className="text-center text-lg">Please select a device first.</p>
	}

	if (selectedDevice === 'Custom') {
		return <CustomDeviceConfig />
	}

	const isSenseBoxHomeV2 = selectedDeviceModel === 'senseBoxHomeV2'

	return (
		<div className="flex h-full flex-col">
			{/* Selected count summary */}
			<div className="mb-4 flex items-center justify-between">
				<p className="text-sm text-muted-foreground">
					{selectedSensors.length} sensor
					{selectedSensors.length !== 1 ? 's' : ''} selected
				</p>
				{selectedSensors.length > 0 && (
					<button
						type="button"
						className="text-sm text-destructive hover:underline"
						onClick={() => {
							setSelectedSensors([])
							setValue('selectedSensors', [])
						}}
					>
						Clear all
					</button>
				)}
			</div>

			<Accordion type="multiple" className="w-full space-y-2">
				{sensorGroups.map((group) => {
					const isFullySelected = isGroupFullySelected(group)
					const isPartiallySelected = isGroupPartiallySelected(group)
					const selectedCount = getSelectedCountForGroup(group)

					return (
						<AccordionItem
							key={group.sensorType}
							value={group.sensorType}
							className={cn(
								'rounded-lg border px-4',
								isFullySelected && 'border-primary bg-primary/5',
								isPartiallySelected && 'border-primary/50',
							)}
						>
							<AccordionTrigger className="hover:no-underline">
								<div className="flex w-full items-center justify-between pr-4">
									<div className="flex items-center gap-3">
										{group.image && (
											<img
												src={group.image}
												alt={group.sensorType}
												className="h-10 w-10 rounded object-cover"
											/>
										)}
										<div className="text-left">
											<p className="font-medium">{group.sensorType}</p>
											<p className="text-xs text-muted-foreground">
												{group.sensors.length} parameter
												{group.sensors.length !== 1 ? 's' : ''}
											</p>
										</div>
									</div>
									{selectedCount > 0 && (
										<Badge variant="secondary" className="ml-2">
											{selectedCount} selected
										</Badge>
									)}
								</div>
							</AccordionTrigger>
							<AccordionContent className="pb-4">
								<div className="space-y-3 pt-2">
									{/* Select All option */}
									<div
										className="flex items-center space-x-3 rounded-md bg-muted/50 p-3"
										onClick={(e) => e.stopPropagation()}
									>
										<Checkbox
											id={`group-${group.sensorType}`}
											checked={isFullySelected}
											// Show indeterminate state for partial selection
											data-state={
												isPartiallySelected ? 'indeterminate' : undefined
											}
											onCheckedChange={() => handleGroupToggle(group)}
										/>
										<Label
											htmlFor={`group-${group.sensorType}`}
											className="cursor-pointer font-medium"
										>
											Select all parameters
										</Label>
									</div>

									{/* Individual sensors - only show for non-senseBoxHomeV2 or always show */}
									{!isSenseBoxHomeV2 && (
										<div className="ml-2 space-y-2 border-l-2 border-muted pl-4">
											{group.sensors.map((sensor) => {
												const isSelected = isSensorSelected(sensor)
												const sensorId = `sensor-${group.sensorType}-${sensor.title}`

												return (
													<div
														key={sensor.title}
														className={cn(
															'flex items-center space-x-3 rounded-md p-2 transition-colors',
															isSelected
																? 'bg-primary/10'
																: 'hover:bg-muted/50',
														)}
														onClick={(e) => e.stopPropagation()}
													>
														<Checkbox
															id={sensorId}
															checked={isSelected}
															onCheckedChange={() => handleSensorToggle(sensor)}
														/>
														<Label
															htmlFor={sensorId}
															className="flex cursor-pointer items-center gap-2"
														>
															<span>{sensor.title}</span>
															<span className="text-xs text-muted-foreground">
																({sensor.unit})
															</span>
														</Label>
													</div>
												)
											})}
										</div>
									)}

									{/* For senseBoxHomeV2, just show the parameters as info */}
									{isSenseBoxHomeV2 && (
										<div className="ml-2 space-y-1 text-sm text-muted-foreground">
											<p className="font-medium text-foreground">Includes:</p>
											{group.sensors.map((sensor) => (
												<p key={sensor.title} className="ml-2">
													• {sensor.title} ({sensor.unit})
												</p>
											))}
										</div>
									)}
								</div>
							</AccordionContent>
						</AccordionItem>
					)
				})}
			</Accordion>
		</div>
	)
}
