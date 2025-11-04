import logger from '../utils/logger.js';
import { AppError, DatabaseError, InternalServerError } from '../utils/errors.js';

/**
 * Converts unknown errors to AppError instances
 */
const normalizeError = (err) => {
  // If already an AppError, return as-is
  if (err instanceof AppError) {
    return err;
  }

  // Handle PostgreSQL/Database errors
  if (err.code) {
    return handleDatabaseError(err);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return new AppError('Invalid token', 401, true);
  }

  if (err.name === 'TokenExpiredError') {
    return new AppError('Token expired', 401, true);
  }

  // Handle validation errors from joi or other validators
  if (err.name === 'ValidationError') {
    return new AppError(err.message, 422, true, { errors: err.details });
  }

  // Handle ethers.js blockchain errors
  if (err.code && typeof err.code === 'string') {
    return handleBlockchainError(err);
  }

  // Handle axios/network errors
  if (err.isAxiosError) {
    return new AppError(
      err.response?.data?.message || 'External service error',
      err.response?.status || 503,
      true
    );
  }

  // Default: return as Internal Server Error
  return new InternalServerError(
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    false
  );
};

/**
 * Handles database-specific errors
 */
const handleDatabaseError = (err) => {
  switch (err.code) {
    case '23505': // Unique violation
      return new AppError('Resource already exists', 409, true, {
        field: err.constraint,
        detail: err.detail
      });

    case '23503': // Foreign key violation
      return new AppError('Related resource not found', 404, true, {
        detail: err.detail
      });

    case '23502': // Not null violation
      return new AppError('Required field missing', 400, true, {
        field: err.column
      });

    case '22P02': // Invalid text representation
      return new AppError('Invalid data format', 400, true);

    case '23514': // Check violation
      return new AppError('Data constraint violation', 400, true, {
        detail: err.detail
      });

    case '42P01': // Undefined table
      return new DatabaseError('Database configuration error', err);

    case '42703': // Undefined column
      return new DatabaseError('Database schema error', err);

    case '53300': // Too many connections
      return new AppError('Service temporarily unavailable', 503, true);

    case 'ECONNREFUSED':
      return new DatabaseError('Database connection failed', err);

    default:
      return new DatabaseError('Database operation failed', err);
  }
};

/**
 * Handles blockchain-specific errors
 */
const handleBlockchainError = (err) => {
  const message = err.message || '';

  // Insufficient funds
  if (
    message.includes('insufficient funds') ||
    message.includes('sender doesn\'t have enough funds') ||
    err.code === 'INSUFFICIENT_FUNDS'
  ) {
    return new AppError('Insufficient funds for transaction', 400, true);
  }

  // Invalid address
  if (
    message.includes('invalid address') ||
    err.code === 'INVALID_ARGUMENT'
  ) {
    return new AppError('Invalid wallet address', 400, true);
  }

  // Network errors
  if (
    message.includes('network') ||
    err.code === 'NETWORK_ERROR' ||
    err.code === 'TIMEOUT'
  ) {
    return new AppError('Blockchain network error', 503, true, {
      reason: 'Network temporarily unavailable'
    });
  }

  // Gas estimation error
  if (message.includes('gas') || err.code === 'UNPREDICTABLE_GAS_LIMIT') {
    return new AppError('Transaction may fail', 400, true, {
      reason: 'Gas estimation failed'
    });
  }

  // Nonce error
  if (message.includes('nonce')) {
    return new AppError('Transaction nonce error', 400, true);
  }

  // Transaction reverted
  if (message.includes('revert')) {
    return new AppError('Transaction reverted', 400, true, {
      reason: err.reason || 'Contract execution failed'
    });
  }

  // Default blockchain error
  return new AppError('Blockchain operation failed', 500, true, {
    reason: message
  });
};

/**
 * Global error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
  // Normalize the error
  const error = normalizeError(err);

  // Log error details
  const logData = {
    error: error.message,
    statusCode: error.statusCode,
    path: req.path,
    method: req.method,
    user: req.user?.userId,
    ip: req.ip,
    userAgent: req.get('user-agent')
  };

  // Only log stack trace for non-operational errors or in development
  if (!error.isOperational || process.env.NODE_ENV === 'development') {
    logData.stack = error.stack;
    logData.originalError = err.originalError?.message;
  }

  // Log with appropriate level
  if (error.statusCode >= 500) {
    logger.error('Server error occurred:', logData);
  } else if (error.statusCode >= 400) {
    logger.warn('Client error occurred:', logData);
  } else {
    logger.info('Error occurred:', logData);
  }

  // Prepare error response
  const errorResponse = {
    success: false,
    error: {
      message: error.message,
      statusCode: error.statusCode
    }
  };

  // Add details if available
  if (error.details) {
    errorResponse.error.details = error.details;
  }

  // Add stack trace in development mode
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = error.stack;
    if (error.originalError) {
      errorResponse.error.originalError = error.originalError.message;
    }
  }

  // Set appropriate headers
  res.setHeader('Content-Type', 'application/json');

  // Send error response
  res.status(error.statusCode).json(errorResponse);
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
  const originalError = error.originalError;

  // Log the error
  logger.error('GraphQL error:', {
    message: error.message,
    path: error.path,
    extensions: error.extensions,
    originalError: originalError?.message
  });

  // If the original error is an AppError, format it appropriately
  if (originalError instanceof AppError) {
    return {
      message: originalError.message,
      extensions: {
        code: getGraphQLErrorCode(originalError.statusCode),
        statusCode: originalError.statusCode,
        ...(originalError.details && { details: originalError.details }),
        ...(process.env.NODE_ENV === 'development' && { stack: originalError.stack })
      },
      path: error.path,
      locations: error.locations
    };
  }

  // Handle database errors
  if (originalError?.code && typeof originalError.code === 'string') {
    const dbError = handleDatabaseError(originalError);
    return {
      message: dbError.message,
      extensions: {
        code: getGraphQLErrorCode(dbError.statusCode),
        statusCode: dbError.statusCode,
        ...(dbError.details && { details: dbError.details })
      },
      path: error.path
    };
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production') {
    if (
      error.message.includes('Database') ||
      error.message.includes('Internal') ||
      !originalError?.isOperational
    ) {
      return {
        message: 'An internal error occurred',
        extensions: {
          code: 'INTERNAL_SERVER_ERROR',
          statusCode: 500
        },
        path: error.path
      };
    }
  }

  // Return formatted error with additional context
  return {
    message: error.message,
    extensions: {
      code: error.extensions?.code || 'BAD_REQUEST',
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
        originalError: originalError?.message
      })
    },
    path: error.path,
    locations: error.locations
  };
};

/**
 * Maps HTTP status codes to GraphQL error codes
 */
const getGraphQLErrorCode = (statusCode) => {
  const codeMap = {
    400: 'BAD_USER_INPUT',
    401: 'UNAUTHENTICATED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'BAD_USER_INPUT',
    429: 'TOO_MANY_REQUESTS',
    500: 'INTERNAL_SERVER_ERROR',
    503: 'SERVICE_UNAVAILABLE'
  };

  return codeMap[statusCode] || 'INTERNAL_SERVER_ERROR';
};
