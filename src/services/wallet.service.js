import { encrypt, decrypt } from '../utils/encryption.js';
import blockchainService from './blockchain.service.js';
import logger from '../utils/logger.js';
import walletRepository from '../repositories/WalletRepository.js';
import transactionRepository from '../repositories/TransactionRepository.js';

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

      // Store wallet in database using repository
      const wallet = await walletRepository.createWallet(
        userId,
        walletData.address,
        encryptedPrivateKey,
        network
      );

      logger.info(`Wallet created for user ${userId}: ${walletData.address}`);

      return {
        ...wallet,
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
      return await walletRepository.findByUserId(userId);
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
      return await walletRepository.findByIdAndUserId(walletId, userId);
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
      // Get wallet with encrypted private key using repository
      const wallet = await walletRepository.findWithPrivateKey(walletId, userId);

      if (!wallet) {
        throw new Error('Wallet not found');
      }

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
      return await transactionRepository.createTransaction(
        walletId,
        hash,
        from,
        to,
        amount,
        gasPrice,
        gasUsed,
        status
      );
    } catch (error) {
      // If transaction already exists, just return it
      if (error.code === '23505') {
        return await transactionRepository.findByHash(hash);
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
        await transactionRepository.updateTransactionStatus(
          transactionHash,
          txDetails.status,
          txDetails.gasUsed,
          txDetails.blockNumber,
          txDetails.timestamp
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

      // Get transactions from database using repository
      return await transactionRepository.findByWalletId(walletId, limit, offset);
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
      return await transactionRepository.findByHashAndUserId(transactionHash, userId);
    } catch (error) {
      logger.error(`Error fetching transaction ${transactionHash}:`, error);
      throw new Error('Failed to fetch transaction');
    }
  }
}

export default new WalletService();
