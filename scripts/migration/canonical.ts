import { legacyId } from './domain/transforms'

export function canonicalValue(value: unknown): string {
	if (value instanceof Date) return JSON.stringify(value.toISOString())
	const id = legacyId(value)
	if (id && value && typeof value === 'object' && 'toHexString' in value) {
		return JSON.stringify(id)
	}
	if (Array.isArray(value)) {
		return `[${value.map(canonicalValue).join(',')}]`
	}
	if (value && typeof value === 'object') {
		return `{${Object.entries(value)
			.filter(([, item]) => item !== undefined)
			.sort(([left], [right]) => left.localeCompare(right))
			.map(([key, item]) => `${JSON.stringify(key)}:${canonicalValue(item)}`)
			.join(',')}}`
	}
	return JSON.stringify(value)
}
