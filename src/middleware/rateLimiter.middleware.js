import { RateLimiterMemory } from 'rate-limiter-flexible';
import logger from '../utils/logger.js';

// Rate limiter for general API requests
const rateLimiter = new RateLimiterMemory({
  points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS) / 1000 || 900, // 15 minutes
  blockDuration: 60, // Block for 1 minute if exceeded
});

// Stricter rate limiter for authentication endpoints
const authRateLimiter = new RateLimiterMemory({
  points: 5, // 5 attempts
  duration: 900, // Per 15 minutes
  blockDuration: 900, // Block for 15 minutes
});

// Rate limiter for transaction endpoints
const transactionRateLimiter = new RateLimiterMemory({
  points: 10, // 10 transactions
  duration: 3600, // Per hour
  blockDuration: 3600, // Block for 1 hour
});

/**
 * General rate limiting middleware
 */
export const rateLimitMiddleware = async (req, res, next) => {
  try {
    const key = req.ip || req.connection.remoteAddress;
    await rateLimiter.consume(key);
    next();
  } catch (error) {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many requests',
      message: 'Please try again later',
      retryAfter: error.msBeforeNext ? Math.ceil(error.msBeforeNext / 1000) : 60
    });
  }
};

/**
 * Authentication endpoint rate limiting
 */
export const authRateLimitMiddleware = async (req, res, next) => {
  try {
    const key = req.ip || req.connection.remoteAddress;
    await authRateLimiter.consume(key);
    next();
  } catch (error) {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many authentication attempts',
      message: 'Please try again later',
      retryAfter: error.msBeforeNext ? Math.ceil(error.msBeforeNext / 1000) : 900
    });
  }
};

/**
 * Transaction endpoint rate limiting
 */
export const transactionRateLimitMiddleware = async (req, res, next) => {
  try {
    const key = req.user?.userId || req.ip;
    await transactionRateLimiter.consume(key);
    next();
  } catch (error) {
    logger.warn(`Transaction rate limit exceeded for user/IP: ${req.user?.userId || req.ip}`);
    res.status(429).json({
      error: 'Too many transactions',
      message: 'Transaction limit exceeded. Please try again later',
      retryAfter: error.msBeforeNext ? Math.ceil(error.msBeforeNext / 1000) : 3600
    });
  }
};

/**
 * GraphQL rate limiting
 */
export const graphqlRateLimitMiddleware = (pointsCost = 1) => {
  return async (resolve, parent, args, context, info) => {
    try {
      const key = context.user?.userId || context.req.ip;
      await rateLimiter.consume(key, pointsCost);
      return resolve(parent, args, context, info);
    } catch (error) {
      logger.warn(`GraphQL rate limit exceeded for user/IP: ${context.user?.userId || context.req.ip}`);
      throw new Error('Rate limit exceeded. Please try again later.');
    }
  };
};
