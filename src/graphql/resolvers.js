import authService from '../services/auth.service.js';
import walletService from '../services/wallet.service.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate, schemas } from '../utils/validation.js';
import logger from '../utils/logger.js';
import { AppError } from '../utils/errors.js';
import { formatDate } from '../utils/dateFormatter.js';

export const resolvers = {
  Query: {
    /**
     * Get current authenticated user
     */
    me: async (_, __, context) => {
      const user = requireAuth(context);
      
      const userData = await authService.getUserById(user.userId);
      
      if (!userData) {
        throw new AppError('User not found', 404, true);
      }
      
      return {
        id: userData.id,
        username: userData.username,
        createdAt: formatDate(userData.created_at)
      };
    },

    /**
     * Get all wallets for authenticated user
     */
    wallets: async (_, __, context) => {
      const user = requireAuth(context);
      
      const wallets = await walletService.getWalletsByUserId(user.userId);
      
      return wallets.map(wallet => ({
        id: wallet.id,
        userId: wallet.user_id,
        address: wallet.address,
        network: wallet.network,
        createdAt: formatDate(wallet.created_at),
        updatedAt: formatDate(wallet.updated_at)
      }));
    },

    /**
     * Get a specific wallet
     */
    wallet: async (_, { id }, context) => {
      const user = requireAuth(context);
      
      const wallet = await walletService.getWalletById(id, user.userId);
      
      if (!wallet) {
        throw new AppError('Wallet not found', 404, true);
      }
      
      return {
        id: wallet.id,
        userId: wallet.user_id,
        address: wallet.address,
        network: wallet.network,
        createdAt: formatDate(wallet.created_at),
        updatedAt: formatDate(wallet.updated_at)
      };
    },

    /**
     * Get wallet balance
     */
    balance: async (_, { walletId }, context) => {
      const user = requireAuth(context);
      
      // Validate input
      const validation = validate(schemas.getBalance, { walletId });
      if (!validation.valid) {
        throw new AppError(validation.errors.map(e => e.message).join(', '), 400, true);
      }
      
      const balance = await walletService.getBalance(walletId, user.userId);
      
      return balance;
    },

    /**
     * Get transaction history
     */
    transactions: async (_, { walletId, limit = 10, offset = 0 }, context) => {
      const user = requireAuth(context);
      
      // Validate input
      const validation = validate(schemas.getTransactions, { walletId, limit, offset });
      if (!validation.valid) {
        throw new AppError(validation.errors.map(e => e.message).join(', '), 400, true);
      }
      
      const transactions = await walletService.getTransactionHistory(
        walletId,
        user.userId,
        limit,
        offset
      );
      
      return transactions.map(tx => ({
        id: tx.id,
        walletId: tx.wallet_id,
        transactionHash: tx.transaction_hash,
        fromAddress: tx.from_address,
        toAddress: tx.to_address,
        amount: tx.amount,
        gasPrice: tx.gas_price,
        gasUsed: tx.gas_used,
        status: tx.status,
        blockNumber: tx.block_number?.toString(),
        timestamp: tx.timestamp,
        createdAt: formatDate(tx.created_at)
      }));
    },

    /**
     * Get a specific transaction
     */
    transaction: async (_, { hash }, context) => {
      const user = requireAuth(context);
      
      const transaction = await walletService.getTransaction(hash, user.userId);
      
      if (!transaction) {
        throw new AppError('Transaction not found', 404, true);
      }
      
      return {
        id: transaction.id,
        walletId: transaction.wallet_id,
        transactionHash: transaction.transaction_hash,
        fromAddress: transaction.from_address,
        toAddress: transaction.to_address,
        amount: transaction.amount,
        gasPrice: transaction.gas_price,
        gasUsed: transaction.gas_used,
        status: transaction.status,
        blockNumber: transaction.block_number?.toString(),
        timestamp: transaction.timestamp,
        createdAt: formatDate(transaction.created_at)
      };
    }
  },

  Mutation: {
    /**
     * Register a new user
     */
    register: async (_, { input }) => {
      const validation = validate(schemas.register, input);
      if (!validation.valid) {
        throw new AppError(validation.errors.map(e => e.message).join(', '), 400, true);
      }
      
      const { user, token } = await authService.register(
        validation.value.username,
        validation.value.password
      );
      
      return {
        user: {
          id: user.id,
          username: user.username,
          createdAt: formatDate(user.createdAt)
        },
        token
      };
    },

    /**
     * Login user
     */
    login: async (_, { input }) => {
      const validation = validate(schemas.login, input);
      if (!validation.valid) {
        throw new AppError(validation.errors.map(e => e.message).join(', '), 400, true);
      }
      
      const { user, token } = await authService.login(
        validation.value.username,
        validation.value.password
      );
      
      return {
        user: {
          id: user.id,
          username: user.username,
          createdAt: formatDate(user.createdAt)
        },
        token
      };
    },

    /**
     * Create a new wallet
     */
    createWallet: async (_, { input }, context) => {
      const user = requireAuth(context);
      
      const network = input?.network || 'sepolia';
      
      if (!['mainnet', 'sepolia', 'goerli'].includes(network)) {
        throw new AppError('Invalid network. Use mainnet, sepolia, or goerli', 400, true);
      }
      
      const wallet = await walletService.createWallet(user.userId, network);
      
      logger.info(`Wallet created via GraphQL for user ${user.userId}`);
      
      return {
        id: wallet.id,
        userId: wallet.user_id,
        address: wallet.address,
        network: wallet.network,
        createdAt: formatDate(wallet.created_at),
        mnemonic: wallet.mnemonic 
      };
    },

    /**
     * Send funds from wallet
     */
    sendFunds: async (_, { input }, context) => {
      const user = requireAuth(context);
      
      const validation = validate(schemas.sendFunds, input);
      if (!validation.valid) {
        throw new AppError(validation.errors.map(e => e.message).join(', '), 400, true);
      }
      
      const { transaction, txData } = await walletService.sendFunds(
        validation.value.walletId,
        user.userId,
        validation.value.toAddress,
        validation.value.amount
      );
      
      logger.info(`Funds sent via GraphQL by user ${user.userId}: ${txData.hash}`);
      
      return {
        transaction: {
          id: transaction.id,
          walletId: transaction.wallet_id,
          transactionHash: transaction.transaction_hash,
          fromAddress: transaction.from_address,
          toAddress: transaction.to_address,
          amount: transaction.amount,
          gasPrice: transaction.gas_price,
          gasUsed: transaction.gas_used,
          status: transaction.status,
          blockNumber: transaction.block_number?.toString(),
          timestamp: transaction.timestamp,
          createdAt: formatDate(transaction.created_at)
        },
        hash: txData.hash,
        from: txData.from,
        to: txData.to,
        amount: txData.amount
      };
    }
  }
};