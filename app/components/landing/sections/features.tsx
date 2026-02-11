import {
	Copyleft,
	Download,
	GitFork,
	Scale,
	Telescope,
	Terminal,
	Trash,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function Features() {
	const { t } = useTranslation('features')
	return (
		<section id="features" className="flex justify-between gap-10">
			<div id="left" className="flex w-1/2 flex-col gap-10">
				<div id="title" className="text-2xl font-semibold">
					{t('features')}
					<div id="description" className="text-lg font-medium">
						{t('description')}
					</div>
				</div>
				<img src="/features.svg" alt="" className="h-1/2 w-1/2" />
			</div>
			<div id="right" className="w-1/2">
				<div className="grid grid-cols-2 gap-4">
					<div className="flex flex-col rounded-sm border-2 px-4 py-2 text-lg">
						<div className="flex items-center gap-3">
							<GitFork className="mr-2 h-4 w-4" />
							{t('dataAggregation')}
						</div>
					</div>
					<div className="flex flex-col rounded-sm border-2 px-4 py-2 text-lg">
						<div className="flex items-center gap-3">
							<Trash className="mr-2 h-4 w-4" />
							{t('noDataRetention')}
						</div>
					</div>
					<div className="flex flex-col rounded-sm border-2 px-4 py-2 text-lg">
						<div className="flex items-center gap-3">
							<Copyleft className="mr-2 h-4 w-4" />
							{t('dataPublished')}
						</div>
					</div>
					<div className="flex rounded-sm border-2 px-4 py-2 text-lg">
						<div className="flex items-center gap-3">
							<Telescope className="mr-2 h-4 w-4" />
							{t('discoverDevices')}
						</div>
					</div>
					<div className="flex rounded-sm border-2 px-4 py-2 text-lg">
						<div className="flex items-center gap-3">
							<Scale className="mr-2 h-4 w-4" />
							{t('compareDevices')}
						</div>
					</div>
					<div className="flex rounded-sm border-2 px-4 py-2 text-lg">
						<div className="flex items-center gap-3">
							<Download className="mr-2 h-4 w-4" />
							{t('downloadOptions')}
						</div>
					</div>
					<div className="flex rounded-sm border-2 px-4 py-2 text-lg">
						<div className="flex items-center gap-3">
							<Terminal className="mr-2 h-4 w-4" />
							{t('httpRestApi')}
						</div>
					</div>
				</div>
			</div>
		</section>
	)
}
