import { MiddlewareFunction } from 'react-router'
import { StandardResponse } from '~/lib/responses'

/**
 * A middleware function responding with HTTP 415 Unsupported Media Type
 * to requests that do not contain the Content-Type: application/json header.
 */
export const requestContentTypeJson: MiddlewareFunction<Response> = ({
	request,
}) => {
	const contentType = request.headers.get('content-type') || ''
	if (!contentType.includes('application/json'))
		return StandardResponse.unsupportedMediaType(
			'Unsupported content-type. Try application/json',
		)
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
