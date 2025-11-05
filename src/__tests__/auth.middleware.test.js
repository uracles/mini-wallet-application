import { authenticate, authenticateGraphQL, requireAuth } from '../middleware/auth.middleware.js';
import authService from '../services/auth.service.js';

// Mock dependencies
jest.mock('../services/auth.service.js');

describe('Auth Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    test('should authenticate valid token', async () => {
      const req = {
        headers: {
          authorization: 'Bearer valid_token_123'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      const decodedToken = {
        userId: 1,
        username: 'testuser'
      };

      authService.verifyToken.mockReturnValue(decodedToken);

      await authenticate(req, res, next);

      expect(authService.verifyToken).toHaveBeenCalledWith('valid_token_123');
      expect(req.user).toEqual({
        userId: 1,
        username: 'testuser'
      });
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should authenticate token without Bearer prefix', async () => {
      const req = {
        headers: {
          authorization: 'valid_token_123'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      const decodedToken = {
        userId: 1,
        username: 'testuser'
      };

      authService.verifyToken.mockReturnValue(decodedToken);

      await authenticate(req, res, next);

      expect(authService.verifyToken).toHaveBeenCalledWith('valid_token_123');
      expect(next).toHaveBeenCalled();
    });

    test('should return 401 when no authorization header', async () => {
      const req = {
        headers: {}
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No authorization token provided'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 401 when token is invalid', async () => {
      const req = {
        headers: {
          authorization: 'Bearer invalid_token'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      authService.verifyToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid or expired token'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 401 when token is expired', async () => {
      const req = {
        headers: {
          authorization: 'Bearer expired_token'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      authService.verifyToken.mockImplementation(() => {
        const error = new Error('Token expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid or expired token'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('authenticateGraphQL', () => {
    test('should authenticate valid token for GraphQL', async () => {
      const req = {
        headers: {
          authorization: 'Bearer valid_token_123'
        }
      };

      const decodedToken = {
        userId: 1,
        username: 'testuser'
      };

      authService.verifyToken.mockReturnValue(decodedToken);

      const result = await authenticateGraphQL({ req });

      expect(authService.verifyToken).toHaveBeenCalledWith('valid_token_123');
      expect(result).toEqual({
        user: {
          userId: 1,
          username: 'testuser'
        }
      });
    });

    test('should authenticate token without Bearer prefix for GraphQL', async () => {
      const req = {
        headers: {
          authorization: 'valid_token_123'
        }
      };

      const decodedToken = {
        userId: 1,
        username: 'testuser'
      };

      authService.verifyToken.mockReturnValue(decodedToken);

      const result = await authenticateGraphQL({ req });

      expect(authService.verifyToken).toHaveBeenCalledWith('valid_token_123');
      expect(result.user).toBeDefined();
    });

    test('should return null user when no authorization header', async () => {
      const req = {
        headers: {}
      };

      const result = await authenticateGraphQL({ req });

      expect(result).toEqual({ user: null });
      expect(authService.verifyToken).not.toHaveBeenCalled();
    });

    test('should return null user when token is invalid', async () => {
      const req = {
        headers: {
          authorization: 'Bearer invalid_token'
        }
      };

      authService.verifyToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = await authenticateGraphQL({ req });

      expect(result).toEqual({ user: null });
    });

    test('should return null user when token verification fails', async () => {
      const req = {
        headers: {
          authorization: 'Bearer malformed_token'
        }
      };

      authService.verifyToken.mockImplementation(() => {
        throw new Error('Token verification failed');
      });

      const result = await authenticateGraphQL({ req });

      expect(result).toEqual({ user: null });
    });
  });

  describe('requireAuth', () => {
    test('should return user when authenticated', () => {
      const context = {
        user: {
          userId: 1,
          username: 'testuser'
        }
      };

      const result = requireAuth(context);

      expect(result).toEqual({
        userId: 1,
        username: 'testuser'
      });
    });

    test('should throw error when user not authenticated', () => {
      const context = {
        user: null
      };

      expect(() => requireAuth(context)).toThrow('Authentication required');
    });

    test('should throw error when user is undefined', () => {
      const context = {};

      expect(() => requireAuth(context)).toThrow('Authentication required');
    });
  });
});
