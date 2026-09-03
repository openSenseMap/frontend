import { mkdir, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { type PhaseResult, type SafeLogger } from './types'

export function redactSensitiveText(value: string) {
	return value
		.replace(
			/\b((?:mongodb(?:\+srv)?|postgres(?:ql)?):\/\/)([^@\s]+)@/gi,
			'$1[redacted]@',
		)
		.replace(
			/("(?:password|secret|accessKey|apiKey|access_token|accessToken|authorization|token)"\s*:\s*)"[^"]*"/gi,
			'$1"[redacted]"',
		)
}

function serializeError(error: unknown) {
	if (error instanceof Error) {
		return { name: error.name, message: redactSensitiveText(error.message) }
	}
	return { name: 'Error', message: redactSensitiveText(String(error)) }
}

export class MigrationReport {
	readonly startedAt = new Date()
	readonly phases: PhaseResult[] = []
	readonly preflight: Record<string, unknown> = {}
	readonly warnings: Array<Record<string, unknown>> = []
	validation: Record<string, unknown> | null = null
	status: 'running' | 'failed' | 'completed' = 'running'
	error: ReturnType<typeof serializeError> | null = null

	constructor(
		readonly runId: string,
		readonly dryRun: boolean,
		readonly resumed = false,
	) {}

	addPhase(result: PhaseResult) {
		this.phases.push(result)
	}

	warn(warning: Record<string, unknown>) {
		this.warnings.push(warning)
	}

	fail(error: unknown) {
		this.status = 'failed'
		this.error = serializeError(error)
	}

	complete() {
		this.status = 'completed'
	}

	toJSON() {
		return {
			runId: this.runId,
			dryRun: this.dryRun,
			resumed: this.resumed,
			status: this.status,
			startedAt: this.startedAt.toISOString(),
			finishedAt: new Date().toISOString(),
			preflight: this.preflight,
			phases: this.phases,
			warnings: this.warnings,
			validation: this.validation,
			error: this.error,
		}
	}

	async write(directory: string) {
		await mkdir(directory, { recursive: true, mode: 0o700 })
		const timestamp = this.startedAt
			.toISOString()
			.replaceAll(/[^0-9A-Za-z]/g, '-')
		const filename = path.resolve(directory, `${this.runId}-${timestamp}.json`)
		const temporary = `${filename}.tmp`
		await writeFile(temporary, `${JSON.stringify(this.toJSON(), null, 2)}\n`, {
			mode: 0o600,
		})
		await rename(temporary, filename)
		return filename
	}
}

function logLine(
	level: string,
	message: string,
	details?: Record<string, unknown>,
) {
	const suffix = details ? ` ${JSON.stringify(details)}` : ''
	const line = redactSensitiveText(`[migration] ${level} ${message}${suffix}`)
	if (level === 'ERROR') console.error(line)
	else if (level === 'WARN') console.warn(line)
	else console.log(line)
}

export const consoleLogger: SafeLogger = {
	info: (message, details) => logLine('INFO', message, details),
	warn: (message, details) => logLine('WARN', message, details),
	error: (message, details) => logLine('ERROR', message, details),
}
