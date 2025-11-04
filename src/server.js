import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import path from 'path';
import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { typeDefs } from './graphql/typeDefs.js';
import { resolvers } from './graphql/resolvers.js';
import { authenticateGraphQL } from './middleware/auth.middleware.js';
import { rateLimitMiddleware } from './middleware/rateLimiter.middleware.js';
import { errorHandler, notFoundHandler, formatGraphQLError } from './middleware/errorHandler.middleware.js';
import logger from './utils/logger.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 4000;
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : '*';

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use(rateLimitMiddleware);

// Get directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Health check endpoint (must be before static files)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Mini Wallet API',
    version: '1.0.0',
    endpoints: {
      graphql: '/graphql',
      health: '/health'
    },
    documentation: 'See README.md for API documentation'
  });
});

// Serve static files from public directory
app.use(express.static(join(__dirname, '..', 'public')));

// Serve index.html at root (this will be last so static files take precedence)
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, '..', 'public', 'index.html'));
});

// Initialize Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  formatError: formatGraphQLError,
  introspection: process.env.NODE_ENV !== 'production',
  playground: process.env.NODE_ENV !== 'production',
  context: authenticateGraphQL
});

// Start server
async function startServer() {
  try {
    // Start Apollo Server
    await server.start();
    
    // Apply Apollo middleware
    app.use(
      '/graphql',
      cors(),
      express.json(),
      expressMiddleware(server, {
        context: async ({ req }) => {
          return await authenticateGraphQL({ req });
        }
      })
    );
    
    // Error handling
    app.use(notFoundHandler);
    app.use(errorHandler);
    
    // Start listening on 0.0.0.0 for Render (critical!)
    const HOST = '0.0.0.0';
    app.listen(PORT, HOST, () => {
      logger.info(`🚀 Server ready at http://${HOST}:${PORT}`);
      logger.info(`📊 GraphQL endpoint: http://${HOST}:${PORT}/graphql`);
      logger.info(`🏥 Health check: http://${HOST}:${PORT}/health`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 Public URL: https://mini-wallet-application.onrender.com`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

startServer();