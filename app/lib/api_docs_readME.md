# API Documentation Setup Guide for Remix with Swagger UI

This document explains how to set up automatic API documentation generation for a Remix application using `swagger-jsdoc` and `swagger-ui-react`.

## Table of Contents
1. [Project Structure](#project-structure)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Documenting API Routes](#documenting-api-routes)
5. [Viewing Documentation](#viewing-documentation)
6. [Production Considerations](#production-considerations)

## Project Structure

For an application with API routes named `api.[filename].ts`, the relevant files should be organized as follows:

```
app/
  routes/
    api.[sensors].ts       # Example API route
    api.[measurements].ts  # Another API route
    api.docs.tsx           # Swagger UI viewer
    api.docs.json.ts       # OpenAPI spec endpoint
  lib/
    openapi.ts            # OpenAPI configuration
```

## Installation

First, install the required dependencies:

```bash
npm install swagger-jsdoc swagger-ui-react
npm install --save-dev @types/swagger-jsdoc
```

## Configuration

### 1. OpenAPI Specification Generator (`app/lib/openapi.ts`)

```typescript
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'openSenseMap API',
      version: '1.0.0',
      description: 'API documentation for openSenseMap',
    },
    servers: [{ url: 'http://localhost:3000' }],
  },
  // Note the pattern matches api.*.ts files
  apis: ['./app/routes/api.*.ts'],
};

export const openapiSpecification = swaggerJsdoc(options);
```

### 2. JSON Endpoint for Spec (`app/routes/api.docs.json.ts`)

```typescript
import { openapiSpecification } from '~/lib/openapi';

export const loader = () => {
  return Response.json(openapiSpecification);
};
```

### 3. Swagger UI Viewer (`app/routes/docs.tsx`)

```typescript
import { useLoaderData } from '@remix-run/react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export const loader = async () => {
  // Fetch from our JSON endpoint
  const response = await fetch('/api/docs.json');
  const spec = await response.json();
  return Response.json(spec);
};

export default function ApiDocumentation() {
  const spec = useLoaderData<typeof loader>();
  return <SwaggerUI spec={spec} />;
}
```

## Documenting API Routes

For each API route (e.g., `app/routes/api.sensors.ts`), add JSDoc comments with OpenAPI annotations:

```typescript
/**
 * @openapi
 * /api/sensors:
 *   get:
 *     summary: Get all sensors
 *     description: Returns a list of all available sensors
 *     responses:
 *       200:
 *         description: A list of sensors
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Sensor'
 * 
 * components:
 *   schemas:
 *     Sensor:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "sensor-123"
 *         name:
 *           type: string
 *           example: "Temperature Sensor"
 *         unit:
 *           type: string
 *           example: "°C"
 */
export const loader = async () => {
  // Implementation here
  return Response.json(sensors);
};
```

## Viewing Documentation

After starting your Remix development server:

- **OpenAPI JSON Specification**: Visit `http://localhost:3000/api/docs.json`
- **Swagger UI Interface**: Visit `http://localhost:3000/docs`

## Production Considerations

1. **Performance Optimization**:
   - In production, consider importing the spec directly rather than fetching:
     ```typescript
     import { openapiSpecification } from '~/lib/openapi';
     
     export const loader = () => {
       return json(openapiSpecification);
     };
     ```

2. **Security**:
   - Protect your documentation routes in production
   - Consider adding authentication middleware

3. **Build Process**:
   - You may want to generate the OpenAPI spec at build time
   - Add a script to your `package.json`:
     ```json
     "scripts": {
       "build:docs": "ts-node app/lib/openapi.ts > public/openapi.json"
     }
     ```

4. **Customization**:
   - Customize the Swagger UI appearance by wrapping it:
     ```tsx
     <div className="swagger-container">
       <SwaggerUI spec={spec} />
     </div>
     ```

## Troubleshooting

1. **Docs not updating**:
   - Restart your Remix dev server when adding new route annotations
   - Ensure your JSDoc comments follow the correct OpenAPI format

2. **Routes not appearing**:
   - Verify the `apis` pattern in `openapi.ts` matches your file naming
   - Check for syntax errors in your JSDoc comments

3. **Type errors**:
   - Ensure you have `@types/swagger-jsdoc` installed
   - Verify all TypeScript files have proper extensions (.ts or .tsx)

This setup provides a clean, maintainable way to document your Remix API routes while keeping the documentation in sync with your actual implementation.