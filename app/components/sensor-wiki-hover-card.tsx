import { useEffect, useState } from 'react'
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from '@/components/ui/hover-card'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { sensorWikiLabel } from '~/utils/sensor-wiki-helper'

interface SensorWikHoverCardProps {
	slug: string
	type: 'phenomena' | 'sensors' | 'devices' | 'domains' | 'units'
	phenomenonSlug?: string
	trigger: React.ReactNode
	side?: 'top' | 'right' | 'bottom' | 'left'
	avoidCollisions?: boolean
	openDelay?: number
	closeDelay?: number
}
const getData = async (slug: string, type: string, phenomenonSlug?: string) => {
	const response = await fetch(`${ENV.SENSORWIKI_API_URL}${type}/${slug}`)
	const data = await response.json()
	let sensorElement
	if (phenomenonSlug) {
		sensorElement = data.elements.find(
			(element: any) => element.phenomena.slug === phenomenonSlug,
		)
	}

	let content
	switch (type) {
		case 'phenomena':
			content = (
				<div>
					{data.description
						? data.description.item[0].text
						: 'No data available.'}
				</div>
			)
			break
		case 'sensors':
			content = (
				<div>
					<Table>
						<TableBody>
							<TableRow>
								<TableCell className="font-bold">Manufacturer</TableCell>
								<TableCell>
									{data.manufacturer ? data.manufacturer : 'n/s'}
								</TableCell>
							</TableRow>
							<TableRow>
								<TableCell className="font-bold">Price</TableCell>
								<TableCell>{data.price ? data.price : 'n/s'}</TableCell>
							</TableRow>
							<TableRow>
								<TableCell className="font-bold">Life period</TableCell>
								<TableCell>
									{data.lifePeriod ? data.lifePeriod : 'n/s'}
								</TableCell>
							</TableRow>
							{phenomenonSlug && (
								<>
									<TableRow>
										<TableCell className="font-bold">Accuracy</TableCell>
										<TableCell>
											{sensorElement.accuracy ? sensorElement.accuracy : 'n/s'}
										</TableCell>
									</TableRow>
									<TableRow>
										<TableCell className="font-bold">Unit</TableCell>
										<TableCell>
											{sensorElement.accuracyUnit
												? `${sensorElement.accuracyUnit.name} (${sensorElement.accuracyUnit.notation})`
												: 'n/s'}
										</TableCell>
									</TableRow>
								</>
							)}
						</TableBody>
					</Table>
				</div>
			)
			break
		case 'devices':
			content = (
				<div>
					{data.description
						? sensorWikiLabel(data.description.item)
						: 'No data available.'}
				</div>
			)
			break
		case 'domains':
			content = (
				<div>
					{data.description
						? sensorWikiLabel(data.description.item)
						: 'No data available.'}
				</div>
			)
			break
		case 'units':
			content = (
				<div>
					{data.description
						? sensorWikiLabel(data.description.item)
						: 'No data available.'}
				</div>
			)
			break
		default:
			content = <div>No information found.</div>
	}

	return content
}

export default function SensorWikHoverCard(props: SensorWikHoverCardProps) {
	const [content, setContent] = useState<any | null>(null)
	const {
		slug,
		type,
		trigger,
		phenomenonSlug,
		side,
		avoidCollisions,
		openDelay,
		closeDelay,
	} = props

	useEffect(() => {
		void getData(slug, type, phenomenonSlug).then((content) => {
			setContent(content)
		})
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	return (
		<HoverCard openDelay={openDelay} closeDelay={closeDelay}>
			<HoverCardTrigger asChild>{trigger}</HoverCardTrigger>
			<HoverCardContent
				className="bg-sensorWiki"
				side={side}
				avoidCollisions={avoidCollisions}
			>
				{content}
			</HoverCardContent>
		</HoverCard>
	)
}
