import { errorHandler, notFoundHandler, asyncHandler, formatGraphQLError } from '../middleware/errorHandler.middleware.js';
import { AppError, DatabaseError, InternalServerError } from '../utils/errors.js';

describe('ErrorHandler Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      path: '/test',
      method: 'GET',
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('test-user-agent'),
      user: { userId: 1 }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn()
    };
    next = jest.fn();
  });

  describe('errorHandler', () => {
    test('should handle AppError correctly', () => {
      const error = new AppError('Test error', 400, true);

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Test error',
          statusCode: 400
        }
      });
    });

    test('should handle database duplicate error (23505)', () => {
      const error = new Error('Duplicate key');
      error.code = '23505';
      error.constraint = 'unique_username';
      error.detail = 'Key (username)=(test) already exists';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Resource already exists',
            statusCode: 409
          })
        })
      );
    });

    test('should handle database foreign key error (23503)', () => {
      const error = new Error('Foreign key violation');
      error.code = '23503';
      error.detail = 'Key is not present in table';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Related resource not found',
            statusCode: 404
          })
        })
      );
    });

    test('should handle JWT error', () => {
      const error = new Error('Invalid token');
      error.name = 'JsonWebTokenError';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Invalid token',
            statusCode: 401
          })
        })
      );
    });

    test('should handle token expired error', () => {
      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Token expired',
            statusCode: 401
          })
        })
      );
    });

    test('should handle blockchain insufficient funds error', () => {
      const error = new Error('insufficient funds for transaction');
      error.code = 'INSUFFICIENT_FUNDS';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Insufficient funds for transaction',
            statusCode: 400
          })
        })
      );
    });

    test('should handle blockchain invalid address error', () => {
      const error = new Error('invalid address');
      error.code = 'INVALID_ARGUMENT';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Invalid wallet address',
            statusCode: 400
          })
        })
      );
    });

    test('should include error details when present', () => {
      const error = new AppError('Validation error', 422, true, { field: 'username' });

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            details: { field: 'username' }
          })
        })
      );
    });

    test('should set Content-Type header', () => {
      const error = new AppError('Test error', 400);

      errorHandler(error, req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
    });

    test('should handle generic errors as internal server error', () => {
      const error = new Error('Unexpected error');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('notFoundHandler', () => {
    test('should return 404 response', () => {
      notFoundHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Not found',
        message: 'Route GET /test not found'
      });
    });

    test('should include correct method and path', () => {
      req.method = 'POST';
      req.path = '/api/users';

      notFoundHandler(req, res);

      expect(res.json).toHaveBeenCalledWith({
        error: 'Not found',
        message: 'Route POST /api/users not found'
      });
    });
  });

  describe('asyncHandler', () => {
    test('should call next with error on rejection', async () => {
      const error = new Error('Async error');
      const handler = asyncHandler(async () => {
        throw error;
      });

      await handler(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    test('should resolve successfully without calling next', async () => {
      const handler = asyncHandler(async (req, res) => {
        res.json({ success: true });
      });

      await handler(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ success: true });
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle synchronous errors', async () => {
      const error = new Error('Sync error');
      const handler = asyncHandler(() => {
        throw error;
      });

      await handler(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('formatGraphQLError', () => {
    test('should format AppError correctly', () => {
      const originalError = new AppError('Test error', 400, true);
      const graphqlError = {
        message: 'Test error',
        originalError,
        path: ['test', 'path'],
        locations: [{ line: 1, column: 1 }]
      };

      const result = formatGraphQLError(graphqlError);

      expect(result).toEqual({
        message: 'Test error',
        extensions: {
          code: 'BAD_USER_INPUT',
          statusCode: 400
        },
        path: ['test', 'path'],
        locations: [{ line: 1, column: 1 }]
      });
    });

    test('should include details when present', () => {
      const originalError = new AppError('Test error', 400, true, { field: 'username' });
      const graphqlError = {
        message: 'Test error',
        originalError,
        path: ['test']
      };

      const result = formatGraphQLError(graphqlError);

      expect(result.extensions).toHaveProperty('details', { field: 'username' });
    });

    test('should handle database errors', () => {
      const originalError = new Error('Duplicate');
      originalError.code = '23505';
      const graphqlError = {
        message: 'Database error',
        originalError,
        path: ['test']
      };

      const result = formatGraphQLError(graphqlError);

      expect(result).toEqual({
        message: 'Resource already exists',
        extensions: {
          code: 'CONFLICT',
          statusCode: 409
        },
        path: ['test']
      });
    });

    test('should handle 401 errors with UNAUTHENTICATED code', () => {
      const originalError = new AppError('Unauthorized', 401, true);
      const graphqlError = {
        message: 'Unauthorized',
        originalError,
        path: ['test']
      };

      const result = formatGraphQLError(graphqlError);

      expect(result.extensions.code).toBe('UNAUTHENTICATED');
    });

    test('should handle 404 errors with NOT_FOUND code', () => {
      const originalError = new AppError('Not found', 404, true);
      const graphqlError = {
        message: 'Not found',
        originalError,
        path: ['test']
      };

      const result = formatGraphQLError(graphqlError);

      expect(result.extensions.code).toBe('NOT_FOUND');
    });

    test('should handle 409 errors with CONFLICT code', () => {
      const originalError = new AppError('Conflict', 409, true);
      const graphqlError = {
        message: 'Conflict',
        originalError,
        path: ['test']
      };

      const result = formatGraphQLError(graphqlError);

      expect(result.extensions.code).toBe('CONFLICT');
    });

    test('should handle generic errors', () => {
      const graphqlError = {
        message: 'Generic error',
        path: ['test'],
        extensions: {}
      };

      const result = formatGraphQLError(graphqlError);

      expect(result).toHaveProperty('message', 'Generic error');
      expect(result.extensions).toHaveProperty('code', 'BAD_REQUEST');
    });
  });
});
