import fs from 'fs';
import { openapiSpecification } from '../app/lib/openapi';

// 1. Ensure public directory exists
if (!fs.existsSync('public')) {
  fs.mkdirSync('public');
}

// 2. Write the OpenAPI spec to a JSON file
fs.writeFileSync(
  'public/openapi.json',
  JSON.stringify(openapiSpecification, null, 2) // 2-space indentation
);

console.log('✅ OpenAPI spec generated at public/openapi.json');