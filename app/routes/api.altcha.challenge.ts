import { type Route } from './+types/api.altcha.challenge'
import * as z from 'zod/v4'
import { type ZodOpenApiPathItemObject } from 'zod-openapi'
import { createRegistrationChallenge } from '~/lib/altcha.server'
import {
	InternalServerErrorSchema,
	internalServerErrorResponse,
} from '~/lib/openapi/errors'
import { StandardResponse } from '~/lib/responses'

const AltchaChallengeResponseSchema = z
	.object({
		parameters: z.object({
			algorithm: z.literal('PBKDF2/SHA-256'),
			nonce: z.string(),
			salt: z.string(),
			cost: z.literal(5_000),
			keyLength: z.literal(32),
			keyPrefix: z.string(),
			keySignature: z.string(),
			expiresAt: z.number().int(),
			data: z.object({ purpose: z.literal('registration') }),
		}),
		signature: z.string(),
	})
	.meta({
		id: 'AltchaRegistrationChallenge',
		description:
			'A signed, short-lived proof-of-work challenge for user registration.',
	})

export const openapi: ZodOpenApiPathItemObject = {
	get: {
		tags: ['Authentication'],
		summary: 'Create an ALTCHA registration challenge',
		responses: {
			200: {
				description: 'A new registration challenge.',
				content: {
					'application/json': { schema: AltchaChallengeResponseSchema },
				},
			},
			500: internalServerErrorResponse(
				InternalServerErrorSchema,
				'Challenge generation failed.',
			),
		},
	},
}

export async function loader(_args: Route.LoaderArgs) {
	try {
		const challenge = await createRegistrationChallenge()
		return Response.json(challenge, {
			headers: {
				'Cache-Control': 'no-store, no-cache, must-revalidate',
				'Content-Type': 'application/json; charset=utf-8',
			},
		})
	} catch {
		return StandardResponse.internalServerError(
			'Unable to create verification challenge.',
		)
	}
}
