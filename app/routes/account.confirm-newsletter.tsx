import { redirect } from 'react-router'
import { type Route } from './+types/account.confirm-newsletter'
import {
	authSessionStorage,
	getUserSession,
} from '~/services/session-service.server'
import { confirmNewsletterSubscription } from '~/services/newsletter-service.server'

export async function loader({ request }: Route.LoaderArgs) {
	const url = new URL(request.url)
	const token = url.searchParams.get('token')?.trim()

	if (!token) {
		return redirect('/settings/preferences')
	}

	const result = await confirmNewsletterSubscription(token)

	if (result === 'success') {
		const session = await getUserSession(request)

		return redirect('/settings/preferences', {
			headers: {
				'Set-Cookie': await authSessionStorage.commitSession(session),
			},
		})
	}

	if (result === 'expired') {
		return redirect('/settings/preferences')
	}

	return redirect('/settings/preferences')
}

export default function ConfirmNewsletterRoute() {
	return null
}
