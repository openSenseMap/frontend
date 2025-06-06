import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'openSenseMap API',
      version: '1.0.0',
      description: 'API documentation for openSenseMap Remix application',
    },
    servers: [
      {
        url: 'http://localhost:3000', // Update with your base URL
      },
    ],
  },
  // Path to the API routes containing JSDoc annotations
  apis: ['./app/routes/api.*.ts'], // Adjust path as needed
};

export const openapiSpecification = swaggerJsdoc(options);