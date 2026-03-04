export const swaggerInfo = {
  openapi: '3.0.0',
  info: {
    title: 'Tryora API',
    version: '1.0.0',
    description: 'API documentation for the Tryora fashion try-on platform',
  },
  servers: [
    {
      url: 'http://localhost:8000',
      description: 'Development server',
    },
    {
      url: 'https://api.tryora.com',
      description: 'Production server',
    },
  ],
};
