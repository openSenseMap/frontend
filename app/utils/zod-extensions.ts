import { z } from 'zod'

export const checkboxSchema = (msgWhenRequired?: string) => {
	const transformedValue = z
		.string()
		.optional()
		.transform((value) => value === 'true')
	return msgWhenRequired
		? transformedValue.refine((_) => _, { message: msgWhenRequired })
		: transformedValue
}
