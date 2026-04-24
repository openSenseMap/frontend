import { type Route } from '../+types/root'
import { apiRoutes as routes } from '~/lib/api-routes'
import { tosApiMiddleware } from '~/middleware/tos-api.server'

export { routes }
export const middleware: Route.MiddlewareFunction[] = [tosApiMiddleware]

export async function loader({}: Route.LoaderArgs) {
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
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	})
}
