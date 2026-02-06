import { MapPin, Tag, Smartphone, Cpu, Cog } from 'lucide-react'
import { useFormContext } from 'react-hook-form'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

export function SummaryInfo() {
	const { getValues } = useFormContext()
	const formData = getValues()

	const sections = [
		{
			title: 'General Info',
			icon: <Tag className="h-5 w-5" />,
			data: [
				{ label: 'Name', value: formData.name },
				{ label: 'Exposure', value: formData.exposure },
				{
					label: 'Tags',
					value:
						formData.tags?.map((tag: any) => tag.value).join(', ') || 'None',
				},
			],
		},
		{
			title: 'Location',
			icon: <MapPin className="h-5 w-5" />,
			data: [
				{ label: 'Latitude', value: parseFloat(formData.latitude).toFixed(4) },
				{
					label: 'Longitude',
					value: parseFloat(formData.longitude).toFixed(4),
				},
			],
		},
		{
			title: 'Device',
			icon: <Smartphone className="h-5 w-5" />,
			data: [{ label: 'Model', value: formData.model }],
		},
		{
			title: 'Sensors',
			icon: <Cpu className="h-5 w-5" />,
			data:
				formData.selectedSensors?.map((sensor: any) => ({
					value: sensor.sensorType,
					label: sensor.title,
				})) || [],
		},
		{
			title: 'Advanced',
			icon: <Cog className="h-5 w-5" />,
			data: [
				{ label: 'MQTT Enabled', value: formData.mqttEnabled ? 'Yes' : 'No' },
				{ label: 'TTN Enabled', value: formData.ttnEnabled ? 'Yes' : 'No' },
			],
		},
	]

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				{sections.map((section, index) => (
					<Card key={index} className="overflow-hidden">
						<CardContent className="p-0">
							<div className="to-purple-500 flex items-center space-x-2 bg-gradient-to-r from-blue-500 p-4">
								{section.icon}
								<h4 className="text-lg font-semibold text-white">
									{section.title}
								</h4>
							</div>
							<div className="space-y-2 p-4">
								{section.data.map((item: any, idx: any) => (
									<div key={idx} className="flex items-center justify-between">
										<span className="text-sm text-gray-500">{item.label}:</span>
										<Badge variant="secondary" className="font-mono">
											{item.value}
										</Badge>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	)
}
