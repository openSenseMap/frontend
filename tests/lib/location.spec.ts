import {
	locationSchema,
	parseLocationFormData,
	validateLocationFieldErrors,
} from '~/lib/location'

function locationFormData(height?: string) {
	const formData = new FormData()
	formData.set('latitude', '51.969')
	formData.set('longitude', '7.596')

	if (height !== undefined) formData.set('height', height)

	return formData
}

describe('device location height validation', () => {
	it.each([undefined, ''])(
		'accepts an optional blank height (%s)',
		(height) => {
			const result = parseLocationFormData(locationFormData(height))

			expect(result.success).toBe(true)
			if (!result.success) return

			expect(result.data).toEqual({
				latitude: 51.969,
				longitude: 7.596,
				height: undefined,
			})
		},
	)

	it.each([
		['zero', '0', 0],
		['negative', '-12.5', -12.5],
		['positive', '123.75', 123.75],
	] as const)('parses a %s height', (_label, input, expected) => {
		const result = parseLocationFormData(locationFormData(input))

		expect(result.success).toBe(true)
		if (!result.success) return

		expect(result.data.height).toBe(expected)
	})

	it.each(['not-a-number', 'Infinity', '-Infinity'])(
		'rejects invalid height %s',
		(height) => {
			const result = parseLocationFormData(locationFormData(height))

			expect(result.success).toBe(false)
			if (result.success) return

			expect(result.errors.height).toBeDefined()
		},
	)

	it('reports height errors through client-side field validation', () => {
		expect(
			validateLocationFieldErrors({
				latitude: 51.969,
				longitude: 7.596,
				height: Number.NaN,
			}),
		).toHaveProperty('height')
	})

	it('normalizes a null height to undefined in the shared form schema', () => {
		expect(
			locationSchema.parse({
				latitude: 51.969,
				longitude: 7.596,
				height: null,
			}),
		).toEqual({ latitude: 51.969, longitude: 7.596, height: undefined })
	})
})
