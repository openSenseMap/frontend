import { ArrowUpDown, RadioTower, Unplug } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function Integrations() {
	const { t } = useTranslation('integrations')
	return (
		<section id="integrations" className="flex justify-between gap-10">
			<div id="left" className="flex w-1/2 flex-col gap-10">
				<div id="title" className="text-2xl font-semibold">
					{t('title')}
					<div id="description" className="text-lg font-medium">
						{t('description')}
					</div>
				</div>
				<img src="/integration.svg" alt="" className="h-1/2 w-1/2" />
			</div>
			<div id="right" className="w-1/2">
				<div className="grid grid-cols-2 gap-4">
					<div className="flex flex-col rounded-sm border-2 px-4 py-2 text-lg">
						<a
							href="https://docs.opensensemap.org/"
							rel="noopener noreferrer"
							target="_blank"
							className="flex items-center gap-3"
						>
							<ArrowUpDown className="mr-2 h-4 w-4" />
							{t('HTTP API')}
						</a>
					</div>
					<div className="flex flex-col rounded-sm border-2 px-4 py-2 text-lg">
						<a
							href="https://tutorials.opensensemap.org/integrations/integrations-mqtt/"
							rel="noopener noreferrer"
							target="_blank"
							className="flex items-center gap-3"
						>
							<Unplug className="mr-2 h-4 w-4" />
							{t('MQTT')}
						</a>
					</div>
					<div className="flex flex-col rounded-sm border-2 px-4 py-2 text-lg">
						<a
							href="https://tutorials.opensensemap.org/integrations/integrations-ttnv3/"
							rel="noopener noreferrer"
							target="_blank"
							className="flex items-center gap-3"
						>
							<RadioTower className="mr-2 h-4 w-4" />
							{t('TTN')}
						</a>
					</div>
				</div>
			</div>
		</section>
	)
}
