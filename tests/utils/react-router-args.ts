import  {
	type ActionFunctionArgs,
	type AppLoadContext,
	type LoaderFunctionArgs,
	type Params,
} from 'react-router'

type RouteParams = Params<string>
type RouteContext = AppLoadContext

export function makeLoaderArgs(
	request: Request,
	options?: {
		params?: RouteParams
		context?: RouteContext
	},
): LoaderFunctionArgs {
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
): ActionFunctionArgs {
	return {
		request,
		params: options?.params ?? {},
		context: (options?.context ?? {}) as RouteContext,
		unstable_url: new URL(request.url),
	}
}