import { FileJson, Lock, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { type CustomDeviceSchemaUpload, type Sensor } from './sensors-info'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '~/components/ui/separator'
import { uploadedDeviceSchemaV1 } from '~/lib/device-schemas/device-schema-v1'

export function CustomDeviceConfig() {
	const { setValue, watch } = useFormContext()

	// Initialize state from form context
	const [sensors, setSensors] = useState<Sensor[]>(
		() => watch('selectedSensors') || [],
	)
	const [deviceSchema, setDeviceSchema] = useState<CustomDeviceSchemaUpload>(
		() => watch('deviceSchema'),
	)
	const [schemaError, setSchemaError] = useState<string | null>(null)
	const [newSensor, setNewSensor] = useState<Sensor>({
		title: '',
		unit: '',
		sensorType: '',
	})
	const { t } = useTranslation('newdevice')

	// Sync state with form context on mount
	useEffect(() => {
		const savedSensors = watch('selectedSensors') || []
		if (savedSensors.length > 0) {
			setSensors(savedSensors)
		}

		const savedDeviceSchema = watch('deviceSchema')
		if (savedDeviceSchema) {
			setDeviceSchema(savedDeviceSchema)
		}
	}, [watch])

	const updateNewSensor = (field: keyof Sensor, value: string) => {
		setNewSensor((prev) => ({ ...prev, [field]: value }))
	}

	const addSensor = () => {
		if (
			!deviceSchema &&
			newSensor.title &&
			newSensor.unit &&
			newSensor.sensorType
		) {
			const updatedSensors = [...sensors, newSensor]
			setSensors(updatedSensors)
			setValue('selectedSensors', updatedSensors) // Sync with form
			setNewSensor({ title: '', unit: '', sensorType: '' })
		}
	}

	const removeSensor = (index: number) => {
		if (deviceSchema) return

		const updatedSensors = sensors.filter((_, i) => i !== index)
		setSensors(updatedSensors)
		setValue('selectedSensors', updatedSensors) // Sync with form
	}

	const importDeviceSchema = async (file: File) => {
		setSchemaError(null)

		try {
			const parsedJson = JSON.parse(await file.text())
			const parsedSchema = uploadedDeviceSchemaV1.parse(parsedJson)
			const schemaSensors = parsedSchema.sensors.map((sensor) => ({
				id: sensor.id,
				title: sensor.title,
				unit: sensor.unit,
				sensorType: sensor.sensorType,
				icon: sensor.icon,
				sensorWikiType: sensor.sensorWikiType,
				sensorWikiPhenomenon: sensor.sensorWikiPhenomenon,
				sensorWikiUnit: sensor.sensorWikiUnit,
			}))

			setDeviceSchema(parsedSchema)
			setSensors(schemaSensors)
			setValue('deviceSchema', parsedSchema)
			setValue('selectedSensors', schemaSensors)
		} catch (error) {
			setSchemaError(
				error instanceof Error
					? error.message
					: t('device_schema_invalid_file'),
			)
		}
	}

	const clearDeviceSchema = () => {
		setDeviceSchema(undefined)
		setSchemaError(null)
		setSensors([])
		setValue('deviceSchema', undefined)
		setValue('selectedSensors', [])
	}

	return (
		<div className="space-y-4 p-2">
			<div className="rounded-lg border border-dashed p-4">
				<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
					<div className="space-y-1">
						<div className="flex items-center gap-2 font-medium">
							<FileJson className="h-4 w-4" />
							{t('device_schema_upload')}
						</div>
						<p className="text-muted-foreground text-sm">
							{t('device_schema_upload_text')}
						</p>
					</div>
					<div className="flex items-center gap-2">
						<Input
							type="file"
							accept="application/json,.json"
							className="max-w-64"
							onChange={(event) => {
								const file = event.target.files?.[0]
								if (file) void importDeviceSchema(file)
								event.target.value = ''
							}}
						/>
						{deviceSchema && (
							<Button
								type="button"
								variant="outline"
								onClick={clearDeviceSchema}
							>
								{t('clear_all')}
							</Button>
						)}
					</div>
				</div>

				{deviceSchema && (
					<Alert className="mt-4">
						<Lock className="h-4 w-4" />
						<AlertTitle className="flex items-center gap-2">
							{deviceSchema.name}
							<Badge variant="secondary">v{deviceSchema.version}</Badge>
						</AlertTitle>
						<AlertDescription>
							{t('device_schema_locked_sensors', {
								count: deviceSchema.sensors.length,
							})}
						</AlertDescription>
					</Alert>
				)}

				{schemaError && (
					<p className="text-destructive mt-3 text-sm">{schemaError}</p>
				)}
			</div>

			<div>
				<div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
					<div>
						<Label htmlFor="phenomenon">{t('phenomenon')}</Label>
						<Input
							id="phenomenon"
							value={newSensor.title}
							onChange={(e) => updateNewSensor('title', e.target.value)}
							placeholder="e.g., Temperature"
							disabled={!!deviceSchema}
						/>
					</div>
					<div>
						<Label htmlFor="unit">{t('unit')}</Label>
						<Input
							id="unit"
							value={newSensor.unit}
							onChange={(e) => updateNewSensor('unit', e.target.value)}
							placeholder="e.g., °C"
							disabled={!!deviceSchema}
						/>
					</div>
					<div>
						<Label htmlFor="type">{t('type')}</Label>
						<Input
							id="type"
							value={newSensor.sensorType}
							onChange={(e) => updateNewSensor('sensorType', e.target.value)}
							placeholder="e.g., HDC1080"
							disabled={!!deviceSchema}
						/>
					</div>
				</div>
				<Button
					type="button"
					onClick={addSensor}
					disabled={
						!!deviceSchema ||
						!newSensor.title ||
						!newSensor.unit ||
						!newSensor.sensorType
					}
				>
					{t('add_sensor')}
				</Button>
			</div>

			{sensors.length > 0 && <Separator />}
			{sensors.map((sensor, index) => (
				<Card key={index} className="mb-2">
					<CardContent className="flex items-center justify-between p-4">
						<div>
							<span className="font-medium">{sensor.title}</span> ({sensor.unit}
							) - {sensor.sensorType}
						</div>
						<Button
							variant="ghost"
							size="icon"
							disabled={!!deviceSchema}
							onClick={(e) => {
								e.preventDefault()
								removeSensor(index)
							}}
						>
							<X className="h-4 w-4" />
						</Button>
					</CardContent>
				</Card>
			))}
		</div>
	)
}
