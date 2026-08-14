import { PHASES, type ApiKeyMode, type Phase } from './types'

export type CliOptions = {
	phases?: Phase[]
	from?: string
	historyMonths?: number
	to?: string
	runId?: string
	batchSize?: number
	dryRun: boolean
	confirmWriteFreeze: boolean
	manageJobs?: boolean
	refreshAggregates?: boolean
	apiKeyMode?: ApiKeyMode
	help: boolean
}

function readValue(argv: string[], index: number, flag: string) {
	const value = argv[index + 1]
	if (!value || value.startsWith('--')) {
		throw new Error(`${flag} requires a value`)
	}
	return value
}

function parsePhases(value: string): Phase[] {
	if (value === 'all') return [...PHASES]

	const phases = value.split(',').map((phase) => phase.trim())
	const unknown = phases.filter(
		(phase): phase is string => !PHASES.includes(phase as Phase),
	)
	if (unknown.length > 0) {
		throw new Error(`Unknown migration phase(s): ${unknown.join(', ')}`)
	}
	return [...new Set(phases as Phase[])]
}

export function parseArgs(argv: string[]): CliOptions {
	const options: CliOptions = {
		dryRun: false,
		confirmWriteFreeze: false,
		help: false,
	}

	for (let index = 0; index < argv.length; index++) {
		const argument = argv[index]
		switch (argument) {
			case '--phase':
			case '--phases':
				options.phases = parsePhases(readValue(argv, index, argument))
				index++
				break
			case '--from':
				options.from = readValue(argv, index, argument)
				index++
				break
			case '--history-months': {
				const value = Number(readValue(argv, index, argument))
				if (!Number.isSafeInteger(value) || value < 1) {
					throw new Error('--history-months must be a positive integer')
				}
				options.historyMonths = value
				index++
				break
			}
			case '--to':
				options.to = readValue(argv, index, argument)
				index++
				break
			case '--run-id':
				options.runId = readValue(argv, index, argument)
				index++
				break
			case '--batch-size': {
				const value = Number(readValue(argv, index, argument))
				if (!Number.isSafeInteger(value) || value < 1) {
					throw new Error('--batch-size must be a positive integer')
				}
				options.batchSize = value
				index++
				break
			}
			case '--dry-run':
				options.dryRun = true
				break
			case '--confirm-write-freeze':
				options.confirmWriteFreeze = true
				break
			case '--manage-jobs':
				options.manageJobs = true
				break
			case '--no-manage-jobs':
				options.manageJobs = false
				break
			case '--refresh-aggregates':
				options.refreshAggregates = true
				break
			case '--no-refresh-aggregates':
				options.refreshAggregates = false
				break
			case '--api-key-mode': {
				const value = readValue(argv, index, argument)
				if (value !== 'preserve' && value !== 'rotate') {
					throw new Error('--api-key-mode must be preserve or rotate')
				}
				options.apiKeyMode = value
				index++
				break
			}
			case '--help':
			case '-h':
				options.help = true
				break
			default:
				throw new Error(`Unknown argument: ${argument}`)
		}
	}

	return options
}

export const HELP_TEXT = `openSenseMap MongoDB → PostgreSQL migration

Usage:
  npm run migrate:data -- --from <ISO> --to <ISO> [options]
  npm run migrate:data -- --history-months <n> --to <ISO> [options]

Options:
  --phase <name[,name]>       Run selected phases; defaults to all
  --history-months <number>   Derive --from; minimum 12 months
  --run-id <id>               Stable identifier used for resume/audit
  --batch-size <number>       Measurement insert batch size
  --dry-run                   Inspect and transform without target writes
  --confirm-write-freeze      Confirm that production writes are stopped
  --[no-]manage-jobs          Pause/restore TimescaleDB and pg_cron jobs
  --[no-]refresh-aggregates   Backfill TimescaleDB continuous aggregates
  --api-key-mode <mode>       preserve (default) or explicit rotate
  --help                      Show this help

Phases: ${PHASES.join(', ')}

Data-writing runs require MIGRATION_SOURCE_KIND=restored-backup and
MIGRATION_BACKUP_ID. production-readonly is limited to a dry-run preflight.
`
