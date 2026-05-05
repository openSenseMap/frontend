import Home from '../header/home'
import Menu from '../header/menu'
import NavBar from '../header/nav-bar'
import Info from '../header/info'
import LanguageSelector from '../landing/header/language-selector'

interface MapHeaderProps {
	user: any
	devices: any
	measurementCount: number | undefined
	onHomeClick?: () => void 
}

export default function MapHeader({
	devices,
	measurementCount,
	onHomeClick
}: MapHeaderProps) {
	return (
		<header className="pointer-events-none absolute top-0 left-0 z-20 w-full">
			<div className="pointer-events-auto flex min-h-14 w-full items-start justify-between gap-4 px-3 py-2">
				<div className="flex items-center gap-3">
					<Home
						deviceCount={devices.features.length}
						measurementCount={measurementCount ?? 0}
						onHomeClick={onHomeClick}
					/>

				</div>

				<div className="min-w-0 flex-1">
					<NavBar devices={devices} />
				</div>

				<div className="flex shrink-0 items-center gap-2 md:ml-14">
					<LanguageSelector />

					<Info />
					{/* TODO: add settings menu once we have theme, more languages etc. */}
					{/* {user && <Settings />} */}
					<Menu devices={devices} />
				</div>
			</div>
		</header>
	)
}
