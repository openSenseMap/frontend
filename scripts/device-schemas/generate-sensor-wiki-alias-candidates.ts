import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
	matchSensorWikiAlias,
	normalizeSensorWikiAliasValue,
	sensorWikiAliasEntries,
	type SensorWikiAliasEntry,
} from '../../app/lib/device-schemas/sensor-wiki-aliases.ts'

type LegacySensor = {
	_id?: string
	title?: string | null
	unit?: string | null
	sensorType?: string | null
}

type LegacyBox = {
	_id?: string
	model?: string | null
	sensors?: LegacySensor[]
}

type Args = {
	input: string
	output: string
	minCount: number
	minFuzzyScore: number
	fuzzyLimit: number
}

type FuzzyMatch = {
	sensorWikiPhenomenon: string
	sensorWikiUnit?: string
	title: string
	unit?: string
	score: number
	confidence: 'high' | 'medium' | 'low'
	ambiguous: boolean
	source: 'fuzzy-alias'
	reasons: string[]
	matchedAlias: string
	titleScore: number
	unitMatched: boolean
	sensorTypeMatched: boolean
}

type Candidate = {
	title: string
	unit: string
	sensorType: string
	normalizedTitle: string
	normalizedUnit: string
	normalizedSensorType: string
	occurrences: number
	exampleSensorIds: string[]
	exampleBoxIds: string[]
	suggestedMatch?: ReturnType<typeof matchSensorWikiAlias>
	fuzzyMatches: FuzzyMatch[]
	reviewStatus: 'suggested' | 'fuzzy-suggested' | 'needs-review'
}

function parseArgs(argv: string[]): Args {
	const args: Args = {
		input: 'sensor-wiki-matching/allboxes.json',
		output: 'sensor-wiki-matching/generated/alias-candidates.json',
		minCount: 5,
		minFuzzyScore: 0.62,
		fuzzyLimit: 3,
	}

	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index]
		const next = argv[index + 1]

		if (arg === '--input' && next) {
			args.input = next
			index += 1
		} else if (arg === '--output' && next) {
			args.output = next
			index += 1
		} else if (arg === '--min-count' && next) {
			args.minCount = Number(next)
			index += 1
		} else if (arg === '--min-fuzzy-score' && next) {
			args.minFuzzyScore = Number(next)
			index += 1
		} else if (arg === '--fuzzy-limit' && next) {
			args.fuzzyLimit = Number(next)
			index += 1
		} else if (arg === '--help') {
			printHelp()
			process.exit(0)
		}
	}

	if (!Number.isFinite(args.minCount) || args.minCount < 1) {
		throw new Error('--min-count must be a positive number')
	}
	if (
		!Number.isFinite(args.minFuzzyScore) ||
		args.minFuzzyScore < 0 ||
		args.minFuzzyScore > 1
	) {
		throw new Error('--min-fuzzy-score must be a number between 0 and 1')
	}
	if (!Number.isFinite(args.fuzzyLimit) || args.fuzzyLimit < 1) {
		throw new Error('--fuzzy-limit must be a positive number')
	}

	return args
}

function printHelp() {
	console.log(`Generate Sensor Wiki alias candidates from a legacy boxes export.

Usage:
  npm run device-schemas:alias-candidates
  npm run device-schemas:alias-candidates -- --input ./allboxes.json --min-count 20

Options:
  --input      Path to a legacy boxes JSON export.
  --output     Path for the generated JSON report.
  --min-count  Only include title/unit/type combinations seen at least this often.
  --min-fuzzy-score  Minimum fuzzy score between 0 and 1. Defaults to 0.62.
  --fuzzy-limit      Maximum fuzzy suggestions per candidate. Defaults to 3.
`)
}

function candidateKey(sensor: LegacySensor) {
	return JSON.stringify([
		normalizeSensorWikiAliasValue(sensor.title),
		normalizeSensorWikiAliasValue(sensor.unit),
		normalizeSensorWikiAliasValue(sensor.sensorType),
	])
}

function unique<T>(values: T[]) {
	return [...new Set(values)]
}

function tokenize(value: string) {
	return value.split(' ').filter(Boolean)
}

function levenshteinDistance(left: string, right: string) {
	const rows = left.length + 1
	const columns = right.length + 1
	const distances = Array.from({ length: rows }, () =>
		Array.from({ length: columns }, () => 0),
	)

	for (let row = 0; row < rows; row += 1) distances[row][0] = row
	for (let column = 0; column < columns; column += 1) {
		distances[0][column] = column
	}

	for (let row = 1; row < rows; row += 1) {
		for (let column = 1; column < columns; column += 1) {
			const substitutionCost = left[row - 1] === right[column - 1] ? 0 : 1

			distances[row][column] = Math.min(
				distances[row - 1][column] + 1,
				distances[row][column - 1] + 1,
				distances[row - 1][column - 1] + substitutionCost,
			)
		}
	}

	return distances[left.length][right.length]
}

function levenshteinSimilarity(left: string, right: string) {
	const longestLength = Math.max(left.length, right.length)
	if (longestLength === 0) return 1

	return 1 - levenshteinDistance(left, right) / longestLength
}

function tokenDiceSimilarity(left: string, right: string) {
	const leftTokens = tokenize(left)
	const rightTokens = tokenize(right)
	if (leftTokens.length === 0 || rightTokens.length === 0) return 0

	const rightTokenSet = new Set(rightTokens)
	const intersection = leftTokens.filter((token) => rightTokenSet.has(token))

	return (2 * intersection.length) / (leftTokens.length + rightTokens.length)
}

function titleSimilarity(left: string, right: string) {
	if (!left || !right) return 0
	if (left === right) return 1
	if (left.includes(right) || right.includes(left)) return 0.92

	return Math.max(
		levenshteinSimilarity(left, right),
		tokenDiceSimilarity(left, right),
	)
}

function bestTitleMatch(inputTitle: string, entry: SensorWikiAliasEntry) {
	const aliases = unique([entry.title, ...entry.titleAliases])

	return aliases
		.map((alias) => {
			const normalizedAlias = normalizeSensorWikiAliasValue(alias)
			return {
				alias,
				score: titleSimilarity(inputTitle, normalizedAlias),
			}
		})
		.sort((left, right) => right.score - left.score)[0]
}

function aliasIncludesValue(aliases: string[] | undefined, value: string) {
	if (!value) return false

	return !!aliases?.some(
		(alias) => normalizeSensorWikiAliasValue(alias) === value,
	)
}

function confidenceForScore(
	score: number,
	unitMatched: boolean,
	ambiguous: boolean,
): FuzzyMatch['confidence'] {
	if (!ambiguous && unitMatched && score >= 0.86) return 'high'
	if (!ambiguous && score >= 0.72) return 'medium'
	return 'low'
}

function findFuzzyMatches(
	sensor: LegacySensor,
	{ minFuzzyScore, fuzzyLimit }: Pick<Args, 'minFuzzyScore' | 'fuzzyLimit'>,
): FuzzyMatch[] {
	const normalizedTitle = normalizeSensorWikiAliasValue(sensor.title)
	const normalizedUnit = normalizeSensorWikiAliasValue(sensor.unit)
	const normalizedSensorType = normalizeSensorWikiAliasValue(sensor.sensorType)

	if (normalizedTitle.length < 3) return []

	const scoredMatches = sensorWikiAliasEntries
		.map((entry) => {
			const titleMatch = bestTitleMatch(normalizedTitle, entry)
			const unitMatched = aliasIncludesValue(entry.unitAliases, normalizedUnit)
			const sensorTypeMatched = aliasIncludesValue(
				entry.sensorTypeAliases,
				normalizedSensorType,
			)
			const score = Math.max(
				0,
				Math.min(
					1,
					titleMatch.score * 0.78 +
						(unitMatched ? 0.17 : normalizedUnit ? -0.04 : 0) +
						(sensorTypeMatched ? 0.05 : 0),
				),
			)

			const reasons = ['fuzzy-title']
			if (unitMatched) reasons.push('unit-alias')
			if (sensorTypeMatched) reasons.push('sensor-type-alias')
			if (normalizedUnit && entry.unitAliases && !unitMatched) {
				reasons.push('unit-mismatch')
			}

			return {
				entry,
				matchedAlias: titleMatch.alias,
				titleScore: titleMatch.score,
				score,
				unitMatched,
				sensorTypeMatched,
				reasons,
			}
		})
		.filter((match) => match.score >= minFuzzyScore)
		.sort((left, right) => right.score - left.score)

	return scoredMatches.slice(0, fuzzyLimit).map((match, index) => {
		const nextBestScore = scoredMatches[index === 0 ? 1 : 0]?.score ?? 0
		const ambiguous = Math.abs(match.score - nextBestScore) < 0.08

		return {
			sensorWikiPhenomenon: match.entry.sensorWikiPhenomenon,
			sensorWikiUnit: match.entry.sensorWikiUnit,
			title: match.entry.title,
			unit: match.entry.unit,
			score: Number(match.score.toFixed(3)),
			confidence: confidenceForScore(match.score, match.unitMatched, ambiguous),
			ambiguous,
			source: 'fuzzy-alias',
			reasons: match.reasons,
			matchedAlias: match.matchedAlias,
			titleScore: Number(match.titleScore.toFixed(3)),
			unitMatched: match.unitMatched,
			sensorTypeMatched: match.sensorTypeMatched,
		}
	})
}

async function main() {
	const args = parseArgs(process.argv.slice(2))
	const raw = await readFile(args.input, 'utf8')
	const boxes = JSON.parse(raw) as LegacyBox[]
	const candidatesByKey = new Map<string, Candidate>()
	let sensorCount = 0

	for (const box of boxes) {
		for (const sensor of box.sensors ?? []) {
			sensorCount += 1

			const key = candidateKey(sensor)
			const existing = candidatesByKey.get(key)

			if (existing) {
				existing.occurrences += 1
				if (sensor._id && existing.exampleSensorIds.length < 5) {
					existing.exampleSensorIds.push(sensor._id)
				}
				if (box._id && existing.exampleBoxIds.length < 5) {
					existing.exampleBoxIds.push(box._id)
				}
				continue
			}

			const suggestedMatch = matchSensorWikiAlias(sensor)
			const fuzzyMatches = suggestedMatch ? [] : findFuzzyMatches(sensor, args)

			candidatesByKey.set(key, {
				title: sensor.title ?? '',
				unit: sensor.unit ?? '',
				sensorType: sensor.sensorType ?? '',
				normalizedTitle: normalizeSensorWikiAliasValue(sensor.title),
				normalizedUnit: normalizeSensorWikiAliasValue(sensor.unit),
				normalizedSensorType: normalizeSensorWikiAliasValue(sensor.sensorType),
				occurrences: 1,
				exampleSensorIds: sensor._id ? [sensor._id] : [],
				exampleBoxIds: box._id ? [box._id] : [],
				suggestedMatch,
				fuzzyMatches,
				reviewStatus: suggestedMatch
					? 'suggested'
					: fuzzyMatches.length > 0
						? 'fuzzy-suggested'
						: 'needs-review',
			})
		}
	}

	const candidates = [...candidatesByKey.values()]
		.filter((candidate) => candidate.occurrences >= args.minCount)
		.sort((left, right) => right.occurrences - left.occurrences)

	const output = {
		generatedAt: new Date().toISOString(),
		input: args.input,
		minCount: args.minCount,
		totalBoxes: boxes.length,
		totalSensors: sensorCount,
		totalDistinctCombinations: candidatesByKey.size,
		includedCandidates: candidates.length,
		suggestedCandidates: candidates.filter(
			(candidate) => candidate.suggestedMatch,
		).length,
		fuzzySuggestedCandidates: candidates.filter(
			(candidate) => candidate.fuzzyMatches.length > 0,
		).length,
		needsReviewCandidates: candidates.filter(
			(candidate) => candidate.reviewStatus === 'needs-review',
		).length,
		candidates,
	}

	await mkdir(path.dirname(args.output), { recursive: true })
	await writeFile(args.output, `${JSON.stringify(output, null, 2)}\n`, 'utf8')

	console.log(
		`Wrote ${candidates.length} alias candidates to ${args.output} ` +
			`(${output.suggestedCandidates} exact, ${output.fuzzySuggestedCandidates} fuzzy, ` +
			`${output.needsReviewCandidates} need review).`,
	)
}

main().catch((error) => {
	console.error(error)
	process.exit(1)
})
