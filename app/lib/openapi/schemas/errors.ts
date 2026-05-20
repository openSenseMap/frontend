import * as z from 'zod/v4'
import 'zod-openapi'

export const standardErrorResponseSchema = <Code extends string>(
	code: Code,
	messageSchema: z.ZodType<string> = z.string(),
) =>
	z.object({
		code: z.literal(code),
		message: messageSchema,
		error: messageSchema,
	})

type StandardErrorSchemaOptions<Code extends string> = {
	code: Code
	id: string
	description?: string
	examples?: string[]
	messageSchema?: z.ZodType<string>
}

export const createStandardErrorSchema = <Code extends string>({
	code,
	id,
	description,
	examples,
	messageSchema,
}: StandardErrorSchemaOptions<Code>) =>
	standardErrorResponseSchema(
		code,
		messageSchema ??
			z.string().meta({
				examples,
			}),
	).meta({
		id,
		description,
	})

export const createStandardErrorSchemaFactory =
	<const Code extends string>(code: Code) =>
	(options: Omit<StandardErrorSchemaOptions<Code>, 'code'>) =>
		createStandardErrorSchema({
			code,
			...options,
		})

export const createBadRequestErrorSchema =
	createStandardErrorSchemaFactory('Bad Request')

export const createUnauthorizedErrorSchema =
	createStandardErrorSchemaFactory('Unauthorized')

export const createForbiddenErrorSchema =
	createStandardErrorSchemaFactory('Forbidden')

export const createNotFoundErrorSchema =
	createStandardErrorSchemaFactory('Not Found')

export const createConflictErrorSchema =
	createStandardErrorSchemaFactory('Conflict')

export const createUnprocessableContentErrorSchema =
	createStandardErrorSchemaFactory('Unprocessable Content')

export const createUnsupportedMediaTypeErrorSchema =
	createStandardErrorSchemaFactory('Unsupported Media Type')

export const createInternalServerErrorSchema = createStandardErrorSchemaFactory(
	'Internal Server Error',
)
