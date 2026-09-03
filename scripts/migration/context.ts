import { type AppTarget } from './app-target'
import { type IntegrationTarget } from './integration-target'
import { type DeviceImageStore } from './object-store'
import { type MigrationReport } from './report'
import { type MongoSource } from './source'
import { type SafeLogger } from './types'

/** Runtime services shared by preflight, migration phases, resume, and validation. */
export type MigrationDependencies = {
	source: MongoSource
	app: AppTarget
	mqtt?: IntegrationTarget
	ttn?: IntegrationTarget
	images?: DeviceImageStore
	logger: SafeLogger
	report: MigrationReport
	signal?: AbortSignal
}
