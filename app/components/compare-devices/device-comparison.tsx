import { Device } from '~/schema'
import DeviceInfo from './device-info'
import { SensorComparison } from './sensor-comparison'
import { Separator } from '../ui/separator'

interface DeviceComparisonProps {
	devices: any[]
}

export function DeviceComparison({ devices }: DeviceComparisonProps) {
	const allSensors = devices.flatMap((device) => device.sensors)
	const uniqueSensorTitles = [
		...new Set(allSensors.map((sensor) => sensor.title)),
	]

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-4">
				{devices.map((device) => (
					<DeviceInfo
						key={device.id}
						device={device}
						otherDeviceId={devices.find((d) => d.id !== device.id)?.id}
					/>
				))}
				<Separator orientation="vertical" />
			</div>
			<SensorComparison devices={devices} sensorTitles={uniqueSensorTitles} />
		</div>
	)
}
