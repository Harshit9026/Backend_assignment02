const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TaskFlow REST API',
      version: '1.0.0',
      description: `
# TaskFlow API Documentation

A scalable REST API with JWT Authentication and Role-Based Access Control (RBAC).

## Authentication
This API uses **Bearer JWT tokens** for authentication. After login, include the token in the Authorization header:
\`Authorization: Bearer <your_token>\`

## Roles
- **user**: Standard user - can manage their own tasks
- **admin**: Full access - can manage all users and tasks

## Rate Limiting
- General endpoints: 100 requests per 15 minutes
- Auth endpoints: 20 requests per 15 minutes
      `,
      contact: {
        name: 'API Support',
        email: 'support@taskflow.com',
      },
      license: {
        name: 'MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
      {
        url: 'https://api.taskflow.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '64a1b2c3d4e5f6789012345a' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', example: 'john@example.com' },
            role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Task: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '64a1b2c3d4e5f6789012345b' },
            title: { type: 'string', example: 'Implement auth system' },
            description: { type: 'string', example: 'Build JWT-based auth' },
            status: { type: 'string', enum: ['todo', 'in-progress', 'completed'], example: 'todo' },
            priority: { type: 'string', enum: ['low', 'medium', 'high'], example: 'high' },
            dueDate: { type: 'string', format: 'date-time' },
            tags: { type: 'array', items: { type: 'string' } },
            owner: { type: 'string', example: '64a1b2c3d4e5f6789012345a' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            user: { '$ref': '#/components/schemas/User' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message' },
            errors: { type: 'array', items: { type: 'object' } },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
            pages: { type: 'integer' },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Users', description: 'User profile management' },
      { name: 'Tasks', description: 'Task CRUD operations' },
      { name: 'Admin', description: 'Admin-only endpoints' },
      { name: 'Health', description: 'Health check' },
    ],
  },
  apis: ['./src/routes/**/*.js', './src/models/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;
