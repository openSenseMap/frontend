import { useTranslation } from 'react-i18next'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui/tooltip'
import { topbarSurface } from '~/components/map/topbar-styles'
import { cn } from '~/lib/utils'

interface HomeProps {
	deviceCount?: number
	measurementCount?: number
	onHomeClick?: () => void
}

export default function Home({
	deviceCount = 0,
	measurementCount = 0,
	onHomeClick,
}: HomeProps) {
	const { t } = useTranslation('menu')

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<button
					type="button"
					onClick={onHomeClick}
					aria-label={t('returnToGlobeView')}
					className={cn(
						topbarSurface({ shape: 'pill' }),
						`pointer-events-auto flex cursor-pointer items-center gap-3 px-3 pr-4 focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 focus-visible:outline-hidden`,
					)}
				>
					<img
						src="/img/openSenseMap.png"
						alt="openSenseMapLogo"
						className="h-7 w-auto shrink-0"
					/>

					{deviceCount > 0 && (
						<section className="flex flex-col text-left text-sm leading-tight">
							<p>
								<span className="font-semibold text-green-700">
									{deviceCount}{' '}
								</span>
								<span>{t('devices')}</span>
							</p>

							<p>
								<span className="font-semibold text-green-700">
									{measurementCount}{' '}
								</span>
								<span>{t('measurements')}</span>
							</p>
						</section>
					)}
				</button>
			</TooltipTrigger>

			<TooltipContent side="bottom">
				<p>{t('returnToGlobeView')}</p>
			</TooltipContent>
		</Tooltip>
	)
}
