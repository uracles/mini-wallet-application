import { query } from '../config/database.js';
import { encrypt, decrypt } from '../utils/encryption.js';
import blockchainService from './blockchain.service.js';
import logger from '../utils/logger.js';

class WalletService {
  /**
   * Creates a new wallet for a user
   */
  async createWallet(userId, network = 'sepolia') {
    try {
      // Generate new wallet using blockchain service
      const walletData = await blockchainService.createWallet();
      
      // Encrypt private key before storing
      const encryptedPrivateKey = encrypt(walletData.privateKey);
      
      // Store wallet in database
      const result = await query(
        `INSERT INTO wallets (user_id, address, encrypted_private_key, network)
         VALUES ($1, $2, $3, $4)
         RETURNING id, user_id, address, network, created_at`,
        [userId, walletData.address, encryptedPrivateKey, network]
      );
      
      logger.info(`Wallet created for user ${userId}: ${walletData.address}`);
      
      return {
        ...result.rows[0],
        mnemonic: walletData.mnemonic // Return mnemonic only on creation (NEVER store it)
      };
    } catch (error) {
      logger.error('Error creating wallet:', error);
      throw new Error('Failed to create wallet');
    }
  }

  /**
   * Gets all wallets for a user
   */
  async getWalletsByUserId(userId) {
    try {
      const result = await query(
        `SELECT id, user_id, address, network, created_at, updated_at
         FROM wallets
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
      );
      
      return result.rows;
    } catch (error) {
      logger.error(`Error fetching wallets for user ${userId}:`, error);
      throw new Error('Failed to fetch wallets');
    }
  }

  /**
   * Gets a specific wallet by ID
   */
  async getWalletById(walletId, userId) {
    try {
      const result = await query(
        `SELECT id, user_id, address, network, created_at, updated_at
         FROM wallets
         WHERE id = $1 AND user_id = $2`,
        [walletId, userId]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      logger.error(`Error fetching wallet ${walletId}:`, error);
      throw new Error('Failed to fetch wallet');
    }
  }

  /**
   * Gets the balance of a wallet
   */
  async getBalance(walletId, userId) {
    try {
      const wallet = await this.getWalletById(walletId, userId);
      
      if (!wallet) {
        throw new Error('Wallet not found');
      }
      
      const balance = await blockchainService.getBalance(wallet.address);
      
      return {
        walletId: wallet.id,
        address: wallet.address,
        network: wallet.network,
        ...balance
      };
    } catch (error) {
      logger.error(`Error fetching balance for wallet ${walletId}:`, error);
      throw new Error(error.message || 'Failed to fetch balance');
    }
  }

  /**
   * Sends funds from a wallet
   */
  async sendFunds(walletId, userId, toAddress, amount) {
    try {
      // Get wallet with encrypted private key
      const result = await query(
        `SELECT id, user_id, address, encrypted_private_key, network
         FROM wallets
         WHERE id = $1 AND user_id = $2`,
        [walletId, userId]
      );
      
      if (result.rows.length === 0) {
        throw new Error('Wallet not found');
      }
      
      const wallet = result.rows[0];
      
      // Decrypt private key
      const privateKey = decrypt(wallet.encrypted_private_key);
      
      // Send transaction
      const txData = await blockchainService.sendTransaction(
        privateKey,
        toAddress,
        amount
      );
      
      // Store transaction in database
      const transaction = await this.storeTransaction(
        wallet.id,
        txData.hash,
        txData.from,
        txData.to,
        txData.amount,
        txData.maxFeePerGas,
        null // gasUsed will be updated later
      );
      
      logger.info(`Funds sent from wallet ${walletId}: ${txData.hash}`);
      
      // Start background process to update transaction status
      this.updateTransactionStatus(txData.hash).catch(err => 
        logger.error('Error updating transaction status:', err)
      );
      
      return {
        transaction,
        txData
      };
    } catch (error) {
      logger.error(`Error sending funds from wallet ${walletId}:`, error);
      throw new Error(error.message || 'Failed to send funds');
    }
  }

  /**
   * Stores a transaction in the database
   */
  async storeTransaction(walletId, hash, from, to, amount, gasPrice, gasUsed, status = 'pending') {
    try {
      const result = await query(
        `INSERT INTO transactions 
         (wallet_id, transaction_hash, from_address, to_address, amount, gas_price, gas_used, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [walletId, hash, from, to, amount, gasPrice, gasUsed, status]
      );
      
      return result.rows[0];
    } catch (error) {
      // If transaction already exists, just return it
      if (error.code === '23505') {
        const result = await query(
          'SELECT * FROM transactions WHERE transaction_hash = $1',
          [hash]
        );
        return result.rows[0];
      }
      
      logger.error('Error storing transaction:', error);
      throw new Error('Failed to store transaction');
    }
  }

  /**
   * Updates transaction status after confirmation
   */
  async updateTransactionStatus(transactionHash) {
    try {
      // Wait for transaction confirmation
      await blockchainService.waitForTransaction(transactionHash, 1);
      
      // Get updated transaction details
      const txDetails = await blockchainService.getTransaction(transactionHash);
      
      if (txDetails) {
        await query(
          `UPDATE transactions
           SET status = $1, gas_used = $2, block_number = $3, timestamp = $4
           WHERE transaction_hash = $5`,
          [
            txDetails.status,
            txDetails.gasUsed,
            txDetails.blockNumber,
            txDetails.timestamp,
            transactionHash
          ]
        );
        
        logger.info(`Transaction status updated: ${transactionHash} - ${txDetails.status}`);
      }
    } catch (error) {
      logger.error(`Error updating transaction status for ${transactionHash}:`, error);
    }
  }

  /**
   * Gets transaction history for a wallet
   */
  async getTransactionHistory(walletId, userId, limit = 10, offset = 0) {
    try {
      const wallet = await this.getWalletById(walletId, userId);
      
      if (!wallet) {
        throw new Error('Wallet not found');
      }
      
      // First, get transactions from blockchain
      const blockchainTxs = await blockchainService.getTransactionHistory(
        wallet.address,
        limit
      );
      
      // Store new transactions in database
      for (const tx of blockchainTxs) {
        try {
          await this.storeTransaction(
            wallet.id,
            tx.hash,
            tx.from,
            tx.to,
            tx.value,
            tx.gasPrice,
            tx.gasUsed,
            tx.status
          );
        } catch (error) {
          // Transaction might already exist, continue
          continue;
        }
      }
      
      // Get transactions from database
      const result = await query(
        `SELECT * FROM transactions
         WHERE wallet_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [walletId, limit, offset]
      );
      
      return result.rows;
    } catch (error) {
      logger.error(`Error fetching transaction history for wallet ${walletId}:`, error);
      throw new Error('Failed to fetch transaction history');
    }
  }

  /**
   * Gets a specific transaction
   */
  async getTransaction(transactionHash, userId) {
    try {
      const result = await query(
        `SELECT t.*, w.user_id
         FROM transactions t
         JOIN wallets w ON t.wallet_id = w.id
         WHERE t.transaction_hash = $1 AND w.user_id = $2`,
        [transactionHash, userId]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      logger.error(`Error fetching transaction ${transactionHash}:`, error);
      throw new Error('Failed to fetch transaction');
    }
  }
}

export default new WalletService();
