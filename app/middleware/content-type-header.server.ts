import { MiddlewareFunction } from 'react-router'
import { StandardResponse } from '~/lib/responses'

/**
 * A middleware function responding with HTTP 415 Unsupported Media Type
 * to requests that do not contain the Content-Type: application/json header.
 */
export const requestContentTypeJson =
	(methods?: string[]): MiddlewareFunction<Response> =>
	({ request }) => {
		const allowedMethods = methods?.map((method) => method.toUpperCase())

		if (
			allowedMethods &&
			!allowedMethods.includes(request.method.toUpperCase())
		) {
			return
		}

		const contentType = request.headers.get('content-type') || ''

		if (!contentType.includes('application/json')) {
			return StandardResponse.unsupportedMediaType(
				'Unsupported content-type. Try application/json',
			)
		}
	}

/**
 * A middleware function that sets the Content-Type: application/json
 * header with utf-8 charset for all outgoing responses.
 */
export const responseContentTypeJson: MiddlewareFunction<Response> = async (
	_,
	next,
) => {
	const res = await next()
	res.headers.set('Content-Type', 'application/json; charset=utf-8')
	return res
}

/**
 * A middleware function responding with HTTP 415 Unsupported Media Type
 * to requests that do not contain the Content-Type application/x-www-form-urlencoded
 * or Content-Type multipart/form-data header.
 */
export const requestContentTypeForm: MiddlewareFunction<Response> = ({
	request,
}) => {
	const contentType = request.headers.get('content-type') || ''

	if (
		!contentType.includes('application/x-www-form-urlencoded') &&
		!contentType.includes('multipart/form-data')
	) {
		return StandardResponse.unsupportedMediaType(
			'Unsupported content-type. Try application/x-www-form-urlencoded',
		)
	}
}

export const requestContentTypeJsonOrForm =
	(methods?: string[]): MiddlewareFunction<Response> =>
	({ request }) => {
		const allowedMethods = methods?.map((method) => method.toUpperCase())

		if (
			allowedMethods &&
			!allowedMethods.includes(request.method.toUpperCase())
		) {
			return
		}
		const contentType = request.headers.get('content-type') || ''

		if (
			!contentType.includes('application/json') &&
			!contentType.includes('application/x-www-form-urlencoded')
		) {
			return StandardResponse.unsupportedMediaType(
				'Unsupported content-type. Try application/json or application/x-www-form-urlencoded',
			)
		}
	}
