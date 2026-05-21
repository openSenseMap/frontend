import * as z from 'zod/v4'
import 'zod-openapi'

import { apiMessages } from '~/lib/openapi/messages'

export const PasswordConfirmationRequestSchema = z
	.object({
		password: z
			.string()
			.min(1, {
				error: apiMessages.passwordRequired,
			})
			.meta({
				description: 'Current user password required to confirm this action',
				example: 'myCurrentPassword123',
				format: 'password',
			}),
	})
	.meta({
		id: 'PasswordConfirmationRequest',
		description: 'Password confirmation payload.',
	})
