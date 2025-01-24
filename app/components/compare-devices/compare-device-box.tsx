import { X } from 'lucide-react'
import Spinner from '../spinner'
import { useNavigate, useNavigation, useSearchParams } from 'react-router'
import DeviceInfo from './device-info'
import { SensorComparison } from './sensor-comparison'
import { DeviceComparison } from './device-comparison'

export default function CompareDevices({
	devicesWithSensors,
}: {
	devicesWithSensors: any[]
}) {
	const navigate = useNavigate()
	const navigation = useNavigation()
	const [searchParams] = useSearchParams()

	const allSensors = devicesWithSensors.flatMap((device) => device.sensors)
	const uniqueSensorTitles = [
		...new Set(allSensors.map((sensor) => sensor.title)),
	]

	return (
		<>
			<div className="absolute bottom-6 left-4 right-4 top-14 z-40 flex flex-row px-4 py-2 md:bottom-[30px] md:left-[10px] md:top-auto md:max-h-[calc(100vh-8rem)] md:w-1/3 md:p-0">
				<div className="shadow-zinc-800/5 ring-zinc-900/5 relative float-left flex h-full max-h-[calc(100vh-4rem)] w-auto flex-col gap-4 rounded-xl bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-lg ring-1 dark:bg-zinc-800 dark:text-zinc-200 dark:opacity-95 dark:ring-white dark:backdrop-blur-sm md:max-h-[calc(100vh-8rem)]">
					{navigation.state === 'loading' && (
						<div className="bg-white/30 dark:bg-zinc-800/30 absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
							<Spinner />
						</div>
					)}
					{/* this is the header */}
					<div className="flex w-full cursor-move items-center gap-3 py-2">
						<X
							className="cursor-pointer"
							onClick={() => {
								void navigate({
									pathname: '/explore',
									search: searchParams.toString(),
								})
							}}
						/>
					</div>
					<div className="no-scrollbar relative flex-1 overflow-y-scroll">
						<div className="no-scrollbar relative flex-1 overflow-y-auto">
							<DeviceComparison devices={devicesWithSensors} />
						</div>
					</div>
				</div>
			</div>
		</>
	)
}
