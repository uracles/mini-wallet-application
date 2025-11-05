import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';
import { AppError } from '../utils/errors.js';
import userRepository from '../repositories/UserRepository.js';

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
      const existingUser = await userRepository.findByUsernamePublic(username);

      if (existingUser) {
        throw new AppError('Username already exists', 409, true);
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      // Create user
      const user = await userRepository.createUser(username, passwordHash);

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
      const user = await userRepository.findByUsername(username);

      if (!user) {
        throw new AppError('Invalid credentials', 401, true);
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        throw new AppError('Invalid credentials', 401, true);
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
      throw new AppError('Invalid or expired token', 401, true);  // CHANGED
    }
  }

  /**
   * Gets user by ID
   */
  async getUserById(userId) {
    try {
      return await userRepository.findByIdPublic(userId);
    } catch (error) {
      logger.error(`Error fetching user ${userId}:`, error);
      throw new AppError('Failed to fetch user', 500, false);
    }
  }

  /**
   * Changes user password
   */
  async changePassword(userId, oldPassword, newPassword) {
    try {
      // Get user
      const user = await userRepository.findByIdWithPassword(userId);

      if (!user) {
        throw new AppError('User not found', 404, true);
      }

      // Verify old password
      const isValidPassword = await bcrypt.compare(oldPassword, user.password_hash);

      if (!isValidPassword) {
        throw new AppError('Invalid old password', 401, true);
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

      // Update password
      await userRepository.updatePassword(userId, newPasswordHash);

      logger.info(`Password changed for user ${userId}`);

      return true;
    } catch (error) {
      logger.error('Error changing password:', error);
      throw error;
    }
  }
}

export default new AuthService();
