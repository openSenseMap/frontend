// scripts/generate-openapi.ts
import { writeFileSync } from 'node:fs'
import { openapiSpecification } from '../app/lib/openapi.js'

writeFileSync(
  './public/openapi.json',
  JSON.stringify(openapiSpecification, null, 2)
)

console.log('✅ OpenAPI spec generated')

// // scripts/generate-openapi.ts
// import { createRequire } from 'node:module'
// const require = createRequire(import.meta.url)
// require('ts-node').register({ esm: true, experimentalSpecifierResolution: 'node' })
// import { writeFileSync } from 'node:fs'
// import { openapiSpecification } from '../app/lib/openapi.js' // Must use .js extension

// writeFileSync(
//   './public/openapi.json',
//   JSON.stringify(openapiSpecification, null, 2)
// )
// console.log('✅ OpenAPI spec generated')

