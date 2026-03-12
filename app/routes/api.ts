import { type LoaderFunctionArgs } from 'react-router'
import { type Route } from '../+types/root'
import { tosApiMiddleware } from '~/middleware/tos-api.server'

type RouteInfo = {
	path: string
	method: 'GET' | 'PUT' | 'POST' | 'DELETE'
	skipTos: boolean
	deprecationNotice?: string
}

export const middleware: Route.MiddlewareFunction[] = [tosApiMiddleware];

export const routes: { noauth: RouteInfo[]; auth: RouteInfo[] } = {
	noauth: [
		{
			path: '/',
			method: 'GET',
			skipTos: true
		},
		{
			path: '/stats',
			method: 'GET',
			skipTos: true
		},
		{
			path: '/tags',
			method: 'GET',
			skipTos: true
		},
		{
			path: `boxes`,
			method: 'GET',
			skipTos: true
		},
		{
			path: `boxes/data`,
			method: 'GET',
			skipTos: true
		},
		{
			path: `boxes/:boxId`,
			method: 'GET',
		},
		{
			path: `boxes/:boxId/sensors`,
			method: 'GET',
			skipTos: true
		},
		{
			path: `boxes/:boxId/sensors/:sensorId`,
			method: 'GET',
			skipTos: true
		},
		{
			path: `boxes/:boxId/data`,
			method: 'POST',
			skipTos: true
		},
		{
			path: `boxes/:boxId/:sensorId`,
			method: 'POST',
			skipTos: true
		},
		{
			path: `users/register`,
			method: 'POST',
			skipTos: true
		},
		{
			path: `users/request-password-reset`,
			method: 'POST',
			skipTos: true
		},
		{
			path: `users/password-reset`,
			method: 'POST',
			skipTos: true
		},
		{
			path: `users/confirm-email`,
			method: 'POST',
			skipTos: true
		},
		{
			path: `users/sign-in`,
			method: 'POST',
			skipTos: true
		},
	],
	auth: [
		{
			path: `users/refresh-auth`,
			method: 'POST',
			skipTos: true
		},
		{
			path: `users/me`,
			method: 'GET',
			skipTos: true
		},
		{
			path: `users/me`,
			method: 'PUT',
			skipTos: false
		},
		{
			path: `users/me/boxes`,
			method: 'GET',
			skipTos: true
		},
		{
			path: `users/me/boxes/:boxId`,
			method: 'GET',
			skipTos: true
		},
		// {
		//   path: `boxes/:boxId/script`,
		//   method: "GET",
		// },
		{
			path: `boxes`,
			method: 'POST',
			skipTos: false
		},
		{
			path: `boxes/claim`,
			method: 'POST',
			skipTos: false
		},
		{
			path: `boxes/transfer`,
			method: 'POST',
			skipTos: false
		},
		{
			path: `boxes/transfer`,
			method: 'DELETE',
			skipTos: false
		},
		{
			path: `boxes/transfer/:boxId`,
			method: 'GET',
			skipTos: true
		},
		{
			path: `boxes/transfer/:boxId`,
			method: 'PUT',
			skipTos: false
		},
		{
			path: `boxes/:boxId`,
			method: 'PUT',
			skipTos: false
		},
		{
			path: `boxes/:boxId`,
			method: 'DELETE',
			skipTos: false
		},
		{
			path: `boxes/:boxId/:sensorId/measurements`,
			method: 'DELETE',
			skipTos: false
		},
		{
			path: `users/sign-out`,
			method: 'POST',
			skipTos: true
		},
		{
			path: `users/me`,
			method: 'DELETE',
			skipTos: true
		},
		{
			path: `users/me/resend-email-confirmation`,
			method: 'POST',
			skipTos: false
		},
	],
}

export async function loader({}: LoaderFunctionArgs) {
	const lines = [
		`This is the openSenseMap API`,
		'You can find a detailed reference at https://docs.opensensemap.org\n',
		'Routes requiring no authentication:',
	]

	for (const r of routes.noauth) lines.push(`${r.method}\t${r.path}`)

	lines.push('\nRoutes requiring valid authentication through JWT:')

	for (const r of routes.auth)
		lines.push(
			`${r.method}\t${r.path}\t${r.deprecationNotice ? 'DEPRECATED: ' + r.deprecationNotice : ''}`,
		)

	return new Response(lines.join('\n'), {
		status: 200,
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
		},
	})
}
