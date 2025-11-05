import {
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
} from '../utils/errors.js';

describe('Error Classes', () => {
  describe('AppError', () => {
    test('should create error with correct properties', () => {
      const error = new AppError('Test error', 400, true, { field: 'test' });

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
      expect(error.details).toEqual({ field: 'test' });
      expect(error.name).toBe('AppError');
      expect(error.stack).toBeDefined();
    });

    test('should have default isOperational as true', () => {
      const error = new AppError('Test error', 400);

      expect(error.isOperational).toBe(true);
    });

    test('should have null details by default', () => {
      const error = new AppError('Test error', 400);

      expect(error.details).toBeNull();
    });
  });

  describe('BadRequestError', () => {
    test('should create 400 error', () => {
      const error = new BadRequestError('Invalid input');

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Invalid input');
      expect(error.isOperational).toBe(true);
      expect(error.name).toBe('BadRequestError');
    });

    test('should use default message', () => {
      const error = new BadRequestError();

      expect(error.message).toBe('Bad request');
    });

    test('should include details', () => {
      const error = new BadRequestError('Invalid input', { field: 'username' });

      expect(error.details).toEqual({ field: 'username' });
    });
  });

  describe('UnauthorizedError', () => {
    test('should create 401 error', () => {
      const error = new UnauthorizedError('Token expired');

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Token expired');
      expect(error.isOperational).toBe(true);
      expect(error.name).toBe('UnauthorizedError');
    });

    test('should use default message', () => {
      const error = new UnauthorizedError();

      expect(error.message).toBe('Authentication required');
    });
  });

  describe('ForbiddenError', () => {
    test('should create 403 error', () => {
      const error = new ForbiddenError('Access denied');

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Access denied');
      expect(error.isOperational).toBe(true);
      expect(error.name).toBe('ForbiddenError');
    });

    test('should use default message', () => {
      const error = new ForbiddenError();

      expect(error.message).toBe('Access forbidden');
    });
  });

  describe('NotFoundError', () => {
    test('should create 404 error', () => {
      const error = new NotFoundError('User not found');

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('User not found');
      expect(error.isOperational).toBe(true);
      expect(error.name).toBe('NotFoundError');
    });

    test('should use default message', () => {
      const error = new NotFoundError();

      expect(error.message).toBe('Resource not found');
    });

    test('should include resource in details', () => {
      const error = new NotFoundError('User not found', 'user');

      expect(error.details).toEqual({ resource: 'user' });
    });
  });

  describe('ConflictError', () => {
    test('should create 409 error', () => {
      const error = new ConflictError('Username already exists');

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(409);
      expect(error.message).toBe('Username already exists');
      expect(error.isOperational).toBe(true);
      expect(error.name).toBe('ConflictError');
    });

    test('should use default message', () => {
      const error = new ConflictError();

      expect(error.message).toBe('Resource conflict');
    });

    test('should include details', () => {
      const error = new ConflictError('Conflict', { field: 'email' });

      expect(error.details).toEqual({ field: 'email' });
    });
  });

  describe('ValidationError', () => {
    test('should create 422 error', () => {
      const errors = [{ field: 'username', message: 'Required' }];
      const error = new ValidationError('Validation failed', errors);

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(422);
      expect(error.message).toBe('Validation failed');
      expect(error.isOperational).toBe(true);
      expect(error.details).toEqual({ errors });
      expect(error.name).toBe('ValidationError');
    });

    test('should use default message', () => {
      const error = new ValidationError();

      expect(error.message).toBe('Validation failed');
    });

    test('should handle empty errors array', () => {
      const error = new ValidationError('Validation failed', []);

      expect(error.details).toEqual({ errors: [] });
    });
  });

  describe('RateLimitError', () => {
    test('should create 429 error', () => {
      const error = new RateLimitError('Too many requests', 60);

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(429);
      expect(error.message).toBe('Too many requests');
      expect(error.isOperational).toBe(true);
      expect(error.details).toEqual({ retryAfter: 60 });
      expect(error.name).toBe('RateLimitError');
    });

    test('should use default message', () => {
      const error = new RateLimitError();

      expect(error.message).toBe('Too many requests');
    });

    test('should handle null retryAfter', () => {
      const error = new RateLimitError('Too many requests', null);

      expect(error.details).toBeNull();
    });
  });

  describe('InternalServerError', () => {
    test('should create 500 error', () => {
      const error = new InternalServerError('Server error');

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Server error');
      expect(error.isOperational).toBe(false);
      expect(error.name).toBe('InternalServerError');
    });

    test('should use default message', () => {
      const error = new InternalServerError();

      expect(error.message).toBe('Internal server error');
    });

    test('should allow setting isOperational', () => {
      const error = new InternalServerError('Error', true);

      expect(error.isOperational).toBe(true);
    });
  });

  describe('ServiceUnavailableError', () => {
    test('should create 503 error', () => {
      const error = new ServiceUnavailableError('Service down', 'blockchain');

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(503);
      expect(error.message).toBe('Service down');
      expect(error.isOperational).toBe(true);
      expect(error.details).toEqual({ service: 'blockchain' });
      expect(error.name).toBe('ServiceUnavailableError');
    });

    test('should use default message', () => {
      const error = new ServiceUnavailableError();

      expect(error.message).toBe('Service temporarily unavailable');
    });

    test('should handle null service', () => {
      const error = new ServiceUnavailableError('Service down', null);

      expect(error.details).toBeNull();
    });
  });

  describe('DatabaseError', () => {
    test('should create database error', () => {
      const originalError = new Error('Connection failed');
      const error = new DatabaseError('Database error', originalError);

      expect(error).toBeInstanceOf(InternalServerError);
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Database error');
      expect(error.isOperational).toBe(false);
      expect(error.originalError).toBe(originalError);
      expect(error.name).toBe('DatabaseError');
    });

    test('should use default message', () => {
      const error = new DatabaseError();

      expect(error.message).toBe('Database error');
    });

    test('should handle null original error', () => {
      const error = new DatabaseError('Database error', null);

      expect(error.originalError).toBeNull();
    });
  });

  describe('BlockchainError', () => {
    test('should create blockchain error', () => {
      const error = new BlockchainError('Transaction failed', 500, { reason: 'Gas too low' });

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Transaction failed');
      expect(error.isOperational).toBe(true);
      expect(error.details).toEqual({ reason: 'Gas too low' });
      expect(error.name).toBe('BlockchainError');
    });

    test('should use default message and status code', () => {
      const error = new BlockchainError();

      expect(error.message).toBe('Blockchain operation failed');
      expect(error.statusCode).toBe(500);
    });
  });

  describe('InsufficientFundsError', () => {
    test('should create insufficient funds error', () => {
      const error = new InsufficientFundsError('Not enough ETH', '1.0', '0.5');

      expect(error).toBeInstanceOf(BadRequestError);
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Not enough ETH');
      expect(error.details).toEqual({ required: '1.0', available: '0.5' });
      expect(error.name).toBe('InsufficientFundsError');
    });

    test('should use default message', () => {
      const error = new InsufficientFundsError();

      expect(error.message).toBe('Insufficient funds');
    });

    test('should handle missing amounts', () => {
      const error = new InsufficientFundsError('Not enough ETH', null, null);

      expect(error.details).toBeNull();
    });
  });

  describe('InvalidAddressError', () => {
    test('should create invalid address error', () => {
      const error = new InvalidAddressError('Bad address format', '0xinvalid');

      expect(error).toBeInstanceOf(BadRequestError);
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Bad address format');
      expect(error.details).toEqual({ address: '0xinvalid' });
      expect(error.name).toBe('InvalidAddressError');
    });

    test('should use default message', () => {
      const error = new InvalidAddressError();

      expect(error.message).toBe('Invalid wallet address');
    });

    test('should handle null address', () => {
      const error = new InvalidAddressError('Bad address', null);

      expect(error.details).toBeNull();
    });
  });

  describe('TransactionError', () => {
    test('should create transaction error', () => {
      const error = new TransactionError('Transaction reverted', { reason: 'Out of gas' });

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Transaction reverted');
      expect(error.isOperational).toBe(true);
      expect(error.details).toEqual({ reason: 'Out of gas' });
      expect(error.name).toBe('TransactionError');
    });

    test('should use default message', () => {
      const error = new TransactionError();

      expect(error.message).toBe('Transaction failed');
    });

    test('should handle null details', () => {
      const error = new TransactionError('Transaction failed', null);

      expect(error.details).toBeNull();
    });
  });
});
