import { CalendarPlus, Cpu, LandPlot, Rss } from 'lucide-react'
import InfoItem from './info-item'
import { Separator } from '../ui/separator'
import { format } from 'date-fns'

export default function DeviceMetadataInfo({
	exposure,
	sensorWikiModel,
	updatedAt,
	createdAt,
	expiresAt,
}: {
	exposure: string | null
	sensorWikiModel: string | null
	updatedAt: Date
	createdAt: Date
	expiresAt?: Date | null
}) {
	return (
		<div className="space-y-2 sm:w-1/2">
			<InfoItem icon={LandPlot} title="Exposure" text={exposure || 'Unknown'} />
			<InfoItem
				icon={Cpu}
				title="Sensor Model"
				text={sensorWikiModel || 'Custom'}
			/>
			<Separator className="my-2" />
			<InfoItem
				icon={Rss}
				title="Last Updated"
				text={format(new Date(updatedAt), 'PPP')}
			/>
			<Separator className="my-2" />
			<InfoItem
				icon={CalendarPlus}
				title="Created At"
				text={format(new Date(createdAt), 'PPP')}
			/>
			{expiresAt && (
				<>
					<Separator className="my-2" />
					<InfoItem
						icon={CalendarPlus}
						title="Expires At"
						text={format(new Date(expiresAt), 'PPP')}
					/>
				</>
			)}
		</div>
	)
}
