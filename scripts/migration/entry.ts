import 'dotenv/config'
import { AppTarget } from './app-target'
import { HELP_TEXT, parseArgs } from './cli'
import { parseConfig } from './config'
import { IntegrationTarget } from './integration-target'
import { DeviceImageStore } from './object-store'
import { consoleLogger, MigrationReport, redactSensitiveText } from './report'
import { runMigration } from './runner'
import { MongoSource } from './source'

async function main() {
	const cli = parseArgs(process.argv.slice(2))
	if (cli.help) {
		console.log(HELP_TEXT)
		return
	}
	const config = parseConfig(process.env, cli)
	const abortController = new AbortController()
	const abort = (signal: NodeJS.Signals) => {
		if (!abortController.signal.aborted) {
			abortController.abort(new Error(`Migration interrupted by ${signal}`))
		}
	}
	const onSigint = () => abort('SIGINT')
	const onSigterm = () => abort('SIGTERM')
	process.once('SIGINT', onSigint)
	process.once('SIGTERM', onSigterm)
	const report = new MigrationReport(config.runId, config.dryRun)
	const source = new MongoSource(
		config.mongoUrl,
		config.mongoDbName,
		config.sourceKind === 'production-readonly'
			? 'secondaryPreferred'
			: 'primary',
	)
	const app = new AppTarget(config.appDatabaseUrl, config.pgSsl, config.dryRun)
	const mqtt = config.mqttDatabaseUrl
		? new IntegrationTarget(
				config.mqttDatabaseUrl,
				config.pgSsl,
				'mqtt',
				config.dryRun,
			)
		: undefined
	const ttn = config.ttnDatabaseUrl
		? new IntegrationTarget(
				config.ttnDatabaseUrl,
				config.pgSsl,
				'ttn',
				config.dryRun,
			)
		: undefined
	const images =
		config.s3 && config.legacyImageDirectory
			? new DeviceImageStore(
					config.legacyImageDirectory,
					config.s3.bucket,
					config.s3,
					config.dryRun,
				)
			: undefined

	let releaseLock: (() => Promise<void>) | undefined
	let runStarted = false
	try {
		await source.connect()
		await app.connect()
		await Promise.all([mqtt?.connect(), ttn?.connect()])
		releaseLock = await app.acquireLock()
		runStarted = true
		await runMigration(config, {
			source,
			app,
			mqtt,
			ttn,
			images,
			logger: consoleLogger,
			report,
			signal: abortController.signal,
		})
		if (config.phases.includes('validate')) {
			await app.finishRun(config.runId, 'completed')
		} else if (!config.dryRun) {
			report.warn({
				code: 'run_remains_open_until_validation',
				message:
					'The audit run remains running until the validate phase succeeds',
			})
		}
		report.complete()
	} catch (error) {
		report.fail(error)
		consoleLogger.error(
			error instanceof Error ? error.message : 'Migration failed',
		)
		if (runStarted) {
			const jobState = await app
				.backgroundJobState(config.runId)
				.catch(() => ({ jobs: [], state: 'none' as const }))
			if (
				jobState.jobs.length > 0 &&
				(jobState.state === 'recorded' || jobState.state === 'paused')
			) {
				report.warn({
					severity: 'high',
					code: 'background_job_state_requires_operator_attention',
					message:
						'Background jobs were not restored; verify every recorded job is inactive before retrying or rolling back',
					state: jobState.state,
					jobs: jobState.jobs.map((job) => ({
						kind: job.kind,
						id: job.id,
						name: job.name,
					})),
				})
			}
			await app.finishRun(config.runId, 'failed').catch(() => undefined)
		}
		process.exitCode = 1
	} finally {
		const reportPath = await report
			.write(config.reportDirectory)
			.catch(() => null)
		if (reportPath) consoleLogger.info('Wrote migration report', { reportPath })
		await releaseLock?.().catch(() => undefined)
		await Promise.allSettled([
			source.close(),
			app.close(),
			mqtt?.close(),
			ttn?.close(),
		])
		images?.close()
		process.off('SIGINT', onSigint)
		process.off('SIGTERM', onSigterm)
	}
}

main().catch((error) => {
	console.error(
		redactSensitiveText(
			`[migration] ERROR ${error instanceof Error ? error.message : String(error)}`,
		),
	)
	process.exitCode = 1
})
