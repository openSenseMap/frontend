![openSenseMap](https://github.com/openSenseMap/frontend/blob/dev/public/img/openSenseMap.png)

This repository contains the code of the new _openSenseMap_ frontend running at
[https://beta.opensensemap.org](https://beta.opensensemap.org).

Originally, the _openSenseMap_ was built as part of the bachelor thesis of
[@mpfeil](https://github.com/mpfeil) at the ifgi (Institute for Geoinformatics,
University of Münster). Between 2016 and 2022 development was partly funded by
the German Ministry of Education and Research (BMBF) in the projets senseBox and
senseBox Pro. This version has been developed by
[@mpfeil](https://github.com/mpfeil) and
[@freds-dev](https://github.com/freds-dev).

<img width="1438" alt="Screenshot OSeM" src="https://github.com/user-attachments/assets/a7bf16fb-44a2-4a21-9c0f-d4bf431ab9b5">

## Project setup

If you do need to set the project up locally yourself, feel free to follow these
instructions:

### System Requirements

- [Node.js](https://nodejs.org/) >= 24.0.0 (see [.nvmrc](./.nvmrc))
- [npm](https://npmjs.com/) >= 11.0.0
- [git](https://git-scm.com/) >= 2.38.0
- [Docker](https://www.docker.com) >= 27.0.0

### Variables

You can configure the API endpoint and/or map tiles using the following
environmental variables:

| ENV          | Default value                        |
| ------------ | ------------------------------------ |
| OSEM_API_URL | https://api.testing.opensensemap.org |
| DATABASE_URL | <YOUR_POSTGRES_URL>                  |

You can create a copy of `.env.example`, rename it to `.env` and set the values.

### Setup Steps

1. Clone the repo: `git clone https://github.com/openSenseMap/frontend`
2. Copy `.env.example` into `.env`
3. Run `npm install` to install dependencies
4. Optionally run `docker compose up` to start a docker container running your
   local postgres DB
   - If it is the first time doing this, you may need to bootstrap the database
     by running `npm run db:setup`
   - If you want some example data run `npm run db:seed`. **WARNING**: Do not
     run this on a production database. It will delete all existing data.
5. Run `npm run dev` to start the local server

### Contributing

We welcome all kind of constructive contributions to this project. If you are
planning to implement a new feature or change something, please create an issue
first.

Afterwards follow these steps:

1. Fork this repository
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Make and commit your changes
4. Push to the branch (`git push origin my-new-feature`)
5. Create a new pull request against this repository's `dev` branch, linking
   your issue.

#### How the repository is organized

```shell
├frontend
├── .github
├── app/
│   ├── components/                 reusable UI components like buttons, alerts, etc.
│   |	├── routes/					follows the structure of app/routes for route-specific components (use sparingly!)
│   ├── emails/                     email templates
│   ├── routes/                     pages and layouts making up the application using the components
│   |   ├── ...
│   ├── lib/                        shared utility / 3rd party code that "does stuff"™️
│   ├── services/                   domain-specific stuff, business logic like a measurement service
│   ├── models/                     mostly plain types, interfaces, classes, schemas (not database)
│   ├── db/                         app-related database specifics
│   |   ├── drizzle/
│   |   |   ├── meta/
│   |   |   ├── 0000_xyz.sql
│   └── index.js.map
├── public							public assets (favicons, etc.)
├── scripts
│   ├── db/                         database utility scripts (e.g. seed)
│   |   ├── migrate.ts
│   |   ├── seed.ts
│   |   ├── ...
├── tests/                          follows the structure of app/ for tests of corresponding file(s)
│   ├── components
│   ├── routes
│   |   ├── api
│   |   ├── ...
│   ├── lib
│   ├── ...
└── ...
```

#### openSenseMap API

The api is implemented using
[Remix resource routes](https://remix.run/docs/en/main/guides/resource-routes).
Resource routes may not export a component but only
[loaders](https://remix.run/docs/en/main/route/loader) (for `GET` requests) and
[actions](https://remix.run/docs/en/main/route/action) (for `POST`, `PUT`,
`DELETE` etc) and therefore live in `.ts` (not `.tsx`) files. All resource
routes start with `api` (e.g. `api.user.ts` for `/api/user`).

The api logic is shared with the frontend. Therefore api routes should not
implement the actual business logic of an endpoint. They are responsible for
checking the request for validity and for transforming the data into the correct
output format. Logic should be implemented in corresponding services, that may
be used by loaders/ actions of page routes that access the same functionality.

For example: User registration is possible from both the api and the frontend.
The logic for it is implemented in `lib/user.service.ts` and it is being used by
both `api.user.ts` (resource route) as well as `explore.register.tsx` (page
route), preventing duplication of common logic while also providing the
flexibility to adjust the outputs to the needs of the respective use case.

##### Documenting an API Route

API route documentation is generated from route-local `zod-openapi`
definitions. Each API route can export an `openapi` object that describes the
route's OpenAPI path item. Request bodies, response bodies, path parameters,
query parameters, and headers should be described with Zod schemas wherever
possible.

The main benefit of this approach is that schemas can be shared between
validation and documentation. This keeps the OpenAPI documentation closer to the
actual implementation and reduces the risk of outdated docs.

The generated OpenAPI specification is rendered using
[Swagger UI](https://swagger.io/tools/swagger-ui/). When testing the API during
development, do not forget to change the server to the
[Development Server](http://localhost:3000). To authorize a user, provide the
token obtained after sign-in. You can copy and paste the token into the value
field and then hit the authorize button.

##### zod-openapi Example

Here's an example of how to document an API route using `zod-openapi`:

```typescript
import { z } from 'zod'
import { type ZodOpenApiPathItemObject } from 'zod-openapi'
import { type Route } from './+types/api.users.$id'

const UserPathParamsSchema = z.object({
	id: z.string().min(1).meta({
		description: 'Unique identifier of the user',
		example: '12345',
	}),
})

const UserSchema = z
	.object({
		id: z.string().meta({
			description: 'Unique identifier of the user',
			example: '12345',
		}),
		name: z.string().meta({
			description: "User's display name",
			example: 'John Doe',
		}),
		email: z.string().email().meta({
			description: "User's email address",
			example: 'john.doe@example.com',
		}),
		createdAt: z.string().datetime().meta({
			description: 'Account creation timestamp',
			example: '2023-01-15T10:30:00.000Z',
		}),
	})
	.meta({
		id: 'User',
		description: 'User information object',
	})

const NotFoundErrorSchema = z
	.object({
		code: z.literal('Not Found'),
		message: z.literal('User not found'),
		error: z.literal('User not found'),
	})
	.meta({ id: 'NotFoundError' })

const InternalServerErrorSchema = z
	.object({
		code: z.literal('Internal Server Error'),
		message: z.literal('Internal server error'),
		error: z.literal('Internal server error'),
	})
	.meta({ id: 'InternalServerError' })

export const openapi: ZodOpenApiPathItemObject = {
	get: {
		tags: ['Users'],
		summary: 'Get user by ID',
		description: 'Retrieve a single user by their unique identifier',
		operationId: 'getUserById',

		requestParams: {
			path: UserPathParamsSchema,
		},

		responses: {
			200: {
				description: 'User retrieved successfully',
				content: {
					'application/json': {
						schema: UserSchema,
					},
				},
			},
			404: {
				description: 'User not found',
				content: {
					'application/json': {
						schema: NotFoundErrorSchema,
					},
				},
			},
			500: {
				description: 'Internal server error',
				content: {
					'application/json': {
						schema: InternalServerErrorSchema,
					},
				},
			},
		},
	},
}

export async function loader({ params }: Route.LoaderArgs) {
	const { id } = params

	try {
		const user = await getUserById(id)

		if (!user) {
			return StandardResponse.notFound('User not found')
		}

		const parsed = await UserSchema.safeParseAsync(user)

		if (!parsed.success) {
			return StandardResponse.internalServerError()
		}

		return StandardResponse.ok(parsed.data)
	} catch (error) {
		console.warn(error)
		return StandardResponse.internalServerError('Internal server error')
	}
}
```

The exported `openapi` object is picked up automatically when generating the
OpenAPI specification. Prefer defining reusable Zod schemas for request bodies,
response bodies, path parameters, query parameters, and shared error responses.

Use `.meta(...)` to add OpenAPI-specific metadata such as descriptions,
examples, component ids, and formatting hints. For route parameters, prefer
`requestParams` over manually writing OpenAPI `parameters`, because it allows
the parameters to be described directly with Zod schemas.

#### Testing

Tests are placed in the [tests/](./tests/) folder whose structure is similar to
the [app/](./app/) folder. When adding a test, use the same name as the file you
are testing but change the file extension to `.spec.ts`, e.g. when creating
tests for [`./app/utils`](./app/utils.ts) name the test file
[`./tests/utils.spec.ts`](./tests/utils.spec.ts).

To run the tests, make sure you have a working database connection (e.g. by
running `docker compose up` with the corresponding environment variables to use
your local database). Then simply run `npm test`.

## License

[MIT](LICENSE) - Matthias Pfeil 2015 - now
