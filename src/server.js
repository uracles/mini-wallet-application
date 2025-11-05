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


dotenv.config();

const PORT = parseInt(process.env.PORT, 10) || 10000;
const app = express();

logger.info(`Starting server on port ${PORT}`);
logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);

// Security middleware
// app.use(helmet({
//   contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
//   crossOriginEmbedderPolicy: false
// }));
// Security middleware with CSP that allows inline event handlers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-hashes'"],
      scriptSrcAttr: ["'unsafe-inline'", "'unsafe-hashes'"],  // Allows onclick, onsubmit, etc.
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: [
        "'self'", 
        "http://localhost:10000",  // For local testing
        "https://mini-wallet-application.onrender.com", 
        "https://*.aivencloud.com"
      ],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : '*';

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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
    environment: process.env.NODE_ENV,
    port: PORT
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
    logger.info(' Initializing Apollo Server...');
    
    // Start Apollo Server
    await server.start();
    logger.info(' Apollo Server started');
    
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
    
    logger.info(' GraphQL middleware applied');
    
    app.use(notFoundHandler);
    app.use(errorHandler);

    const HOST = '0.0.0.0';
    
    app.listen(PORT, HOST, () => {
      logger.info('='.repeat(60));
      logger.info(' SERVER STARTED SUCCESSFULLY');
      logger.info('='.repeat(60));
      logger.info(` Host: ${HOST}`);
      logger.info(` Port: ${PORT}`);
      logger.info(` GraphQL: http://${HOST}:${PORT}/graphql`);
      // logger.info(`🏥 Health: http://${HOST}:${PORT}/health`);
      logger.info(` Environment: ${process.env.NODE_ENV || 'development'}`);
      // logger.info(`🔗 Public URL: https://mini-wallet-application.onrender.com`);
      logger.info('='.repeat(60));
    });
  } catch (error) {
    logger.error(' Failed to start server:', error);
    logger.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

process.on('uncaughtException', (error) => {
  logger.error(' Uncaught Exception:', error);
  logger.error('Stack trace:', error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(' Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('⚠️ SIGTERM signal received: closing HTTP server');
  server.stop().then(() => {
    logger.info(' Apollo Server stopped');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info(' SIGINT signal received: closing HTTP server');
  server.stop().then(() => {
    logger.info(' Apollo Server stopped');
    process.exit(0);
  });
});

startServer();