![openSenseMap](https://github.com/openSenseMap/frontend/blob/dev/public/img/openSenseMap.png)

This repository contains the code of the redeveloped _openSenseMap_ currently
running as a public beta at
[https://staging.opensensemap.org](https://staging.opensensemap.org).

<img width="1510" height="858" alt="Screenshot OSeM" src="https://github.com/user-attachments/assets/70da4cff-1751-4a13-89e8-607a5198df37">


## Project setup

If you do need to set the project up locally yourself, feel free to follow these
instructions:

### System Requirements

- [Node.js](https://nodejs.org/) >= 24.0.0 (see [.nvmrc](./.nvmrc))
- [npm](https://npmjs.com/) >= 11.0.0
- [nvm](https://github.com/nvm-sh/nvm) >= 4.0.0
- [git](https://git-scm.com/) >= 2.38.0
- [Docker](https://www.docker.com) >= 27.0.0

### Variables

You can configure the API endpoint using the following environmental variables:

| ENV          | Default value                                            |
| ------------ | -------------------------------------------------------- |
| OSEM_API_URL | https://api.testing.opensensemap.org                     |
| DATABASE_URL | `postgresql://postgres:postgres@localhost:5432/postgres` |

You can create a copy of `.env.example`, rename it to `.env` and set the values.
To run a local development version, you only need to adjust the `OSEM_API_URL`
to the one given above.

### Setup Steps

1. Clone the repo: `git clone https://github.com/openSenseMap/frontend`
2. Copy `.env.example` into `.env`
3. Run `nvm use` to use the npm version referred to in [.nvmrc](./.nvmrc)
4. Run `npm install` to install dependencies
5. Optionally run `docker compose up` to start a docker container running your
   local postgres DB (`docker compose up -d` for running container in
   background)
   - If it is the first time doing this, you may need to bootstrap the database
     by running `npm run db:setup`
   - If you want some example data run `npm run db:seed`. **WARNING**: Do not
     run this on a production database. It will delete all existing data.
6. Run `npm run dev` to start the local server

### Linting and formatting

This project uses [Oxlint](https://oxc.rs/docs/guide/usage/linter.html) for
linting and [Oxfmt](https://oxc.rs/docs/guide/usage/formatter.html) for
formatting.The configurations in `oxfmt.config.ts` and `.oxlintrc.json` extend
[@epic-web/config/](https://github.com/epicweb-dev/config).

Run formatting:

```bash
npm run format
```

For more options inspect the `package.json` file. Editor integration is provided
by the recommended Oxc extension listed in `.vscode/extensions.json`.

Exemplary VSCode config:

```JSON
{
  "editor.formatOnSave": true,
  "editor.formatOnSaveMode": "file",
  "editor.codeActionsOnSave": {
    "source.fixAll.oxc": "always"
  },
  "oxc.enable": true,
  "oxc.fmt.configPath": "./oxfmt.config.ts",
  "oxc.configPath": "./oxlintrc.json",
  "[typescript]": {
    "editor.defaultFormatter": "oxc.oxc-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "oxc.oxc-vscode",
    "editor.tabSize": 2
  },
}
```

### Contributing

We welcome all kind of constructive contributions to this project. If you have
ideas, suggestions or plan to implement a new feature, please open a new
[GitHub discussion](https://github.com/openSenseMap/frontend/discussions) to
connect to us and other contributers.

If you implement a new feature or change something, please create an issue.

Afterwards follow these steps:

1. Fork this repository
2. Create your feature branch (`git checkout -b feat/my-new-feature`)
3. Make and commit your changes
4. Push to the branch (`git push origin feat/my-new-feature`)
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

The [swaggerJsdoc Library](https://www.npmjs.com/package/swagger-jsdoc) reads
the JSDoc-annotated source code in the api-routes and generates an
openAPI(Swagger) specification and is rendered using
[Swaggger UI](https://swagger.io/tools/swagger-ui/). The
[JSDoc annotations](https://github.com/Surnet/swagger-jsdoc) is usually added
before the loader or action function in the API Routes. The documentation will
then be automatically generated from the JSDoc annotations in all the api
routes. When testing the api during development do not forget to change the
server to [Development Server](http://localhost:3000). To authorize a user you
must provide the token obtained after sign-in. You can just copy and paste the
token in the value field and then hit the authorize button.

##### JSDoc Example

Here's an example of how to document an API route using JSDoc annotations:

```javascript
/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve a single user by their unique identifier
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Unique identifier of the user
 *         schema:
 *           type: string
 *           example: "12345"
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "12345"
 *                 name:
 *                   type: string
 *                   example: "John Doe"
 *                 email:
 *                   type: string
 *                   example: "john.doe@example.com"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2023-01-15T10:30:00Z"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "User not found"
 *       500:
 *         description: Internal server error
 */
export async function loader({ params }) {
	const { id } = params

	try {
		const user = await getUserById(id)
		if (!user) {
			throw new Response('User not found', { status: 404 })
		}
		return Response.json({ user })
	} catch (error) {
		throw new Response('Internal server error', { status: 500 })
	}
}
```

This JSDoc annotation will automatically generate comprehensive API
documentation including endpoint details, parameters, response schemas, and
example values.

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

[MIT](LICENSE) - openSenseLab 2026
