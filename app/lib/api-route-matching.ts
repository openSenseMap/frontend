import { type RouteInfo } from '~/lib/api-routes'

type HttpMethod = RouteInfo['method'] | '*'

export type CompiledApiRoute<T extends RouteInfo = RouteInfo> = {
	route: T
	kind: 'auth' | 'noauth'
	method: HttpMethod
	matcher: RegExp
}

export function apiRoutePath(path: string) {
	if (path === '/' || path === '') return '/api'
	return `/api/${path.replace(/^\/+/, '')}`
}

export function routeToRegex(apiPathPattern: string) {
	const escaped = apiPathPattern
		.split('/')
		.map((segment) =>
			segment.startsWith(':')
				? '[^/]+'
				: segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
		)
		.join('/')
	const trailingSlash = apiPathPattern === '/api' ? '/?' : ''
	return new RegExp(`^${escaped}${trailingSlash}$`)
}

export function compileApiRoutes(routes: {
	noauth: RouteInfo[]
	auth: RouteInfo[]
}): CompiledApiRoute[] {
	return [
		...routes.noauth.map((route) => ({
			route,
			kind: 'noauth' as const,
			method: route.method,
			matcher: routeToRegex(apiRoutePath(route.path)),
		})),
		...routes.auth.map((route) => ({
			route,
			kind: 'auth' as const,
			method: route.method,
			matcher: routeToRegex(apiRoutePath(route.path)),
		})),
	]
}

export function findApiRoute(
	request: Request,
	pathname: string,
	compiledRoutes: CompiledApiRoute[],
) {
	const method = request.method as HttpMethod
	return compiledRoutes.find((rule) => {
		if (rule.method !== '*' && rule.method !== method) return false
		return rule.matcher.test(pathname)
	})
}
