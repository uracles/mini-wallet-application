import BaseRepository from './BaseRepository.js';
import { query } from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Repository for transaction-related database operations
 */
class TransactionRepository extends BaseRepository {
  constructor() {
    super('transactions');
  }

  /**
   * Creates a new transaction
   */
  async createTransaction(walletId, hash, from, to, amount, gasPrice, gasUsed, status = 'pending') {
    try {
      const result = await this.execute(
        `INSERT INTO transactions
         (wallet_id, transaction_hash, from_address, to_address, amount, gas_price, gas_used, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [walletId, hash, from, to, amount, gasPrice, gasUsed, status]
      );

      return result.rows[0];
    } catch (error) {
      logger.error('Error creating transaction in repository:', error);
      throw error;
    }
  }

  /**
   * Finds transaction by hash
   */
  async findByHash(transactionHash) {
    try {
      const result = await this.execute(
        'SELECT * FROM transactions WHERE transaction_hash = $1',
        [transactionHash]
      );

      return result.rows[0] || null;
    } catch (error) {
      logger.error(`Error fetching transaction by hash ${transactionHash}:`, error);
      throw error;
    }
  }

  /**
   * Finds transaction by hash and user ID (with join)
   */
  async findByHashAndUserId(transactionHash, userId) {
    try {
      const result = await this.execute(
        `SELECT t.*, w.user_id
         FROM transactions t
         JOIN wallets w ON t.wallet_id = w.id
         WHERE t.transaction_hash = $1 AND w.user_id = $2`,
        [transactionHash, userId]
      );

      return result.rows[0] || null;
    } catch (error) {
      logger.error(`Error fetching transaction ${transactionHash}:`, error);
      throw error;
    }
  }

  /**
   * Gets transaction history for a wallet with pagination
   */
  async findByWalletId(walletId, limit = 10, offset = 0) {
    try {
      const result = await this.execute(
        `SELECT * FROM transactions
         WHERE wallet_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [walletId, limit, offset]
      );

      return result.rows;
    } catch (error) {
      logger.error(`Error fetching transaction history for wallet ${walletId}:`, error);
      throw error;
    }
  }

  /**
   * Updates transaction status and details
   */
  async updateTransactionStatus(transactionHash, status, gasUsed, blockNumber, timestamp) {
    try {
      const result = await this.execute(
        `UPDATE transactions
         SET status = $1, gas_used = $2, block_number = $3, timestamp = $4
         WHERE transaction_hash = $5
         RETURNING *`,
        [status, gasUsed, blockNumber, timestamp, transactionHash]
      );

      return result.rows[0] || null;
    } catch (error) {
      logger.error(`Error updating transaction status for ${transactionHash}:`, error);
      throw error;
    }
  }

  /**
   * Gets all transactions for a user (across all wallets)
   */
  async findByUserId(userId, limit = 10, offset = 0) {
    try {
      const result = await this.execute(
        `SELECT t.*
         FROM transactions t
         JOIN wallets w ON t.wallet_id = w.id
         WHERE w.user_id = $1
         ORDER BY t.created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      return result.rows;
    } catch (error) {
      logger.error(`Error fetching transactions for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Gets pending transactions
   */
  async findPendingTransactions(walletId = null) {
    try {
      let sql = `SELECT * FROM transactions WHERE status = 'pending'`;
      const params = [];

      if (walletId) {
        sql += ` AND wallet_id = $1`;
        params.push(walletId);
      }

      sql += ` ORDER BY created_at DESC`;

      const result = await this.execute(sql, params);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching pending transactions:', error);
      throw error;
    }
  }

  /**
   * Counts transactions for a wallet
   */
  async countByWalletId(walletId) {
    try {
      const result = await this.execute(
        `SELECT COUNT(*) FROM transactions WHERE wallet_id = $1`,
        [walletId]
      );

      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error(`Error counting transactions for wallet ${walletId}:`, error);
      throw error;
    }
  }

  /**
   * Gets transactions by status
   */
  async findByStatus(status, limit = 10, offset = 0) {
    try {
      const result = await this.execute(
        `SELECT * FROM transactions
         WHERE status = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [status, limit, offset]
      );

      return result.rows;
    } catch (error) {
      logger.error(`Error fetching transactions by status ${status}:`, error);
      throw error;
    }
  }
}

export default new TransactionRepository();
