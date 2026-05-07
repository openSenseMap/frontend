import { useLoaderData } from 'react-router'
import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'
import {
	createDocument,
	ZodOpenApiPathItemObject,
	ZodOpenApiPathsObject,
} from 'zod-openapi'

export const loader = async ({ request }: { request: Request }) => {
	// if (process.env.NODE_ENV === 'production') {
	// 	const url = new URL(request.url)
	// 	const res = await fetch(new URL('/openapi.json', url.origin))
	// 	if (!res.ok)
	// 		throw new Response('Failed to load OpenAPI spec', { status: 500 })
	// 	const spec = await res.json()
	// 	return Response.json({ spec })
	// }
	// const { combinedOpenapiSpecification } =
	// 	await import('~/lib/openapi.combined')
	// return Response.json({
	// 	spec: combinedOpenapiSpecification(),
	// })

	function convertFilePathToApiPath(filePath: string) {
		// Extract filename and remove extension
		// /app/routes/api.users.$id.tsx -> api.users.$id
		const fileName =
			filePath
				.split('/')
				.pop()
				?.replace(/\.(tsx|ts|jsx|js)$/, '') || ''

		// Handle root routes
		if (fileName === 'root' || fileName === 'home' || fileName === 'index') {
			return '/'
		}

		// Convert dots to slashes (path separator convention)
		// api.users.$id -> api/users/$id
		let path = fileName.replace(/\./g, '/')

		// Convert $param to {param} for OpenAPI
		// api/users/$id -> api/users/{id}
		path = path.replace(/\$(\w+)/g, '{$1}')

		// Add leading slash
		return `/${path}`
	}

	const routes = import.meta.glob<{
		openapi?: ZodOpenApiPathItemObject
		[key: string]: any
	}>('/app/routes/api.*.ts', { eager: true })

	const paths: ZodOpenApiPathsObject = {}

	for (const [filePath, module] of Object.entries(routes)) {
		if (!module.openapi) continue

		const apiPath = convertFilePathToApiPath(filePath)

		// Merge methods into path
		paths[apiPath] = {
			...paths[apiPath],
			...module.openapi,
		}
	}

	const doc = createDocument({
		openapi: '3.1.0',
		info: {
			title: 'My API',
			version: '1.0.0',
		},
		paths: paths,
	})

	return { spec: doc }
}

export default function ApiDocumentation() {
	const { spec } = useLoaderData<typeof loader>()

	return (
		<main className="container mx-auto p-6">
			<div className="flex justify-center p-3">
				<img src="./img/openSenseMap_API.png" alt="API Image" width={350} />
			</div>

			{/* Optional manual TOC */}
			<div className="mb-6 flex justify-center gap-4">
				<a href="#public-api" className="text-blue-600 hover:underline">
					Public API
				</a>
				<a href="#integration-api" className="text-green-600 hover:underline">
					Integration API
				</a>
			</div>

			<SwaggerUI
				spec={spec}
				docExpansion="list"
				defaultModelsExpandDepth={1}
				deepLinking={true}
			/>
		</main>
	)
}
