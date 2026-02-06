import { resolve } from 'node:path'
import { PassThrough } from 'stream'
import { createReadableStreamFromReadable } from '@react-router/node'
import { createInstance } from 'i18next'
import backend from 'i18next-fs-backend/cjs' // Even though unintuitive, cjs is what we want https://github.com/i18next/i18next-fs-backend/issues/57
import { isbot } from 'isbot'
import { renderToPipeableStream } from 'react-dom/server'
import { I18nextProvider, initReactI18next } from 'react-i18next'
import { ServerRouter, type EntryContext } from 'react-router'
import i18nextOptions from './i18next-options' // our i18n configuration file
import i18next from './i18next.server'
import { getEnv, init } from './utils/env.server'

// Reject/cancel all pending promises after 5 seconds
export const streamTimeout = 5000

init()
global.ENV = getEnv()

export default async function handleRequest(
	request: Request,
	responseStatusCode: number,
	responseHeaders: Headers,
	reactRouterContext: EntryContext,
) {
	const callbackName = isbot(request.headers.get('user-agent'))
		? 'onAllReady'
		: 'onShellReady'

	// First, we create a new instance of i18next so every request will have a
	// completely unique instance and not share any state
	let instance = createInstance()

	// Then we could detect locale from the request
	let lng = await i18next.getLocale(request)
	// And here we detect what namespaces the routes about to render want to use
	let ns = i18next.getRouteNamespaces(reactRouterContext)

	// First, we create a new instance of i18next so every request will have a
	// completely unique instance and not share any state.
	await instance
		.use(initReactI18next) // Tell our instance to use react-i18next
		.use(backend) // Setup our backend
		.init({
			...i18nextOptions, // Spreact the configuration
			lng, // The locale we detected above
			ns, // The namespace the routes about to render wants to use
			backend: {
				loadPath: resolve('./public/locales/{{lng}}/{{ns}}.json'),
			},
		})

	return new Promise((resolve, reject) => {
		let didError = false

		// Then you can render your app wrapped in the I18nextProvider as in the
		// entry.client file
		const { pipe, abort } = renderToPipeableStream(
			<I18nextProvider i18n={instance}>
				<ServerRouter context={reactRouterContext} url={request.url} />
			</I18nextProvider>,
			{
				[callbackName]: () => {
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

					console.error(error)
				},
			},
		)

		// Automatically timeout the React renderer after 6 seconds, which ensures
		// React has enough time to flush down the rejected boundary contents
		setTimeout(abort, streamTimeout + 1000)
	})
}
