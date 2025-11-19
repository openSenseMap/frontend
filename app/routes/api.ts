import { type LoaderFunctionArgs } from 'react-router'

type RouteInfo = {
	path: string
	method: 'GET' | 'PUT' | 'POST' | 'DELETE'
	deprecationNotice?: string
}

const routes: { noauth: RouteInfo[]; auth: RouteInfo[] } = {
	noauth: [
		{
			path: '/',
			method: 'GET',
		},
		{
			path: '/stats',
			method: 'GET',
		},
		{
			path: '/tags',
			method: 'GET',
		},
		// {
		//   path: `statistics/idw`,
		//   method: "GET",

		// },
		// {
		//   path: `statistics/descriptive`,
		//   method: "GET",

		// },
		{
			path: `boxes`,
			method: 'GET',
		},
		// {
		//   path: `boxes/data`,
		//   method: "GET",
		// },

		// {
		//   path: `boxes/:boxId`,
		//   method: "GET",
		// },
		{
			path: `boxes/:boxId/sensors`,
			method: 'GET',
		},
		{
			path: `boxes/:boxId/sensors/:sensorId`,
			method: 'GET',
		},
		// {
		//   path: `boxes/:boxId/data/:sensorId`,
		//   method: "GET",
		// },
		// {
		//   path: `boxes/:boxId/locations`,
		//   method: "GET",
		// },
		// {
		//   path: `boxes/data`,
		//   method: "POST",
		// },
		{
			path: `boxes/:boxId/data`,
			method: 'POST',
		},
		{
			path: `boxes/:boxId/:sensorId`,
			method: 'POST',
		},
		{
			path: `users/register`,
			method: 'POST',
		},
		{
			path: `users/request-password-reset`,
			method: 'POST',
		},
		{
			path: `users/password-reset`,
			method: 'POST',
		},
		{
			path: `users/confirm-email`,
			method: 'POST',
		},
		{
			path: `users/sign-in`,
			method: 'POST',
		},
	],
	auth: [
		{
			path: `users/refresh-auth`,
			method: 'POST',
		},
		{
			path: `users/me`,
			method: 'GET',
		},
		{
			path: `users/me`,
			method: 'PUT',
		},
		{
			path: `users/me/boxes`,
			method: 'GET',
		},
		{
			path: `users/me/boxes/:boxId`,
			method: 'GET',
		},
		// {
		//   path: `boxes/:boxId/script`,
		//   method: "GET",
		// },
		{
			path: `boxes`,
			method: 'POST',
		},
		{
			path: `boxes/claim`,
			method: 'POST',
		},
		{
			path: `boxes/transfer`,
			method: 'POST',
		},
		{
			path: `boxes/transfer`,
			method: 'DELETE',
		},
		{
			path: `boxes/transfer/:boxId`,
			method: 'GET',
		},
		{
			path: `boxes/transfer/:boxId`,
			method: 'PUT',
		},
		// {
		//   path: `boxes/:boxId`,
		//   method: "PUT",
		// },
		{
			path: `boxes/:boxId`,
			method: 'DELETE',
		},
		{
			path: `boxes/:boxId/:sensorId/measurements`,
			method: 'DELETE',
			deprecationNotice:
				'Use boxes/:boxId/sensors/:sensorId/measurements instead',
		},
		{
			path: `boxes/:boxId/sensors/:sensorId/measurements`,
			method: 'DELETE',
		},
		{
			path: `users/sign-out`,
			method: 'POST',
		},
		{
			path: `users/me`,
			method: 'DELETE',
		},
		{
			path: `users/me/resend-email-confirmation`,
			method: 'POST',
		},
	],
	// management: [
	//   {
	//     path: `${managementPath}/boxes`,
	//     method: "GET",
	//   },
	//   {
	//     path: `${managementPath}/boxes/:boxId`,
	//     method: "GET",
	//   },
	//   {
	//     path: `${managementPath}/boxes/:boxId`,
	//     method: "PUT",
	//   },
	//   {
	//     path: `${managementPath}/boxes/delete`,
	//     method: "POST",
	//   },
	//   {
	//     path: `${managementPath}/users`,
	//     method: "GET",
	//   },
	//   {
	//     path: `${managementPath}/users/:userId`,
	//     method: "GET",
	//   },
	//   {
	//     path: `${managementPath}/users/:userId`,
	//     method: "PUT",
	//   },
	//   {
	//     path: `${managementPath}/users/delete`,
	//     method: "POST",
	//   },
	//   {
	//     path: `${managementPath}/users/:userId/exec`,
	//     method: "POST",
	//   },
	// ],
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
