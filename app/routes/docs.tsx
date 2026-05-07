import { useCallback, useState } from 'react'
import { useLoaderData } from 'react-router'
import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'
import { createDocument } from 'zod-openapi'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '~/components/ui/select'
import {
	generateIntegrationApiSpec,
	generateOpenApiPathsSpec,
	generateOpenApiServerSpec,
} from '~/lib/openapi'

export const loader = () => {
	const doc = createDocument({
		openapi: '3.1.0',
		info: {
			title: 'openSenseMap API',
			version: '1.0.0',
			license: {
				name: 'Public Domain Dedication and License 1.0.',
				identifier: 'PDDL',
				url: 'https://opendatacommons.org/licenses/pddl/summary/',
			},
		},
		servers: generateOpenApiServerSpec(),
		paths: generateOpenApiPathsSpec(),
	})

	const integration = createDocument({ ...generateIntegrationApiSpec() })

	return { spec: doc, integrationSpec: integration }
}

export default function ApiDocumentation() {
	const { spec, integrationSpec } = useLoaderData<typeof loader>()
	const [currentSpec, setCurrentSpec] = useState(spec)

	const handleSpecSelect = useCallback(
		(value: string): void => {
			if (value === spec.info.title) setCurrentSpec(spec)
			if (value === integrationSpec.info.title) setCurrentSpec(integrationSpec)
		},
		[setCurrentSpec, spec, integrationSpec],
	)

	return (
		<main className="container mx-auto p-6">
			<div className="flex justify-center p-3">
				<img src="./img/openSenseMap_API.png" alt="API Image" width={350} />
			</div>
			<div className="flex items-center justify-center gap-4">
				<p>Choose API:</p>
				<Select
					value={currentSpec.info.title}
					onValueChange={handleSpecSelect}
					name="spec"
				>
					<SelectTrigger className="w-max">
						<SelectValue />
					</SelectTrigger>

					<SelectContent>
						<SelectItem value={spec.info.title}>{spec.info.title}</SelectItem>
						<SelectItem value={integrationSpec.info.title}>
							{integrationSpec.info.title}
						</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<SwaggerUI
				spec={currentSpec}
				docExpansion="list"
				defaultModelsExpandDepth={1}
				deepLinking={true}
			/>
		</main>
	)
}
