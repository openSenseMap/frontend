#!/bin/sh -ex

npx --yes tsx ./db/migrate.ts
npm run start