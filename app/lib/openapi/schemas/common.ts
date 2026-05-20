import * as z from 'zod/v4'
import 'zod-openapi'

export const IdParamSchema = z.string().min(1).meta({
	description: 'Resource ID',
	example: '5f2a1b2c3d4e5f6a7b8c9d0e',
})

export const IsoDateTimeSchema = z.string().datetime().meta({
	description: 'ISO 8601 timestamp',
	example: '2026-05-18T12:34:56.000Z',
})
