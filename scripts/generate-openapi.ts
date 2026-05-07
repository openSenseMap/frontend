import { writeFileSync } from 'node:fs'
import { combinedOpenapiSpecification } from '../app/lib/openapi.combined.js'
import { createDocument } from 'zod-openapi'

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
	openapi?: object
	[key: string]: any
}>('/app/routes/api.*.ts', { eager: true })

const paths: Record<string, Record<string, any>> = {}

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
	paths: {},
})

writeFileSync('./public/openapi.json', JSON.stringify(doc, null, 2))

console.info('✅ OpenAPI spec generated')
