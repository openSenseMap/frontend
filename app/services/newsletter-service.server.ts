import crypto from 'node:crypto'
import {
	getUserByEmail,
	updateUserPreferencesById,
} from '~/db/models/user.server'
import { type User } from '~/db/schema'

type MailgunWebhookPayload = {
	signature?: {
		timestamp?: string
		token?: string
		signature?: string
	}
	'event-data'?: {
		event?: string
		recipient?: string
		message?: {
			headers?: {
				to?: string
			}
		}
	}
}

const getMailgunConfig = () => {
	const apiKey = process.env.MAILGUN_API_KEY
	const listAddress = process.env.MAILGUN_NEWSLETTER_LIST
	const baseUrl =
		process.env.MAILGUN_API_BASE_URL?.replace(/\/$/, '') ??
		'https://api.mailgun.net'

	if (!apiKey || !listAddress) {
		throw new Error(
			'Mailgun newsletter config missing. Set MAILGUN_API_KEY and MAILGUN_NEWSLETTER_LIST.',
		)
	}

	return { apiKey, listAddress, baseUrl }
}

const getAuthorizationHeader = (apiKey: string) =>
	`Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`

/** Sends a form-encoded request to the configured Mailgun API. */
async function mailgunRequest(
	path: string,
	method: 'POST' | 'PUT',
	body: URLSearchParams,
) {
	const config = getMailgunConfig()

	const response = await fetch(`${config.baseUrl}${path}`, {
		method,
		headers: {
			Authorization: getAuthorizationHeader(config.apiKey),
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body,
	})

	if (!response.ok) {
		const message = await response.text()
		throw new Error(
			`Mailgun newsletter sync failed: ${response.status} ${message}`,
		)
	}

	return 'synced'
}

/** Upserts the user as a Mailgun list member with their current opt-in state. */
export async function syncNewsletterSubscriptionWithMailgun(userToSync: User) {
	const config = getMailgunConfig()

	const body = new URLSearchParams({
		address: userToSync.email,
		name: userToSync.name,
		subscribed: String(userToSync.newsletterOptIn),
		upsert: 'yes',
	})

	return mailgunRequest(
		`/v3/lists/${encodeURIComponent(config.listAddress)}/members`,
		'POST',
		body,
	)
}

/** Disables the local newsletter preference for a Mailgun recipient email. */
export async function disableNewsletterForEmail(email: string) {
	const existingUser = await getUserByEmail(email.toLowerCase())
	if (!existingUser) return null

	return updateUserPreferencesById(existingUser.id, { newsletterOptIn: false })
}

/** Verifies that a webhook payload was signed by Mailgun. */
export function verifyMailgunWebhookSignature(
	payload: MailgunWebhookPayload,
): boolean {
	const signingKey = process.env.MAILGUN_WEBHOOK_SIGNING_KEY
	const signature = payload.signature

	if (
		!signingKey ||
		!signature?.timestamp ||
		!signature.token ||
		!signature.signature
	) {
		return false
	}

	const digest = crypto
		.createHmac('sha256', signingKey)
		.update(`${signature.timestamp}${signature.token}`)
		.digest('hex')

	const expectedSignature = Buffer.from(digest)
	const receivedSignature = Buffer.from(signature.signature)

	return (
		expectedSignature.length === receivedSignature.length &&
		crypto.timingSafeEqual(expectedSignature, receivedSignature)
	)
}

/** Extracts the affected recipient email from a Mailgun webhook payload. */
export function getNewsletterWebhookEmail(payload: MailgunWebhookPayload) {
	return (
		payload['event-data']?.recipient ??
		payload['event-data']?.message?.headers?.to ??
		null
	)
}

/** Returns true when the Mailgun webhook event represents an unsubscribe. */
export function isMailgunUnsubscribeEvent(payload: MailgunWebhookPayload) {
	return payload['event-data']?.event === 'unsubscribed'
}
