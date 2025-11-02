import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';
import logger from '../utils/logger.js';

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

class AuthService {
  /**
   * Registers a new user
   */
  async register(username, password) {
    try {
      // Check if user already exists
      const existingUser = await query(
        'SELECT id FROM users WHERE username = $1',
        [username]
      );
      
      if (existingUser.rows.length > 0) {
        throw new Error('Username already exists');
      }
      
      // Hash password
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      
      // Create user
      const result = await query(
        `INSERT INTO users (username, password_hash)
         VALUES ($1, $2)
         RETURNING id, username, created_at`,
        [username, passwordHash]
      );
      
      const user = result.rows[0];
      
      // Generate JWT token
      const token = this.generateToken(user.id, username);
      
      logger.info(`User registered: ${username}`);
      
      return {
        user: {
          id: user.id,
          username: user.username,
          createdAt: user.created_at
        },
        token
      };
    } catch (error) {
      logger.error('Error during registration:', error);
      throw error;
    }
  }

  /**
   * Authenticates a user
   */
  async login(username, password) {
    try {
      // Get user
      const result = await query(
        'SELECT id, username, password_hash, created_at FROM users WHERE username = $1',
        [username]
      );
      
      if (result.rows.length === 0) {
        throw new Error('Invalid credentials');
      }
      
      const user = result.rows[0];
      
      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }
      
      // Generate JWT token
      const token = this.generateToken(user.id, username);
      
      logger.info(`User logged in: ${username}`);
      
      return {
        user: {
          id: user.id,
          username: user.username,
          createdAt: user.created_at
        },
        token
      };
    } catch (error) {
      logger.error('Error during login:', error);
      throw error;
    }
  }

  /**
   * Generates a JWT token
   */
  generateToken(userId, username) {
    return jwt.sign(
      { userId, username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  /**
   * Verifies a JWT token
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      logger.error('Invalid token:', error.message);
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Gets user by ID
   */
  async getUserById(userId) {
    try {
      const result = await query(
        'SELECT id, username, created_at FROM users WHERE id = $1',
        [userId]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      logger.error(`Error fetching user ${userId}:`, error);
      throw new Error('Failed to fetch user');
    }
  }

  /**
   * Changes user password
   */
  async changePassword(userId, oldPassword, newPassword) {
    try {
      // Get user
      const result = await query(
        'SELECT password_hash FROM users WHERE id = $1',
        [userId]
      );
      
      if (result.rows.length === 0) {
        throw new Error('User not found');
      }
      
      const user = result.rows[0];
      
      // Verify old password
      const isValidPassword = await bcrypt.compare(oldPassword, user.password_hash);
      
      if (!isValidPassword) {
        throw new Error('Invalid old password');
      }
      
      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
      
      // Update password
      await query(
        'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newPasswordHash, userId]
      );
      
      logger.info(`Password changed for user ${userId}`);
      
      return true;
    } catch (error) {
      logger.error('Error changing password:', error);
      throw error;
    }
  }
}

export default new AuthService();
