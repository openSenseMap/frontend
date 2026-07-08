import Home from '../header/home'
import Menu from '../header/menu'
import NavBar from '../header/nav-bar'
import Info from '../header/info'
import LanguageSelector from '../landing/header/language-selector'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '../ui/tooltip'
import ThemeToggle from '../landing/header/theme-toggle'
import { MapPinned } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '../ui/button'

interface MapHeaderProps {
	devices: any
	measurementCount: number | undefined
	onHomeClick?: () => void
	onMyAreaClick?: () => void
	canFocusMyArea?: boolean
}

export default function MapHeader({
	devices,
	measurementCount,
	onHomeClick,
	onMyAreaClick,
	canFocusMyArea = false,
}: MapHeaderProps) {
	const { t } = useTranslation('menu')

	return (
		<TooltipProvider>
			<header className="pointer-events-none absolute top-0 left-0 z-20 w-full">
				<div className="pointer-events-auto flex min-h-14 w-full items-start justify-between gap-4 px-3 py-2">
					<div className="flex items-center gap-3">
						<Home
							deviceCount={devices.features.length}
							measurementCount={measurementCount ?? 0}
							onHomeClick={onHomeClick}
						/>

						{canFocusMyArea && (
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										type="button"
										variant="topbar"
										size="topbarPill"
										onClick={onMyAreaClick}
										aria-label={t('zoomToMyArea')}
									>
										<MapPinned aria-hidden="true" />
									</Button>
								</TooltipTrigger>

								<TooltipContent side="bottom">
									<p>{t('zoomToMyArea')}</p>
								</TooltipContent>
							</Tooltip>
						)}
					</div>

					<div className="flex min-w-0 flex-1 justify-center">
						<NavBar devices={devices} />
					</div>

					<div className="flex shrink-0 items-center gap-4">
						<LanguageSelector />
						<ThemeToggle />

						<div className="h-7 w-px bg-black/10 dark:bg-white/15" />

						<div className="flex items-center gap-2">
							<Info />
							<Menu devices={devices} />
						</div>
					</div>
				</div>
			</header>
		</TooltipProvider>
	)
}
