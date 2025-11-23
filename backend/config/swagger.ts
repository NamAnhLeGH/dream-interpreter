// Swagger API documentation configuration
// Attribution: Created with assistance from ChatGPT

import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Dream Interpreter API',
      version: '1.0.0',
      description: 'AI-powered dream interpretation API with user authentication and dream journaling',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token'
        },
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      { cookieAuth: [] },
      { bearerAuth: [] }
    ]
  },
  apis: ['./routes/*.ts', './server.ts'] // Path to the API files
};

export const swaggerSpec = swaggerJsdoc(options);

