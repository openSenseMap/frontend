import * as z from 'zod/v4'
import 'zod-openapi'

export const BoxTransferTokenSchema = z.string().min(1).meta({
	description: 'Transfer token.',
	example: 'transfer-token-example',
})

export const BoxTransferClaimSchema = z
	.object({
		id: z.string().meta({
			description: 'Unique transfer claim id.',
			example: 'clm_01jv7c9x8n0example',
		}),

		boxId: z.string().meta({
			description: 'ID of the box marked for transfer.',
			example: '5bdbe70f55d0ad001a04edc9',
		}),

		token: BoxTransferTokenSchema,

		expiresAt: z.iso.datetime().nullable().optional().meta({
			description:
				'Expiration date of the transfer token. If omitted, the token does not have an explicit expiration date.',
			example: '2026-05-22T12:00:00.000Z',
		}),

		createdAt: z.iso.datetime().meta({
			description: 'Transfer claim creation timestamp.',
			example: '2026-05-21T12:00:00.000Z',
		}),

		updatedAt: z.iso.datetime().meta({
			description: 'Transfer claim update timestamp.',
			example: '2026-05-21T12:00:00.000Z',
		}),
	})
	.meta({
		id: 'BoxTransferClaim',
		description: 'Transfer claim created for a box.',
	})
