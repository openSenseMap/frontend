import { FileJson, Library, Lock, Search, X } from 'lucide-react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { uploadedDeviceSchemaV1 } from '~/lib/device-schemas/device-schema-v1'

type RegistryDeviceSchema = {
	id: string
	slug: string
	name: string
	description: string | null
	tags: string[]
	visibility: 'private' | 'public'
	versionId: string
	version: string
	formatVersion: string
	hash: string
	publishedAt: string | null
	isOwner: boolean
	content: NonNullable<CustomDeviceSchemaUpload>
}

type RegistryResponse = {
	schemas: RegistryDeviceSchema[]
}

export function CustomDeviceConfig() {
	const { setValue, watch } = useFormContext()

	// Initialize state from form context
	const [sensors, setSensors] = useState<Sensor[]>(
		() => watch('selectedSensors') || [],
	)
	const [deviceSchema, setDeviceSchema] = useState<CustomDeviceSchemaUpload>(
		() => watch('deviceSchema'),
	)
	const [deviceSchemaVersionId, setDeviceSchemaVersionId] = useState<
		string | undefined
	>(() => watch('deviceSchemaVersionId'))
	const [selectedRegistrySchema, setSelectedRegistrySchema] = useState<
		RegistryDeviceSchema | undefined
	>(() => watch('deviceSchemaRegistrySelection'))
	const [schemaError, setSchemaError] = useState<string | null>(null)
	const [registryQuery, setRegistryQuery] = useState('')
	const [registrySchemas, setRegistrySchemas] = useState<
		RegistryDeviceSchema[]
	>([])
	const [isRegistryLoading, setIsRegistryLoading] = useState(false)
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

		const savedDeviceSchemaVersionId = watch('deviceSchemaVersionId')
		if (savedDeviceSchemaVersionId) {
			setDeviceSchemaVersionId(savedDeviceSchemaVersionId)
		}

		const savedRegistrySchema = watch('deviceSchemaRegistrySelection')
		if (savedRegistrySchema) {
			setSelectedRegistrySchema(savedRegistrySchema)
		}
	}, [watch])

	useEffect(() => {
		const abortController = new AbortController()
		const timeout = setTimeout(async () => {
			setIsRegistryLoading(true)

			try {
				const params = new URLSearchParams()
				if (registryQuery.trim()) params.set('q', registryQuery.trim())

				const response = await fetch(
					`/resources/device-schemas?${params.toString()}`,
					{ signal: abortController.signal },
				)

				if (!response.ok) throw new Error(t('device_schema_registry_error'))

				const data = (await response.json()) as RegistryResponse
				setRegistrySchemas(data.schemas)
			} catch (error) {
				if (abortController.signal.aborted) return
				setSchemaError(
					error instanceof Error
						? error.message
						: t('device_schema_registry_error'),
				)
			} finally {
				if (!abortController.signal.aborted) setIsRegistryLoading(false)
			}
		}, 250)

		return () => {
			abortController.abort()
			clearTimeout(timeout)
		}
	}, [registryQuery, t])

	const updateNewSensor = (field: keyof Sensor, value: string) => {
		setNewSensor((prev) => ({ ...prev, [field]: value }))
	}

	const addSensor = () => {
		if (
			!deviceSchema &&
			!deviceSchemaVersionId &&
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
		if (deviceSchema || deviceSchemaVersionId) return

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
			setDeviceSchemaVersionId(undefined)
			setSelectedRegistrySchema(undefined)
			setSensors(schemaSensors)
			setValue('deviceSchema', parsedSchema)
			setValue('deviceSchemaVersionId', undefined)
			setValue('deviceSchemaRegistrySelection', undefined)
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
		setDeviceSchemaVersionId(undefined)
		setSelectedRegistrySchema(undefined)
		setSchemaError(null)
		setSensors([])
		setValue('deviceSchema', undefined)
		setValue('deviceSchemaVersionId', undefined)
		setValue('deviceSchemaRegistrySelection', undefined)
		setValue('selectedSensors', [])
	}

	const useRegistrySchema = (schema: RegistryDeviceSchema) => {
		const schemaSensors = schema.content.sensors.map((sensor) => ({
			id: sensor.id,
			title: sensor.title,
			unit: sensor.unit,
			sensorType: sensor.sensorType,
			icon: sensor.icon,
			sensorWikiType: sensor.sensorWikiType,
			sensorWikiPhenomenon: sensor.sensorWikiPhenomenon,
			sensorWikiUnit: sensor.sensorWikiUnit,
		}))

		setSchemaError(null)
		setDeviceSchema(undefined)
		setDeviceSchemaVersionId(schema.versionId)
		setSelectedRegistrySchema(schema)
		setSensors(schemaSensors)
		setValue('deviceSchema', undefined)
		setValue('deviceSchemaVersionId', schema.versionId)
		setValue('deviceSchemaRegistrySelection', schema)
		setValue('selectedSensors', schemaSensors)
	}

	const hasLockedSchema = !!deviceSchema || !!deviceSchemaVersionId
	const selectedSchemaName = deviceSchema?.name ?? selectedRegistrySchema?.name
	const selectedSchemaVersion =
		deviceSchema?.version ?? selectedRegistrySchema?.version
	const selectedSchemaSensorCount =
		deviceSchema?.sensors.length ??
		selectedRegistrySchema?.content.sensors.length

	return (
		<div className="space-y-4 p-2">
			<Tabs defaultValue="schema" className="space-y-4">
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="schema">{t('device_schema_tab')}</TabsTrigger>
					<TabsTrigger value="manual">{t('manual_sensors_tab')}</TabsTrigger>
					<TabsTrigger value="selected">
						{t('selected_sensors_tab', { count: sensors.length })}
					</TabsTrigger>
				</TabsList>

				<TabsContent value="schema" className="space-y-4">
					<div className="rounded-lg border border-dashed p-4">
						<div className="space-y-3">
							<div className="space-y-1">
								<div className="flex items-center gap-2 font-medium">
									<Library className="h-4 w-4" />
									{t('device_schema_registry')}
								</div>
								<p className="text-muted-foreground text-sm">
									{t('device_schema_registry_text')}
								</p>
							</div>
							<div className="relative">
								<Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
								<Input
									value={registryQuery}
									onChange={(event) => setRegistryQuery(event.target.value)}
									placeholder={t('device_schema_registry_search')}
									className="pl-9"
								/>
							</div>
							<div className="max-h-64 space-y-2 overflow-auto">
								{isRegistryLoading && (
									<p className="text-muted-foreground text-sm">
										{t('loading')}
									</p>
								)}
								{!isRegistryLoading && registrySchemas.length === 0 && (
									<p className="text-muted-foreground text-sm">
										{t('device_schema_registry_empty')}
									</p>
								)}
								{registrySchemas.map((schema) => (
									<Card key={schema.versionId}>
										<CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
											<div className="space-y-1">
												<div className="flex flex-wrap items-center gap-2">
													<span className="font-medium">{schema.name}</span>
													<Badge variant="secondary">v{schema.version}</Badge>
													<Badge variant="outline">
														{schema.content.sensors.length} {t('sensors')}
													</Badge>
												</div>
												{schema.description && (
													<p className="text-muted-foreground text-sm">
														{schema.description}
													</p>
												)}
											</div>
											<Button
												type="button"
												variant={
													deviceSchemaVersionId === schema.versionId
														? 'secondary'
														: 'outline'
												}
												onClick={() => useRegistrySchema(schema)}
											>
												{deviceSchemaVersionId === schema.versionId
													? t('selected')
													: t('device_schema_use')}
											</Button>
										</CardContent>
									</Card>
								))}
							</div>
						</div>
					</div>

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
								{hasLockedSchema && (
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

						{hasLockedSchema && (
							<Alert className="mt-4">
								<Lock className="h-4 w-4" />
								<AlertTitle className="flex items-center gap-2">
									{selectedSchemaName ?? t('device_schema_registry_selection')}
									{selectedSchemaVersion && (
										<Badge variant="secondary">v{selectedSchemaVersion}</Badge>
									)}
								</AlertTitle>
								<AlertDescription>
									{t('device_schema_locked_sensors', {
										count: selectedSchemaSensorCount ?? sensors.length,
									})}
								</AlertDescription>
							</Alert>
						)}

						{schemaError && (
							<p className="text-destructive mt-3 text-sm">{schemaError}</p>
						)}
					</div>
				</TabsContent>

				<TabsContent value="manual" className="space-y-4">
					{hasLockedSchema && (
						<Alert>
							<Lock className="h-4 w-4" />
							<AlertTitle>{t('manual_sensors_locked')}</AlertTitle>
							<AlertDescription>
								{t('manual_sensors_locked_text')}
							</AlertDescription>
						</Alert>
					)}

					<div>
						<div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
							<div>
								<Label htmlFor="phenomenon">{t('phenomenon')}</Label>
								<Input
									id="phenomenon"
									value={newSensor.title}
									onChange={(e) => updateNewSensor('title', e.target.value)}
									placeholder="e.g., Temperature"
									disabled={hasLockedSchema}
								/>
							</div>
							<div>
								<Label htmlFor="unit">{t('unit')}</Label>
								<Input
									id="unit"
									value={newSensor.unit}
									onChange={(e) => updateNewSensor('unit', e.target.value)}
									placeholder="e.g., °C"
									disabled={hasLockedSchema}
								/>
							</div>
							<div>
								<Label htmlFor="type">{t('type')}</Label>
								<Input
									id="type"
									value={newSensor.sensorType}
									onChange={(e) =>
										updateNewSensor('sensorType', e.target.value)
									}
									placeholder="e.g., HDC1080"
									disabled={hasLockedSchema}
								/>
							</div>
						</div>
						<Button
							type="button"
							onClick={addSensor}
							disabled={
								hasLockedSchema ||
								!newSensor.title ||
								!newSensor.unit ||
								!newSensor.sensorType
							}
						>
							{t('add_sensor')}
						</Button>
					</div>
				</TabsContent>

				<TabsContent value="selected" className="space-y-2">
					{sensors.length === 0 ? (
						<p className="text-muted-foreground text-sm">
							{t('no_selected_sensors')}
						</p>
					) : (
						<>
							<Separator />
							{sensors.map((sensor, index) => (
								<Card key={index}>
									<CardContent className="flex items-center justify-between p-4">
										<div>
											<span className="font-medium">{sensor.title}</span> (
											{sensor.unit}) - {sensor.sensorType}
										</div>
										<Button
											variant="ghost"
											size="icon"
											disabled={hasLockedSchema}
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
						</>
					)}
				</TabsContent>
			</Tabs>
		</div>
	)
}
