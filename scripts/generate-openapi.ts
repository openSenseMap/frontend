// scripts/generate-openapi.ts
import { writeFileSync } from "node:fs";
import { openapiSpecification } from "../app/lib/openapi.js";

writeFileSync(
  "./public/openapi.json",
  JSON.stringify(openapiSpecification(), null, 2),
);

console.info("✅ OpenAPI spec generated");
