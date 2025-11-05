import BaseRepository from './BaseRepository.js';
import logger from '../utils/logger.js';

/**
 * Repository for user database operations
 */
class UserRepository extends BaseRepository {
  constructor() {
    super('users');
  }

  /**
   * Creates a new user
   */
  async createUser(username, passwordHash) {
    try {
      const result = await this.execute(
        `INSERT INTO users (username, password_hash)
         VALUES ($1, $2)
         RETURNING id, username, created_at`,
        [username, passwordHash]
      );

      return result.rows[0];
    } catch (error) {
      logger.error('Error creating user in repository:', error);
      throw error;
    }
  }

  /**
   * Finds a user by username
   */
  async findByUsername(username) {
    try {
      const result = await this.execute(
        'SELECT id, username, password_hash, created_at FROM users WHERE username = $1',
        [username]
      );

      return result.rows[0] || null;
    } catch (error) {
      logger.error(`Error fetching user by username ${username}:`, error);
      throw error;
    }
  }

  /**
   * Finds a user by username (without password hash)
   */
  async findByUsernamePublic(username) {
    try {
      const result = await this.execute(
        'SELECT id, username, created_at FROM users WHERE username = $1',
        [username]
      );

      return result.rows[0] || null;
    } catch (error) {
      logger.error(`Error fetching user by username ${username}:`, error);
      throw error;
    }
  }

  /**
   * Finds a user by ID (without password hash)
   */
  async findByIdPublic(userId) {
    try {
      const result = await this.execute(
        'SELECT id, username, created_at FROM users WHERE id = $1',
        [userId]
      );

      return result.rows[0] || null;
    } catch (error) {
      logger.error(`Error fetching user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Gets user with password hash (for authentication)
   */
  async findByIdWithPassword(userId) {
    try {
      const result = await this.execute(
        'SELECT id, username, password_hash, created_at FROM users WHERE id = $1',
        [userId]
      );

      return result.rows[0] || null;
    } catch (error) {
      logger.error(`Error fetching user with password ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Updates user password
   */
  async updatePassword(userId, newPasswordHash) {
    try {
      const result = await this.execute(
        'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, username, created_at',
        [newPasswordHash, userId]
      );

      return result.rows[0] || null;
    } catch (error) {
      logger.error(`Error updating password for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Checks if username exists
   */
  async usernameExists(username) {
    try {
      const result = await this.execute(
        'SELECT EXISTS(SELECT 1 FROM users WHERE username = $1)',
        [username]
      );

      return result.rows[0].exists;
    } catch (error) {
      logger.error(`Error checking if username exists ${username}:`, error);
      throw error;
    }
  }

  /**
   * Counts total users
   */
  async countUsers() {
    try {
      const result = await this.execute('SELECT COUNT(*) FROM users');
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error('Error counting users:', error);
      throw error;
    }
  }
}

export default new UserRepository();
