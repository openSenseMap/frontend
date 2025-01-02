![openSenseMap](https://github.com/openSenseMap/frontend/blob/dev/public/openSenseMap.png)

This repository contains the code of the new *openSenseMap* frontend running at [https://beta.opensensemap.org](https://beta.opensensemap.org).

Originally, the *openSenseMap* was built as part of the bachelor thesis of [@mpfeil](https://github.com/mpfeil) at the ifgi (Institute for Geoinformatics, University of Münster). Between 2016 and 2022 development was partly funded by the German Ministry of Education and Research (BMBF) in the projets senseBox and senseBox Pro. This version has been developed by [@mpfeil](https://github.com/mpfeil) and [@freds-dev](https://github.com/freds-dev).

<img width="1438" alt="Screenshot OSeM" src="https://github.com/user-attachments/assets/a7bf16fb-44a2-4a21-9c0f-d4bf431ab9b5">


## Project setup

If you do need to set the project up locally yourself, feel free to follow these instructions:

### System Requirements
- [Node.js](https://nodejs.org/) >= 20.0.0
- [npm](https://npmjs.com/) >= 8.18.0
- [git](https://git-scm.com/) >= 2.38.0
- [Docker](https://www.docker.com) >= 27.0.0

### Variables

You can configure the API endpoint and/or map tiles using the following environmental variables:

| ENV | Default value |
| --------- | ----------------- |
| OSEM_API_URL     | https://api.testing.opensensemap.org |
| DATABASE_URL     | <YOUR_POSTGRES_URL> |
| MAPBOX_ACCESS_TOKEN |  <YOUR_MAPBOX_ACCESS_TOKEN> |

You can create a copy of `.env.example`, rename it to `.env` and set the values.

### Setup Steps

1. Clone the repo: `git clone https://github.com/openSenseMap/frontend`
2. Copy `.env.example` into `.env`
3. Run `npm install` to install dependencies
4. Run `npm run docker` to start the docker container running your local postgres DB
5. Run `npm run build`
6. Run `npm run dev` to start the local server

### Contributing

We welcome all kind of constructive contributions to this project. Please have a look at [CONTRIBUTING](.github/CONTRIBUTING.md) if you want to do so.

## License

[MIT](LICENSE) - Matthias Pfeil 2015 - now
