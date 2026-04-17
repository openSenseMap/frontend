import  { type AppLoadContext, type Params } from 'react-router'

type RouteParams = Params<string>
type RouteContext = AppLoadContext

type TestRouteArgs = {
	request: Request
	params: RouteParams
	context: RouteContext
	unstable_url: URL
}

export function makeLoaderArgs(
	request: Request,
	options?: {
		params?: RouteParams
		context?: RouteContext
	},
): TestRouteArgs {
	return {
		request,
		params: options?.params ?? {},
		context: (options?.context ?? {}) as RouteContext,
		unstable_url: new URL(request.url),
	}
}

export function makeActionArgs(
	request: Request,
	options?: {
		params?: RouteParams
		context?: RouteContext
	},
): TestRouteArgs {
	return {
		request,
		params: options?.params ?? {},
		context: (options?.context ?? {}) as RouteContext,
		unstable_url: new URL(request.url),
	}
}