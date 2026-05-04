import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'

const HOME_HASH = '#2.08/42.99/31.31'

interface HomeProps {
	deviceCount?: number
	measurementCount?: number
}

export default function Home({ deviceCount = 0, measurementCount = 0 }: HomeProps) {
	const { t } = useTranslation('menu')

	return (
		<Link
			to={{
				pathname: '/explore',
				hash: HOME_HASH,
			}}
			aria-label="Go to explore map"
			className="
				pointer-events-auto
				flex h-11 items-center gap-3
				rounded-full border border-gray-100
				bg-white/90 px-3 pr-4
				text-black shadow-xl backdrop-blur-md
				transition hover:bg-gray-100
			"
		>
			<img
				src="/img/openSenseMap.png"
				alt="openSenseMapLogo"
				className="h-7 w-auto shrink-0"
			/>

			{deviceCount > 0 && (
				<section className="flex flex-col leading-tight text-sm">
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
		</Link>
	)
}