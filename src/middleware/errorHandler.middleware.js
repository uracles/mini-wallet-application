import logger from '../utils/logger.js';

/**
 * Global error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    user: req.user?.userId
  });

  // Determine status code
  const statusCode = err.statusCode || 500;

  // Prepare error response
  const errorResponse = {
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err.details
    })
  };

  res.status(statusCode).json(errorResponse);
};

/**
 * 404 handler
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
};

/**
 * Async error wrapper for route handlers
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * GraphQL error formatter
 */
export const formatGraphQLError = (error) => {
  logger.error('GraphQL error:', {
    message: error.message,
    path: error.path,
    extensions: error.extensions
  });

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production') {
    if (error.message.includes('Database') || 
        error.message.includes('Internal') ||
        error.extensions?.code === 'INTERNAL_SERVER_ERROR') {
      return {
        message: 'An internal error occurred',
        extensions: {
          code: 'INTERNAL_SERVER_ERROR'
        }
      };
    }
  }

  return error;
};
