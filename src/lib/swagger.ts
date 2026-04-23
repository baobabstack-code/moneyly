import swaggerJsdoc from 'swagger-jsdoc';

export const getApiDocs = () => {
  const spec = swaggerJsdoc({
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'HTB Global API Documentation',
        version: '1.0.0',
        description: 'API documentation for HTB Global institutional lending platform. This documents the available endpoints and the core database schema for applications and profiles.',
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
        schemas: {
          Application: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              reference: { type: 'string', example: 'LN-1234' },
              status: { type: 'string', enum: ['draft', 'submitted', 'approved', 'rejected'] },
              first_name: { type: 'string' },
              last_name: { type: 'string' },
              national_id: { type: 'string' },
              product_name: { type: 'string' },
              retail_price: { type: 'number' },
              deposit_amount: { type: 'number' },
              balance_amount: { type: 'number' },
              id_copy_url: { type: 'string', format: 'uri' },
              payslip_url: { type: 'string', format: 'uri' },
              photo_url: { type: 'string', format: 'uri' },
              created_at: { type: 'string', format: 'date-time' },
            },
          },
          Profile: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              full_name: { type: 'string' },
              avatar_url: { type: 'string', format: 'uri' },
              updated_at: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
      security: [],
    },
    apis: ['./src/app/api/**/*.ts'], // Search for jsdoc comments in api routes
  });
  return spec;
};
