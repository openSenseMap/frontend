import { Device } from '~/schema'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { ExposureBadge } from './exposure-badge'
import { StatusBadge } from './status-badge'
import { Trash } from 'lucide-react'
import { Link } from 'react-router'

export default function DeviceInfo({
	device,
	otherDeviceId,
}: {
	device: Device
	otherDeviceId: string
}) {
	return (
		<Card className="w-full">
			<CardHeader>
				<div className="flex justify-between">
					<CardTitle>{device.name}</CardTitle>
					<Link to={`/explore/${otherDeviceId}`}>
						<Trash className="h-4 w-4" />
					</Link>
				</div>
			</CardHeader>
			<CardContent className="space-y-2">
				<div className="flex justify-between">
					<span className="font-semibold">Status:</span>
					<StatusBadge status={device.status ?? 'inactive'} />
				</div>
				<div className="flex justify-between">
					<span className="font-semibold">Exposure:</span>
					<ExposureBadge exposure={device.exposure ?? 'unknown'} />
				</div>
				<div className="flex justify-between">
					<span className="font-semibold">Created:</span>
					<span>{new Date(device.createdAt).toLocaleDateString()}</span>
				</div>
				<div className="flex justify-between">
					<span className="font-semibold">Updated:</span>
					<span>{new Date(device.updatedAt).toLocaleDateString()}</span>
				</div>
				{device.sensorWikiModel && (
					<div className="flex justify-between">
						<span className="font-semibold">Model:</span>
						<span>{device.sensorWikiModel}</span>
					</div>
				)}
			</CardContent>
		</Card>
	)
}
