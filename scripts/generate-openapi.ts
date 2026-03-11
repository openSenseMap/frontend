import { writeFileSync } from "node:fs";
import { combinedOpenapiSpecification } from "../app/lib/openapi.combined.js";

writeFileSync(
  "./public/openapi.json",
  JSON.stringify(combinedOpenapiSpecification(), null, 2),
);

console.info("✅ OpenAPI spec generated");