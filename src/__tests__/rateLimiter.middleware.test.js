import {
  rateLimitMiddleware,
  authRateLimitMiddleware,
  transactionRateLimitMiddleware,
  graphqlRateLimitMiddleware
} from '../middleware/rateLimiter.middleware.js';

// Mock rate-limiter-flexible
jest.mock('rate-limiter-flexible', () => {
  return {
    RateLimiterMemory: jest.fn().mockImplementation(() => ({
      consume: jest.fn().mockResolvedValue(true)
    }))
  };
});

describe('RateLimiter Middleware', () => {
  let req, res, next;
  let mockConsume;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      ip: '127.0.0.1',
      connection: { remoteAddress: '127.0.0.1' },
      user: { userId: 1 }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();

    // Get the mocked consume function
    const { RateLimiterMemory } = require('rate-limiter-flexible');
    mockConsume = RateLimiterMemory.mock.results[0]?.value?.consume || jest.fn().mockResolvedValue(true);
  });

  describe('rateLimitMiddleware', () => {
    test('should call next when rate limit not exceeded', async () => {
      const { RateLimiterMemory } = require('rate-limiter-flexible');
      const instance = RateLimiterMemory.mock.results[0]?.value;
      if (instance) {
        instance.consume = jest.fn().mockResolvedValue(true);
      }

      await rateLimitMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should return 429 when rate limit exceeded', async () => {
      const { RateLimiterMemory } = require('rate-limiter-flexible');
      const instance = RateLimiterMemory.mock.results[0]?.value;

      const error = new Error('Rate limit exceeded');
      error.msBeforeNext = 60000;

      if (instance) {
        instance.consume = jest.fn().mockRejectedValue(error);
      }

      await rateLimitMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Too many requests',
        message: 'Please try again later',
        retryAfter: 60
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should use IP address as key', async () => {
      const { RateLimiterMemory } = require('rate-limiter-flexible');
      const instance = RateLimiterMemory.mock.results[0]?.value;
      const consumeMock = jest.fn().mockResolvedValue(true);

      if (instance) {
        instance.consume = consumeMock;
      }

      req.ip = '192.168.1.1';
      await rateLimitMiddleware(req, res, next);

      expect(consumeMock).toHaveBeenCalledWith('192.168.1.1');
    });

    test('should fallback to remoteAddress when ip is not available', async () => {
      const { RateLimiterMemory } = require('rate-limiter-flexible');
      const instance = RateLimiterMemory.mock.results[0]?.value;
      const consumeMock = jest.fn().mockResolvedValue(true);

      if (instance) {
        instance.consume = consumeMock;
      }

      req.ip = null;
      req.connection.remoteAddress = '10.0.0.1';

      await rateLimitMiddleware(req, res, next);

      expect(consumeMock).toHaveBeenCalledWith('10.0.0.1');
    });

    test('should use default retryAfter when msBeforeNext not provided', async () => {
      const { RateLimiterMemory } = require('rate-limiter-flexible');
      const instance = RateLimiterMemory.mock.results[0]?.value;

      const error = new Error('Rate limit exceeded');

      if (instance) {
        instance.consume = jest.fn().mockRejectedValue(error);
      }

      await rateLimitMiddleware(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          retryAfter: 60
        })
      );
    });
  });

  describe('authRateLimitMiddleware', () => {
    test('should call next when auth rate limit not exceeded', async () => {
      const { RateLimiterMemory } = require('rate-limiter-flexible');
      const instance = RateLimiterMemory.mock.results[1]?.value;
      if (instance) {
        instance.consume = jest.fn().mockResolvedValue(true);
      }

      await authRateLimitMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should return 429 when auth rate limit exceeded', async () => {
      const { RateLimiterMemory } = require('rate-limiter-flexible');
      const instance = RateLimiterMemory.mock.results[1]?.value;

      const error = new Error('Rate limit exceeded');
      error.msBeforeNext = 900000;

      if (instance) {
        instance.consume = jest.fn().mockRejectedValue(error);
      }

      await authRateLimitMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Too many authentication attempts',
        message: 'Please try again later',
        retryAfter: 900
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should use default retryAfter of 900 for auth', async () => {
      const { RateLimiterMemory } = require('rate-limiter-flexible');
      const instance = RateLimiterMemory.mock.results[1]?.value;

      const error = new Error('Rate limit exceeded');

      if (instance) {
        instance.consume = jest.fn().mockRejectedValue(error);
      }

      await authRateLimitMiddleware(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          retryAfter: 900
        })
      );
    });
  });

  describe('transactionRateLimitMiddleware', () => {
    test('should call next when transaction rate limit not exceeded', async () => {
      const { RateLimiterMemory } = require('rate-limiter-flexible');
      const instance = RateLimiterMemory.mock.results[2]?.value;
      if (instance) {
        instance.consume = jest.fn().mockResolvedValue(true);
      }

      await transactionRateLimitMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should return 429 when transaction rate limit exceeded', async () => {
      const { RateLimiterMemory } = require('rate-limiter-flexible');
      const instance = RateLimiterMemory.mock.results[2]?.value;

      const error = new Error('Rate limit exceeded');
      error.msBeforeNext = 3600000;

      if (instance) {
        instance.consume = jest.fn().mockRejectedValue(error);
      }

      await transactionRateLimitMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Too many transactions',
        message: 'Transaction limit exceeded. Please try again later',
        retryAfter: 3600
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should use userId as key when available', async () => {
      const { RateLimiterMemory } = require('rate-limiter-flexible');
      const instance = RateLimiterMemory.mock.results[2]?.value;
      const consumeMock = jest.fn().mockResolvedValue(true);

      if (instance) {
        instance.consume = consumeMock;
      }

      req.user = { userId: 123 };
      await transactionRateLimitMiddleware(req, res, next);

      expect(consumeMock).toHaveBeenCalledWith(123);
    });

    test('should fallback to IP when userId not available', async () => {
      const { RateLimiterMemory } = require('rate-limiter-flexible');
      const instance = RateLimiterMemory.mock.results[2]?.value;
      const consumeMock = jest.fn().mockResolvedValue(true);

      if (instance) {
        instance.consume = consumeMock;
      }

      req.user = null;
      req.ip = '192.168.1.1';

      await transactionRateLimitMiddleware(req, res, next);

      expect(consumeMock).toHaveBeenCalledWith('192.168.1.1');
    });
  });

  describe('graphqlRateLimitMiddleware', () => {
    test('should call resolve when rate limit not exceeded', async () => {
      const { RateLimiterMemory } = require('rate-limiter-flexible');
      const instance = RateLimiterMemory.mock.results[0]?.value;
      if (instance) {
        instance.consume = jest.fn().mockResolvedValue(true);
      }

      const resolve = jest.fn().mockResolvedValue({ data: 'test' });
      const parent = {};
      const args = {};
      const context = { user: { userId: 1 }, req: { ip: '127.0.0.1' } };
      const info = {};

      const middleware = graphqlRateLimitMiddleware(1);
      const result = await middleware(resolve, parent, args, context, info);

      expect(resolve).toHaveBeenCalledWith(parent, args, context, info);
      expect(result).toEqual({ data: 'test' });
    });

    test('should throw error when rate limit exceeded', async () => {
      const { RateLimiterMemory } = require('rate-limiter-flexible');
      const instance = RateLimiterMemory.mock.results[0]?.value;

      const error = new Error('Rate limit exceeded');

      if (instance) {
        instance.consume = jest.fn().mockRejectedValue(error);
      }

      const resolve = jest.fn();
      const context = { user: { userId: 1 }, req: { ip: '127.0.0.1' } };

      const middleware = graphqlRateLimitMiddleware(1);

      await expect(
        middleware(resolve, {}, {}, context, {})
      ).rejects.toThrow('Rate limit exceeded. Please try again later.');

      expect(resolve).not.toHaveBeenCalled();
    });

    test('should use custom points cost', async () => {
      const { RateLimiterMemory } = require('rate-limiter-flexible');
      const instance = RateLimiterMemory.mock.results[0]?.value;
      const consumeMock = jest.fn().mockResolvedValue(true);

      if (instance) {
        instance.consume = consumeMock;
      }

      const resolve = jest.fn().mockResolvedValue({});
      const context = { user: { userId: 1 }, req: { ip: '127.0.0.1' } };

      const middleware = graphqlRateLimitMiddleware(5);
      await middleware(resolve, {}, {}, context, {});

      expect(consumeMock).toHaveBeenCalledWith(1, 5);
    });

    test('should use IP when user not authenticated', async () => {
      const { RateLimiterMemory } = require('rate-limiter-flexible');
      const instance = RateLimiterMemory.mock.results[0]?.value;
      const consumeMock = jest.fn().mockResolvedValue(true);

      if (instance) {
        instance.consume = consumeMock;
      }

      const resolve = jest.fn().mockResolvedValue({});
      const context = { user: null, req: { ip: '192.168.1.100' } };

      const middleware = graphqlRateLimitMiddleware(1);
      await middleware(resolve, {}, {}, context, {});

      expect(consumeMock).toHaveBeenCalledWith('192.168.1.100', 1);
    });
  });
});
