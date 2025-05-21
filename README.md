![openSenseMap](https://github.com/openSenseMap/frontend/blob/dev/public/openSenseMap.png)

This repository contains the code of the new _openSenseMap_ frontend running at [https://beta.opensensemap.org](https://beta.opensensemap.org).

Originally, the _openSenseMap_ was built as part of the bachelor thesis of [@mpfeil](https://github.com/mpfeil) at the ifgi (Institute for Geoinformatics, University of Münster). Between 2016 and 2022 development was partly funded by the German Ministry of Education and Research (BMBF) in the projets senseBox and senseBox Pro. This version has been developed by [@mpfeil](https://github.com/mpfeil) and [@freds-dev](https://github.com/freds-dev).

<img width="1438" alt="Screenshot OSeM" src="https://github.com/user-attachments/assets/a7bf16fb-44a2-4a21-9c0f-d4bf431ab9b5">

## Project setup

If you do need to set the project up locally yourself, feel free to follow these instructions:

### System Requirements

- [Node.js](https://nodejs.org/) >= 22.0.0
- [npm](https://npmjs.com/) >= 8.18.0
- [git](https://git-scm.com/) >= 2.38.0
- [Docker](https://www.docker.com) >= 27.0.0

### Variables

You can configure the API endpoint and/or map tiles using the following environmental variables:

| ENV                 | Default value                        |
| ------------------- | ------------------------------------ |
| OSEM_API_URL        | https://api.testing.opensensemap.org |
| DATABASE_URL        | <YOUR_POSTGRES_URL>                  |
| MAPBOX_ACCESS_TOKEN | <YOUR_MAPBOX_ACCESS_TOKEN>           |

You can create a copy of `.env.example`, rename it to `.env` and set the values.

### Setup Steps

1. Clone the repo: `git clone https://github.com/openSenseMap/frontend`
2. Copy `.env.example` into `.env`
3. Run `npm install` to install dependencies
4. Optionally run `docker compose up` to start a docker container running your local postgres DB
   - If it is the first time doing this, you may need to bootstrap the database by running `npm run db:setup`
   - If you want some example data run `npm run db:seed`. **WARNING**: Do not run this on a production database. It will delete all existing data.
5. Run `npm run dev` to start the local server

### Contributing

We welcome all kind of constructive contributions to this project.
If you are planning to implement a new feature or change something, please create an issue first.

Afterwards follow these steps:

1. Fork this repository
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Make and commit your changes
4. Push to the branch (`git push origin my-new-feature`)
5. Create a new pull request against this repository's `dev` branch, linking your issue.

#### How the repository is organized

```shell
├── app                 # main directory where most of the application code lives
│   ├── components      # reusable/ general purpose components
│   ├── lib
│   ├── models
│   ├── routes          # app/ api routes
│   ├── schema
│   └── utils
├── db                  # code for seeding/ migration of database
├── drizzle             # database migrations
├── other
├── public              # static assets
├── server
├── tests               # automated tests, same structure as the app/ folder with tests placed according to the files they test
│   ├── routes          # tests for (resource/ api) routes
├── types
├── ...
```

#### openSenseMap API

The api is implemented using [Remix resource routes](https://remix.run/docs/en/main/guides/resource-routes).
Resource routes may not export a component but only [loaders](https://remix.run/docs/en/main/route/loader) (for `GET` requests) and [actions](https://remix.run/docs/en/main/route/action) (for `POST`, `PUT`, `DELETE` etc) and therefore live in `.ts` (not `.tsx`) files.
All resource routes start with `api` (e.g. `api.user.ts` for `/api/user`).

The api logic is shared with the frontend. Therefore api routes should not implement the actual business logic of an endpoint. They are responsible for checking the request for validity and for transforming the data into the correct output format.
Logic should be implemented in corresponding services, that may be used by loaders/ actions of page routes that access the same functionality.

For example: User registration is possible from both the api and the frontend. The logic for it is implemented in `lib/user.service.ts` and it is being used by both `api.user.ts` (resource route) as well as `explore.register.tsx` (page route), preventing duplication of common logic while also providing the flexibility to adjust the outputs to the needs of the respective use case.

#### Testing

Tests are placed in the [tests/](./tests/) folder whose structure is similar to the [app/](./app/) folder.
When adding a test, use the same name as the file you are testing but change the file extension to `.spec.ts`, e.g. when creating tests for [`./app/utils`](./app/utils.ts) name the test file [`./tests/utils.spec.ts`](./tests/utils.spec.ts).

To run the tests, make sure you have a working database connection (e.g. by running `docker compose up` with the corresponding environment variables to use your local database).
Then simply run `npm test`.

## License

[MIT](LICENSE) - Matthias Pfeil 2015 - now
