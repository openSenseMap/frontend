import { formatDistanceToNow } from 'date-fns'
import {
	Link,
	useMatches,
	useNavigation,
	useParams,
	useSearchParams,
} from 'react-router'
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from '../ui/card'
import { toast } from '../ui/use-toast'
import SensorIcon from '../sensor-icon'
import { type SensorWithLatestMeasurement } from '~/schema'
import { Separator } from '../ui/separator'

export default function SensorCards({
	sensors,
}: {
	sensors: SensorWithLatestMeasurement[]
}) {
	const navigation = useNavigation()
	const matches = useMatches()
	const [searchParams] = useSearchParams()
	const { deviceId } = useParams()

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
			return `/explore/${deviceId}/${Array.from(clonedSet).join('/')}?${searchParams.toString()}`
		} else if (sensorIds.has(sensorIdToBeSelected) && sensorIds.size === 1) {
			return `/explore/${deviceId}?${searchParams.toString()}`
		} else if (sensorIds.size === 0) {
			return `/explore/${deviceId}/${sensorIdToBeSelected}?${searchParams.toString()}`
		} else if (sensorIds.size === 1) {
			return `/explore/${deviceId}/${Array.from(sensorIds).join('/')}/${sensorIdToBeSelected}?${searchParams.toString()}`
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
		<div
			className={navigation.state === 'loading' ? 'pointer-events-none' : ''}
		>
			<div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
				{sensors &&
					sensors.map((sensor) => {
						const sensorLink = createSensorLink(sensor.id)
						if (sensorLink === '') {
							return (
								<Card
									key={sensor.id}
									onClick={() =>
										toast({
											title: 'Cant select more than 2 sensors',
											description: 'Deselect one sensor to select another',
											variant: 'destructive',
										})
									}
								>
									<label htmlFor={sensor.id} className="cursor-pointer">
										<input
											className="peer hidden"
											disabled={
												!sensorIds.has(sensor.id) && sensorIds.size >= 2
													? true
													: false
											}
											type="checkbox"
											name="sensor"
											id={sensor.id}
											value={sensor.id}
											defaultChecked={sensorIds.has(sensor.id)}
										/>
										<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
											<CardTitle className="text-sm font-medium">
												{sensor.title}
											</CardTitle>
											<SensorIcon
												title={sensor.title || ''}
												className="h-4 w-4 text-muted-foreground"
											/>
										</CardHeader>
										<CardContent>
											<div className="flex flex-row items-center space-x-2">
												<div className="text-2xl font-bold">{sensor.value}</div>
												<p className="text-xs text-muted-foreground">
													{sensor.unit}
												</p>
											</div>
										</CardContent>
										<Separator />
										<CardFooter className="justify-between px-6 py-3">
											<div className="flex items-center gap-1">
												<div
													className={
														sensor.status === 'active'
															? 'h-2 w-2 rounded-full bg-light-green'
															: 'h-2 w-2 rounded-full bg-red-500'
													}
												></div>
												<p className="text-xs text-muted-foreground">
													{formatDistanceToNow(new Date(sensor.time))} ago
												</p>
											</div>
										</CardFooter>
									</label>
								</Card>
							)
						}
						return (
							<Link key={sensor.id} to={sensorLink}>
								<Card key={sensor.id} className={isSensorActive(sensor.id)}>
									<label htmlFor={sensor.id} className="cursor-pointer">
										<input
											className="peer hidden"
											disabled={
												!sensorIds.has(sensor.id) && sensorIds.size >= 2
													? true
													: false
											}
											type="checkbox"
											name="sensor"
											id={sensor.id}
											value={sensor.id}
											defaultChecked={sensorIds.has(sensor.id)}
										/>
										<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
											<CardTitle className="text-sm font-medium">
												{sensor.title}
											</CardTitle>
											<SensorIcon
												title={sensor.title || ''}
												className="h-4 w-4 text-muted-foreground"
											/>
										</CardHeader>
										<CardContent>
											<div className="flex flex-row items-center space-x-2">
												<div className="text-2xl font-bold">{sensor.value}</div>
												<p className="text-xs text-muted-foreground">
													{sensor.unit}
												</p>
											</div>
										</CardContent>
										<Separator />
										<CardFooter className="justify-between px-6 py-3">
											<div className="flex items-center gap-1">
												<div
													className={
														sensor.status === 'active'
															? 'h-2 w-2 rounded-full bg-light-green'
															: 'h-2 w-2 rounded-full bg-red-500'
													}
												></div>
												<p className="text-xs text-muted-foreground">
													{formatDistanceToNow(new Date(sensor.time))} ago
												</p>
											</div>
										</CardFooter>
									</label>
								</Card>
							</Link>
						)
					})}
			</div>
		</div>
	)
}
