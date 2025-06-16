// scripts/generate-openapi.ts
import { register } from 'node:module'
import { pathToFileURL } from 'node:url'
import { writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// Register ts-node
await register('ts-node/esm', pathToFileURL('./'))

// Dynamic import with explicit .js extension
const { openapiSpecification } = await import('../app/lib/openapi.js')

const __dirname = dirname(fileURLToPath(import.meta.url))
writeFileSync(
  `${__dirname}/../public/openapi.json`,
  JSON.stringify(openapiSpecification, null, 2)
)
console.log('✅ OpenAPI spec generated at public/openapi.json')

// import fs from 'fs';
// import { openapiSpecification } from '../app/lib/openapi';

// // 1. Ensure public directory exists
// if (!fs.existsSync('public')) {
//   fs.mkdirSync('public');
// }

// // 2. Write the OpenAPI spec to a JSON file
// fs.writeFileSync(
//   'public/openapi.json',
//   JSON.stringify(openapiSpecification, null, 2) // 2-space indentation
// );

// console.log('✅ OpenAPI spec generated at public/openapi.json');