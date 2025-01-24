import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '../ui/table'

interface SensorComparisonProps {
	devices: any[]
	sensorTitles: string[]
}

export function SensorComparison({
	devices,
	sensorTitles,
}: SensorComparisonProps) {
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
							return (
								<TableCell key={device.id}>
									{sensor ? (
										<div>
											<div>
												{sensor.value} {sensor.unit}
											</div>
											<div className="text-sm text-muted-foreground">
												Last updated:{' '}
												{new Date(sensor.time).toLocaleString()}
											</div>
										</div>
									) : (
										'---'
									)}
								</TableCell>
							)
						})}
					</TableRow>
				))}
			</TableBody>
		</Table>
	)
}
