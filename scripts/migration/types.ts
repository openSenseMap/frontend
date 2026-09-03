import { type ObjectId } from 'mongodb'

export const PHASES = [
	'preflight',
	'accounts',
	'devices',
	'measurements',
	'integrations',
	'media',
	'finalize',
	'validate',
] as const

export type Phase = (typeof PHASES)[number]

export type MigrationSourceKind = 'restored-backup' | 'production-readonly'

export type LegacyId = ObjectId | string

export type LegacyLocation = {
	type?: unknown
	coordinates?: unknown
	timestamp?: unknown
}

export type LegacySensor = {
	_id?: LegacyId
	title?: unknown
	unit?: unknown
	sensorType?: unknown
	icon?: unknown
}

export type LegacyMqttConfig = {
	enabled?: unknown
	url?: unknown
	topic?: unknown
	messageFormat?: unknown
	decodeOptions?: unknown
	connectionOptions?: unknown
}

export type LegacyTtnConfig = {
	dev_id?: unknown
	app_id?: unknown
	port?: unknown
	profile?: unknown
	decodeOptions?: unknown
}

export type LegacyBox = {
	_id: LegacyId
	name?: unknown
	locations?: unknown
	currentLocation?: unknown
	exposure?: unknown
	grouptag?: unknown
	model?: unknown
	weblink?: unknown
	description?: unknown
	image?: unknown
	sensors?: unknown
	lastMeasurementAt?: unknown
	access_token?: unknown
	useAuth?: unknown
	integrations?: {
		mqtt?: LegacyMqttConfig
		ttn?: LegacyTtnConfig
	}
	mqtt?: LegacyMqttConfig
	createdAt?: unknown
	updatedAt?: unknown
}

export type LegacyUser = {
	_id: LegacyId
	name?: unknown
	email?: unknown
	unconfirmedEmail?: unknown
	boxes?: unknown
	sharedBoxes?: unknown
	language?: unknown
	hashedPassword?: unknown
	role?: unknown
	emailIsConfirmed?: unknown
	createdAt?: unknown
	updatedAt?: unknown
}

export type LegacyMeasurement = {
	_id: LegacyId
	sensor_id?: LegacyId | null
	value?: unknown
	createdAt?: unknown
	location?: unknown
}

export type Coordinates = {
	longitude: number
	latitude: number
}

export type NormalizedLocation = Coordinates & {
	time: Date
}

export type SourceSnapshot = {
	users: LegacyUser[]
	boxes: LegacyBox[]
	boxById: Map<string, LegacyBox>
	ownerByDeviceId: Map<string, string | null>
	retainedUserIds: Set<string>
	sensorToDeviceId: Map<string, string | null>
	sensorTargetIdByOccurrence: Map<string, string>
	migratableDeviceIds: Set<string>
	anomalies: Array<{
		code: string
		collection: string
		sourceId?: string
		details: Record<string, unknown>
	}>
}

export type MigratedUser = {
	id: string
	name: string
	email: string
	language: string
	role: 'admin' | 'user'
	emailIsConfirmed: boolean
	createdAt: Date
	updatedAt: Date
	passwordHash: string
	profileId: string
	displayName: string
}

export type MigratedSensor = {
	id: string
	deviceId: string
	title: string
	unit: string | null
	sensorType: string | null
	icon: string | null
	order: number
}

export type MigratedDevice = {
	id: string
	userId: string
	name: string
	description: string | null
	link: string | null
	tags: string[]
	exposure: 'indoor' | 'outdoor' | 'mobile' | 'unknown'
	model: string
	useAuth: boolean
	public: boolean
	createdAt: Date
	updatedAt: Date
	latitude: number
	longitude: number
	locations: NormalizedLocation[]
	sensors: MigratedSensor[]
}

export type MigratedMeasurement = {
	sourceId: string
	sensorId: string
	time: Date
	value: number
	location: Coordinates | null
}

export type MigratedMqttIntegration = {
	id: string
	deviceId: string
	enabled: boolean
	url: string
	topic: string
	messageFormat: 'json' | 'csv'
	decodeOptions: Record<string, unknown> | null
	connectionOptions: Record<string, unknown> | null
}

export type MigratedTtnIntegration = {
	id: string
	deviceId: string
	enabled: boolean
	devId: string
	appId: string
	port: number | null
	profile:
		| 'json'
		| 'debug'
		| 'sensebox/home'
		| 'lora-serialization'
		| 'cayenne-lpp'
	decodeOptions: Array<Record<string, unknown>> | null
}

export type Rejection = {
	phase: Phase
	sourceCollection: string
	sourceId?: string
	code: string
	details?: Record<string, unknown>
}

export type PhaseCounters = {
	sourceSeen: number
	written: number
	skipped: number
	rejected: number
}

export type PhaseProgress = PhaseCounters & {
	phase: Phase
	status: 'running' | 'completed'
	cursor: Record<string, unknown> | null
}

export type PausedJob = {
	kind: 'timescale' | 'pg_cron'
	id: number
	name: string
	wasActive: boolean
}

export type MigrationConfig = {
	runId: string
	phases: Phase[]
	dryRun: boolean
	resume: boolean
	sourceKind: MigrationSourceKind
	backupId?: string
	from: Date
	to: Date
	archiveBefore: Date
	batchSize: number
	writeFreezeConfirmed: boolean
	manageJobs: boolean
	refreshAggregates: boolean
	skipImages: boolean
	mongoUrl: string
	mongoDbName: string
	appDatabaseUrl: string
	mqttDatabaseUrl?: string
	ttnDatabaseUrl?: string
	pgSsl: boolean
	legacyImageDirectory?: string
	s3?: {
		endpoint: string
		region: string
		bucket: string
		accessKey: string
		secretKey: string
		forcePathStyle: boolean
	}
	reportDirectory: string
}

export type SafeLogger = {
	info(message: string, details?: Record<string, unknown>): void
	warn(message: string, details?: Record<string, unknown>): void
	error(message: string, details?: Record<string, unknown>): void
}

export type PhaseResult = PhaseCounters & {
	phase: Phase
	details?: Record<string, unknown>
}
