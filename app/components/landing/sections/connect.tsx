import { BookA, Wrench } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function Connect() {
	const { t } = useTranslation('connect')
	return (
		<section
			id="connect"
			className="flex h-full items-center justify-center gap-20 py-20"
		>
			<div id="left" className="flex w-1/2 flex-col gap-10">
				<div id="title" className="text-2xl font-semibold">
					{t('title')}
					<div id="description" className="text-lg font-medium">
						{t('description')}
					</div>
				</div>
				<img src="/connection.svg" alt="" className="h-1/2 w-1/2" />
			</div>
			<div id="right" className="w-1/2">
				<div className="grid grid-cols-2 gap-4">
					<div className="flex flex-col rounded-sm border-2 px-4 py-2 text-lg">
						<a
							href="https://sensebox.de"
							rel="noopener noreferrer"
							target="_blank"
							className="flex items-center gap-3"
						>
							<BookA className="mr-2 h-4 w-4" />
							{t('senseBox')}
						</a>
					</div>
					<div className="flex flex-col rounded-sm border-2 px-4 py-2 text-lg">
						<a
							href="https://www.hackair.eu/"
							rel="noopener noreferrer"
							target="_blank"
							className="flex items-center gap-3"
						>
							<BookA className="mr-2 h-4 w-4" />
							{t('hackAIR')}
						</a>
					</div>
					<div className="flex flex-col rounded-sm border-2 px-4 py-2 text-lg">
						<a
							href="https://sensor.community"
							rel="noopener noreferrer"
							target="_blank"
							className="flex items-center gap-3"
						>
							<BookA className="mr-2 h-4 w-4" />
							{t('Sensor.Community')}
						</a>
					</div>
					<div className="flex rounded-sm border-2 px-4 py-2 text-lg">
						<a
							href="https://tutorials.opensensemap.org/category/devices/"
							rel="noopener noreferrer"
							target="_blank"
							className="flex items-center gap-3"
						>
							<Wrench className="mr-2 h-4 w-4" />
							{t('Custom')}
						</a>
					</div>
				</div>
			</div>
		</section>
	)
}
