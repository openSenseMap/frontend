import { MapPin, Tag, Smartphone, Cpu, Cog } from 'lucide-react'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'


export function SummaryInfo() {
	const { getValues } = useFormContext()
	const formData = getValues()
	const { t } = useTranslation('newdevice')

	const sections = [
		{
			title: 'General Info',
			icon: <Tag className="h-5 w-5" />,
			data: [
				{ label: 'Name', value: formData.name },
				{ label: 'exposure', value: formData.exposure },
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
				{ label: 'latitude', value: parseFloat(formData.latitude).toFixed(4) },
				{
					label: 'longitude',
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
					<Card key={index} className="overflow-hidden border border-border bg-card shadow-sm">
						<CardContent className="p-0">
							<div className="flex items-center gap-3 border-b bg-muted/40 px-4 py-3">
								<div className="flex h-9 w-9 items-center justify-center rounded-md bg-background text-muted-foreground shadow-sm">
									{section.icon}
								</div>
								<h4 className="text-sm font-semibold tracking-tight text-foreground">
									{t(section.title)}
								</h4>
							</div>

							<div className="space-y-2 p-4">
								{section.data.map((item: any, idx: any) => (
									<div key={idx} className="flex items-start justify-between gap-4">
										<span className="text-sm text-muted-foreground">
											{t(item.label)}:
										</span>
										<span className="max-w-[60%] text-right text-sm font-medium text-foreground">
											{item.value}
										</span>
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
