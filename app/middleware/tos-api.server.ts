import { getTosRequirementForUser } from '~/db/models/tos.server'
import {
	compileApiRoutes,
	findApiRoute,
	type CompiledApiRoute,
} from '~/lib/api-route-matching'
import { apiRoutes } from '~/lib/api-routes'
import { getUserFromJwt } from '~/lib/jwt'

function json(body: unknown, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json; charset=utf-8' },
	})
}

/**
 * Build allowlist from route metadata:
 * - `auth` routes with `tosExempt: true` bypass ToS checks
 */
const API_TOS_ALLOWLIST: CompiledApiRoute[] = compileApiRoutes({
	noauth: [],
	auth: apiRoutes.auth.filter((route) => route.tosExempt),
})

function isAllowedApi(request: Request, pathname: string) {
	return Boolean(findApiRoute(request, pathname, API_TOS_ALLOWLIST))
}

export async function tosApiMiddleware(
	{ request }: { request: Request },
	next: () => Promise<Response>,
) {
	const url = new URL(request.url)

	const jwtUser = await getUserFromJwt(request)
	if (typeof jwtUser !== 'object') return next()

	if (isAllowedApi(request, url.pathname)) return next()

	const req = await getTosRequirementForUser(jwtUser.id)
	if (req.mustBlock && req.tos) {
		return json(
			{
				code: 'tos_required',
				tosVersionId: req.tos.id,
				effectiveFrom: req.tos.effectiveFrom,
				acceptBy: req.tos.acceptBy,
			},
			428,
		)
	}

	return next()
}
