import { CalendarDays, MapPinned } from 'lucide-react'
import { Link } from 'react-router'
import { Badge } from '~/components/ui/badge'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import { formatPhenomenonLabel } from '~/lib/campaign'

type CampaignCardProps = {
	campaign: {
		slug: string
		title: string
		description: string
		phenomena: string[]
		startDate: string | Date | null
		endDate: string | Date | null
		owner?: {
			name: string
		} | null
	}
}

export function CampaignCard({ campaign }: CampaignCardProps) {
	return (
		<Link to={`/campaigns/${campaign.slug}`} className="block h-full">
			<Card className="h-full transition hover:border-green-700 hover:shadow-sm">
				<CardHeader>
					<CardTitle className="line-clamp-2">{campaign.title}</CardTitle>
					<CardDescription>
						{campaign.owner?.name ? `by ${campaign.owner.name}` : 'Campaign'}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<p className="line-clamp-3 text-sm text-slate-700">
						{campaign.description}
					</p>
					<div className="flex flex-wrap gap-2">
						{campaign.phenomena.map((phenomenon) => (
							<Badge key={phenomenon} variant="secondary">
								{formatPhenomenonLabel(phenomenon)}
							</Badge>
						))}
					</div>
					<div className="flex flex-wrap gap-4 text-xs text-slate-500">
						<span className="inline-flex items-center gap-1">
							<MapPinned className="h-3.5 w-3.5" />
							Public area
						</span>
						<span className="inline-flex items-center gap-1">
							<CalendarDays className="h-3.5 w-3.5" />
							{formatDateRange(campaign.startDate, campaign.endDate)}
						</span>
					</div>
				</CardContent>
			</Card>
		</Link>
	)
}

function formatDateRange(
	startDate: string | Date | null,
	endDate: string | Date | null,
) {
	if (!startDate && !endDate) return 'No date limit'
	if (startDate && !endDate) return `From ${formatDate(startDate)}`
	if (!startDate && endDate) return `Until ${formatDate(endDate)}`

	return `${formatDate(startDate)} - ${formatDate(endDate)}`
}

function formatDate(date: string | Date | null) {
	if (!date) return ''
	return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(
		new Date(date),
	)
}
