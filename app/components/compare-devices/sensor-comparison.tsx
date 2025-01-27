import {
	Link,
	useLocation,
	useMatches,
	useParams,
	useSearchParams,
} from 'react-router'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '../ui/table'
import { toast } from '../ui/use-toast'
import { Minus } from 'lucide-react'

interface SensorComparisonProps {
	devices: any[]
	sensorTitles: string[]
}

export function SensorComparison({
	devices,
	sensorTitles,
}: SensorComparisonProps) {
	const matches = useMatches()
	const [searchParams] = useSearchParams()
	const { deviceId, deviceId2 } = useParams()

	const sensorIds = new Set()

	const createSensorLink = (sensorIdToBeSelected: string) => {
		const lastSegment = matches[matches.length - 1]?.params?.['*']
		if (lastSegment) {
			const secondLastSegment = matches[matches.length - 2]?.params?.sensorId
			sensorIds.add(secondLastSegment)
			sensorIds.add(lastSegment)
		} else {
			const lastSegment = matches[matches.length - 1]?.params?.sensorId
			if (lastSegment) {
				sensorIds.add(lastSegment)
			}
		}

		// If sensorIdToBeSelected is second selected sensor
		if (sensorIds.has(sensorIdToBeSelected) && sensorIds.size === 2) {
			const clonedSet = new Set(sensorIds)
			clonedSet.delete(sensorIdToBeSelected)
			return `/explore/${deviceId}/compare/${deviceId2}/${Array.from(clonedSet).join('/')}?${searchParams.toString()}`
		} else if (sensorIds.has(sensorIdToBeSelected) && sensorIds.size === 1) {
			return `/explore/${deviceId}/compare/${deviceId2}?${searchParams.toString()}`
		} else if (sensorIds.size === 0) {
			return `/explore/${deviceId}/compare/${deviceId2}/${sensorIdToBeSelected}?${searchParams.toString()}`
		} else if (sensorIds.size === 1) {
			return `/explore/${deviceId}/compare/${deviceId2}/${Array.from(sensorIds).join('/')}/${sensorIdToBeSelected}?${searchParams.toString()}`
		}

		return ''
	}

	const isSensorActive = (sensorId: string) => {
		if (sensorIds.has(sensorId)) {
			return 'bg-green-100 dark:bg-dark-green'
		}
		return 'hover:bg-muted'
	}

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Sensor</TableHead>
					{devices.map((device) => (
						<TableHead key={device.id}>{device.name}</TableHead>
					))}
				</TableRow>
			</TableHeader>
			<TableBody>
				{sensorTitles.map((title) => (
					<TableRow key={title}>
						<TableCell className="font-medium">{title}</TableCell>
						{devices.map((device) => {
							const sensor = device.sensors.find((s: any) => s.title === title)

							// If sensor is undefined, return a placeholder cell
							if (!sensor) {
								return (
									<TableCell key={device.id}>
										<Minus />
									</TableCell>
								)
							}

							const sensorLink = createSensorLink(sensor.id)
							if (sensorLink === '') {
								return (
									<TableCell
										key={device.id}
										onClick={() =>
											toast({
												title: "Can't select more than 2 sensors",
												description: 'Deselect one sensor to select another',
												variant: 'destructive',
											})
										}
									>
										<div>
											<div>
												{sensor.value} {sensor.unit}
											</div>
											<div className="text-sm text-muted-foreground">
												Last updated: {new Date(sensor.time).toLocaleString()}
											</div>
										</div>
									</TableCell>
								)
							}

							return (
								<TableCell
									key={device.id}
									className={isSensorActive(sensor.id)}
								>
									<Link to={sensorLink}>
										<div>
											{sensor.value} {sensor.unit}
										</div>
										<div className="text-sm text-muted-foreground">
											Last updated: {new Date(sensor.time).toLocaleString()}
										</div>
									</Link>
								</TableCell>
							)
						})}
					</TableRow>
				))}
			</TableBody>
		</Table>
	)
}
