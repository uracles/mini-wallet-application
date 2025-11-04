/**
 * Base Application Error class
 */
class AppError extends Error {
  constructor(message, statusCode, isOperational = true, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 Bad Request - Client sent invalid data
 */
class BadRequestError extends AppError {
  constructor(message = 'Bad request', details = null) {
    super(message, 400, true, details);
  }
}

/**
 * 401 Unauthorized - Authentication required
 */
class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, true);
  }
}

/**
 * 403 Forbidden - User doesn't have permission
 */
class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden') {
    super(message, 403, true);
  }
}

/**
 * 404 Not Found - Resource not found
 */
class NotFoundError extends AppError {
  constructor(message = 'Resource not found', resource = null) {
    const details = resource ? { resource } : null;
    super(message, 404, true, details);
  }
}

/**
 * 409 Conflict - Resource already exists or conflict
 */
class ConflictError extends AppError {
  constructor(message = 'Resource conflict', details = null) {
    super(message, 409, true, details);
  }
}

/**
 * 422 Unprocessable Entity - Validation failed
 */
class ValidationError extends AppError {
  constructor(message = 'Validation failed', errors = []) {
    super(message, 422, true, { errors });
  }
}

/**
 * 429 Too Many Requests - Rate limit exceeded
 */
class RateLimitError extends AppError {
  constructor(message = 'Too many requests', retryAfter = null) {
    const details = retryAfter ? { retryAfter } : null;
    super(message, 429, true, details);
  }
}

/**
 * 500 Internal Server Error - Database or system error
 */
class InternalServerError extends AppError {
  constructor(message = 'Internal server error', isOperational = false) {
    super(message, 500, isOperational);
  }
}

/**
 * 503 Service Unavailable - External service down
 */
class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable', service = null) {
    const details = service ? { service } : null;
    super(message, 503, true, details);
  }
}

/**
 * Database Error - Wrapper for database errors
 */
class DatabaseError extends InternalServerError {
  constructor(message = 'Database error', originalError = null) {
    super(message, false);
    this.originalError = originalError;
  }
}

/**
 * Blockchain Error - Wrapper for blockchain errors
 */
class BlockchainError extends AppError {
  constructor(message = 'Blockchain operation failed', statusCode = 500, details = null) {
    super(message, statusCode, true, details);
  }
}

/**
 * Insufficient Funds Error
 */
class InsufficientFundsError extends BadRequestError {
  constructor(message = 'Insufficient funds', required = null, available = null) {
    const details = required && available ? { required, available } : null;
    super(message, details);
  }
}

/**
 * Invalid Address Error
 */
class InvalidAddressError extends BadRequestError {
  constructor(message = 'Invalid wallet address', address = null) {
    const details = address ? { address } : null;
    super(message, details);
  }
}

/**
 * Transaction Error
 */
class TransactionError extends AppError {
  constructor(message = 'Transaction failed', details = null) {
    super(message, 400, true, details);
  }
}

export {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RateLimitError,
  InternalServerError,
  ServiceUnavailableError,
  DatabaseError,
  BlockchainError,
  InsufficientFundsError,
  InvalidAddressError,
  TransactionError
};
