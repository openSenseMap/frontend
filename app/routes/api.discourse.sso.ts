import { createHmac, timingSafeEqual } from 'node:crypto'
import { redirect, type LoaderFunctionArgs } from 'react-router'
import invariant from 'tiny-invariant'
import { getUser } from '~/utils/session.server'

invariant(
	process.env.DISCOURSE_CONNECT_SECRET,
	'DISCOURSE_CONNECT_SECRET must be set',
)

const DISCOURSE_CONNECT_SECRET = process.env.DISCOURSE_CONNECT_SECRET

function signPayload(payload: string) {
	return createHmac('sha256', DISCOURSE_CONNECT_SECRET).update(payload).digest('hex')
}

function safeEqualHex(a: string, b: string) {
	try {
		const ab = Buffer.from(a, 'hex')
		const bb = Buffer.from(b, 'hex')
		return ab.length === bb.length && timingSafeEqual(ab, bb)
	} catch {
		return false
	}
}

function decodeDiscoursePayload(sso: string) {
	const decoded = Buffer.from(sso, 'base64').toString('utf8')
	return new URLSearchParams(decoded)
}

function encodeDiscoursePayload(params: URLSearchParams) {
	return Buffer.from(params.toString(), 'utf8').toString('base64')
}

function buildAbsoluteLoginRedirect(request: Request) {
	const url = new URL(request.url)
	const redirectTo = `${url.pathname}${url.search}`

	return `/explore/login?${new URLSearchParams({ redirectTo }).toString()}`
}


export async function loader({ request }: LoaderFunctionArgs) {
	const url = new URL(request.url)
	const sso = url.searchParams.get('sso')
	const sig = url.searchParams.get('sig')

	if (!sso || !sig) {
		throw new Response('Missing sso or sig', { status: 400 })
	}

	const expectedSig = signPayload(sso)
	if (!safeEqualHex(sig, expectedSig)) {
		throw new Response('Invalid DiscourseConnect signature', { status: 403 })
	}

	const incoming = decodeDiscoursePayload(sso)
	const nonce = incoming.get('nonce')
	const returnSsoUrl = incoming.get('return_sso_url')

	if (!nonce || !returnSsoUrl) {
		throw new Response('Missing nonce or return_sso_url', { status: 400 })
	}

	const user = await getUser(request)

	// Not logged in? Bounce to the normal login page and come back here afterward.
	if (!user) {
		const loginRedirect = buildAbsoluteLoginRedirect(request)
		throw redirect(loginRedirect)

		// throw redirect(buildAbsoluteLoginRedirect(request))
	}

	// You should only send verified emails unless you intentionally want
	// Discourse to require activation.
	if (!user.email) {
		throw new Response('User has no email', { status: 400 })
	}

	// Pick a username value that is stable and acceptable to Discourse.
	// Often this is a slug/handle, not a display name.
	const username =
		user.name ??
		`user_${user.id}`

	const outgoing = new URLSearchParams()
	outgoing.set('nonce', nonce)
	outgoing.set('external_id', String(user.id)) // stable forever
	outgoing.set('email', user.email)
	outgoing.set('username', username)

	if (user.name) {
		outgoing.set('name', user.name)
	}

	// Only use this if your app has NOT verified email yet:
	// outgoing.set('require_activation', 'true')

	// Optional examples:
	// outgoing.set('avatar_url', user.avatarUrl)
	// outgoing.set('bio', user.bio ?? '')
	// outgoing.set('add_groups', 'beta-testers')
	// outgoing.set('locale', 'en')

	const responsePayload = encodeDiscoursePayload(outgoing)
	const responseSig = signPayload(responsePayload)

	const redirectUrl = new URL(returnSsoUrl)
	redirectUrl.searchParams.set('sso', responsePayload)
	redirectUrl.searchParams.set('sig', responseSig)


	throw redirect(redirectUrl.toString())
}