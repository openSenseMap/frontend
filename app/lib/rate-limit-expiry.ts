export function parseRateLimitExpiry(
	value: string,
): { ok: true; value: Date | null } | { ok: false; error: string } {
	const normalizedValue = value.trim()
	if (!normalizedValue) return { ok: true, value: null }

	const date = new Date(`${normalizedValue}Z`)
	if (Number.isNaN(date.getTime())) {
		return { ok: false, error: 'Enter a valid expiry date.' }
	}

	return { ok: true, value: date }
}

export function toUtcDateTimeLocalValue(value: Date | string | null) {
	if (!value) return ''
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) return ''
	return date.toISOString().slice(0, 16)
}
