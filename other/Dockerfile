# base node image
FROM node:22-bullseye-slim AS base

# set for base and all layer that inherit from it
ENV NODE_ENV=production

# Update system and install some stuff
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init

# Install all node_modules, including dev dependencies
FROM base AS deps

WORKDIR /myapp

ADD package.json package-lock.json .npmrc ./
RUN npm install --include=dev

# Setup production node_modules
FROM base AS production-deps

WORKDIR /myapp

COPY --from=deps /myapp/node_modules /myapp/node_modules
ADD package.json package-lock.json .npmrc ./
RUN npm prune --omit=dev

# Build the app
FROM base AS build

WORKDIR /myapp

COPY --from=deps /myapp/node_modules /myapp/node_modules
ADD . .

RUN npm run build

# Finally, build the production image with minimal footprint
FROM base

WORKDIR /myapp

COPY --from=production-deps /myapp/node_modules /myapp/node_modules

COPY --from=build /myapp/server-build /myapp/server-build
COPY --from=build /myapp/build /myapp/build

# Not sure if we really need this or if we should move all our /public folder to /app/assets
COPY --from=build /myapp/public /myapp/public

COPY ./other/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

ADD . .

ENTRYPOINT [ "./entrypoint.sh" ]