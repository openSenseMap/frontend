import { PassThrough } from 'stream'
import { createReadableStreamFromReadable } from '@react-router/node'
import { isbot } from 'isbot'
import {
	renderToPipeableStream,
	type RenderToPipeableStreamOptions,
} from 'react-dom/server'
import { I18nextProvider } from 'react-i18next'
import {
	type RouterContextProvider,
	ServerRouter,
	type EntryContext,
} from 'react-router'
import { getInstance } from './middleware/i18next'
import { getEnv, init } from './utils/env.server'

export const STREAM_TIMEOUT = 5_000

init()
global.ENV = getEnv()

export default async function handleRequest(
	request: Request,
	responseStatusCode: number,
	responseHeaders: Headers,
	entryContext: EntryContext,
	routerContext: RouterContextProvider,
) {
	let shellRendered = false
	let userAgent = request.headers.get('user-agent')

	let readyOption: keyof RenderToPipeableStreamOptions =
		(userAgent && isbot(userAgent)) || entryContext.isSpaMode
			? 'onAllReady'
			: 'onShellReady'

	return new Promise((resolve, reject) => {
		let didError = false

		const { pipe, abort } = renderToPipeableStream(
			<I18nextProvider i18n={getInstance(routerContext)}>
				<ServerRouter context={entryContext} url={request.url} />
			</I18nextProvider>,
			{
				[readyOption]: () => {
					shellRendered = true
					const body = new PassThrough()
					const stream = createReadableStreamFromReadable(body)

					responseHeaders.set('Content-Type', 'text/html')

					resolve(
						new Response(stream, {
							headers: responseHeaders,
							status: didError ? 500 : responseStatusCode,
						}),
					)

					pipe(body)
				},
				onShellError: (err: unknown) => {
					reject(err)
				},
				onError: (error: unknown) => {
					didError = true
					if (shellRendered) console.error(error)
				},
			},
		)

		// Automatically timeout the React renderer after 6 seconds, which ensures
		// React has enough time to flush down the rejected boundary contents
		setTimeout(abort, STREAM_TIMEOUT + 1_000)
	})
}
