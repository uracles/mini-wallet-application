import authService from '../services/auth.service.js';
import logger from '../utils/logger.js';

/**
 * Middleware to authenticate requests using JWT
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        error: 'No authorization token provided'
      });
    }
    
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;
    
  
    const decoded = authService.verifyToken(token);
    
    req.user = {
      userId: decoded.userId,
      username: decoded.username
    };
    
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(401).json({
      error: 'Invalid or expired token'
    });
  }
};

/**
 * GraphQL context authentication
 */
export const authenticateGraphQL = async ({ req }) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return { user: null };
  }
  
  try {
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;
    
    const decoded = authService.verifyToken(token);
    
    return {
      user: {
        userId: decoded.userId,
        username: decoded.username
      }
    };
  } catch (error) {
    logger.error('GraphQL authentication error:', error);
    return { user: null };
  }
};

/**
 * Middleware to check if user is authenticated (for GraphQL)
 */
export const requireAuth = (context) => {
  if (!context.user) {
    throw new Error('Authentication required');
  }
  return context.user;
};
