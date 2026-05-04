import Home from '../header/home'
import Menu from '../header/menu'
import NavBar from '../header/nav-bar'
import Info from '../header/info'
import { useTranslation } from 'react-i18next'
import Settings from '../header/settings'

interface MapHeaderProps {
	user: any
	devices: any
	selectedPheno?: {
		slug: string
		label: {
			item: {
				text: string
			}[]
		}
	} | null
	selectedDevice?: any
	filteredDeviceCount?: number
	measurementCount: number | undefined
}

export default function MapHeader({
	user,
	devices,
	selectedPheno,
	selectedDevice,
	filteredDeviceCount,
	measurementCount,
}: MapHeaderProps) {
	const { t } = useTranslation('menu')
	return (
		<header className="pointer-events-none absolute top-0 left-0 z-20 w-full">
			<div className="pointer-events-auto flex min-h-14 w-full items-center justify-between gap-4 bg-white/90 px-3 py-2 shadow-md backdrop-blur-md">
				<div className="flex items-center gap-3">
					<Home />

					{devices.features.length && (
						<section className="flex flex-col text-sm">
							<p>
								<span className="text-green-700">
									{devices.features.length + ' '}
								</span>
								<span>{t('devices')}</span>
							</p>
							<p>
								<span className="text-green-700">
									{(measurementCount ?? 0) + ' '}
								</span>
								<span>{t('measurements')}</span>
							</p>
						</section>
					)}

					<div className="hidden min-w-0 flex-col sm:flex">
						<div className="truncate text-sm font-semibold text-gray-900">
							{selectedPheno
								? selectedPheno.label.item[0].text
								: selectedDevice
									? selectedDevice.properties.name
									: t('explore_sensors')}
						</div>

						<div className="truncate text-xs text-gray-500">
							{selectedPheno
								? `${filteredDeviceCount ?? devices?.length ?? 0} measurements shown`
								: `${filteredDeviceCount ?? devices?.length ?? 0} devices available`}
						</div>
					</div>
				</div>

				<div className="min-w-0 flex-1">
					<NavBar devices={devices} />
				</div>

				<div className="flex shrink-0 items-center gap-2">
					{/* <div className="flex h-10 w-16 items-center justify-center rounded-full bg-white shadow-sm">
						<LanguageSelector />
					</div>

					<Download devices={devices} /> */}
					<Info />
					{user && <Settings />}
					<Menu devices={devices} />
				</div>
			</div>
		</header>
	)
}
