import BaseRepository from './BaseRepository.js';
import { query } from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Repository for wallet-related database operations
 */
class WalletRepository extends BaseRepository {
  constructor() {
    super('wallets');
  }

  /**
   * Creates a new wallet
   */
  async createWallet(userId, address, encryptedPrivateKey, network = 'sepolia') {
    try {
      const result = await this.execute(
        `INSERT INTO wallets (user_id, address, encrypted_private_key, network)
         VALUES ($1, $2, $3, $4)
         RETURNING id, user_id, address, network, created_at`,
        [userId, address, encryptedPrivateKey, network]
      );

      return result.rows[0];
    } catch (error) {
      logger.error('Error creating wallet in repository:', error);
      throw error;
    }
  }

  /**
   * Gets all wallets for a user
   */
  async findByUserId(userId) {
    try {
      const result = await this.execute(
        `SELECT id, user_id, address, network, created_at, updated_at
         FROM wallets
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
      );

      return result.rows;
    } catch (error) {
      logger.error(`Error fetching wallets for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Gets a specific wallet by ID and user ID
   */
  async findByIdAndUserId(walletId, userId) {
    try {
      const result = await this.execute(
        `SELECT id, user_id, address, network, created_at, updated_at
         FROM wallets
         WHERE id = $1 AND user_id = $2`,
        [walletId, userId]
      );

      return result.rows[0] || null;
    } catch (error) {
      logger.error(`Error fetching wallet ${walletId}:`, error);
      throw error;
    }
  }

  /**
   * Gets wallet with encrypted private key (for sending transactions)
   */
  async findWithPrivateKey(walletId, userId) {
    try {
      const result = await this.execute(
        `SELECT id, user_id, address, encrypted_private_key, network
         FROM wallets
         WHERE id = $1 AND user_id = $2`,
        [walletId, userId]
      );

      return result.rows[0] || null;
    } catch (error) {
      logger.error(`Error fetching wallet with private key ${walletId}:`, error);
      throw error;
    }
  }

  /**
   * Finds wallet by address
   */
  async findByAddress(address) {
    try {
      const result = await this.execute(
        `SELECT id, user_id, address, network, created_at, updated_at
         FROM wallets
         WHERE address = $1`,
        [address]
      );

      return result.rows[0] || null;
    } catch (error) {
      logger.error(`Error fetching wallet by address ${address}:`, error);
      throw error;
    }
  }

  /**
   * Gets all wallets by network
   */
  async findByNetwork(network) {
    try {
      const result = await this.execute(
        `SELECT id, user_id, address, network, created_at, updated_at
         FROM wallets
         WHERE network = $1
         ORDER BY created_at DESC`,
        [network]
      );

      return result.rows;
    } catch (error) {
      logger.error(`Error fetching wallets for network ${network}:`, error);
      throw error;
    }
  }

  /**
   * Counts wallets for a user
   */
  async countByUserId(userId) {
    try {
      const result = await this.execute(
        `SELECT COUNT(*) FROM wallets WHERE user_id = $1`,
        [userId]
      );

      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error(`Error counting wallets for user ${userId}:`, error);
      throw error;
    }
  }
}

export default new WalletRepository();
