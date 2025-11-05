import { jest, expect, describe, test, beforeEach } from '@jest/globals';
import walletService from '../services/wallet.service.js';
import blockchainService from '../services/blockchain.service.js';
import walletRepository from '../repositories/WalletRepository.js';
import transactionRepository from '../repositories/TransactionRepository.js';
import { encrypt, decrypt } from '../utils/encryption.js';

// Mock dependencies
jest.mock('../services/blockchain.service.js');
jest.mock('../repositories/WalletRepository.js');
jest.mock('../repositories/TransactionRepository.js');
jest.mock('../utils/encryption.js');

describe('WalletService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createWallet', () => {
    test('should create a new wallet successfully', async () => {
      const mockWalletData = {
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        privateKey: '0xprivatekey123',
        mnemonic: 'test mnemonic phrase'
      };

      const mockDbWallet = {
        id: 1,
        user_id: 1,
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        network: 'sepolia',
        created_at: new Date()
      };

      blockchainService.createWallet.mockResolvedValue(mockWalletData);
      encrypt.mockReturnValue('encrypted_private_key');
      walletRepository.createWallet.mockResolvedValue(mockDbWallet);

      const result = await walletService.createWallet(1, 'sepolia');

      expect(blockchainService.createWallet).toHaveBeenCalled();
      expect(encrypt).toHaveBeenCalledWith('0xprivatekey123');
      expect(walletRepository.createWallet).toHaveBeenCalledWith(
        1,
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        'encrypted_private_key',
        'sepolia'
      );
      expect(result).toHaveProperty('mnemonic', 'test mnemonic phrase');
    });

    test('should throw error when wallet creation fails', async () => {
      blockchainService.createWallet.mockRejectedValue(new Error('Blockchain error'));

      await expect(
        walletService.createWallet(1, 'sepolia')
      ).rejects.toThrow('Failed to create wallet');
    });
  });

  describe('getWalletsByUserId', () => {
    test('should get all wallets for a user', async () => {
      const mockWallets = [
        { id: 1, address: '0xaddress1', network: 'sepolia' },
        { id: 2, address: '0xaddress2', network: 'mainnet' }
      ];

      walletRepository.findByUserId.mockResolvedValue(mockWallets);

      const result = await walletService.getWalletsByUserId(1);

      expect(walletRepository.findByUserId).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockWallets);
    });

    test('should throw error when fetching wallets fails', async () => {
      walletRepository.findByUserId.mockRejectedValue(new Error('Database error'));

      await expect(
        walletService.getWalletsByUserId(1)
      ).rejects.toThrow('Failed to fetch wallets');
    });
  });

  describe('getWalletById', () => {
    test('should get wallet by ID', async () => {
      const mockWallet = { id: 1, address: '0xaddress1', network: 'sepolia' };

      walletRepository.findByIdAndUserId.mockResolvedValue(mockWallet);

      const result = await walletService.getWalletById(1, 1);

      expect(walletRepository.findByIdAndUserId).toHaveBeenCalledWith(1, 1);
      expect(result).toEqual(mockWallet);
    });

    test('should throw error when wallet fetch fails', async () => {
      walletRepository.findByIdAndUserId.mockRejectedValue(new Error('Database error'));

      await expect(
        walletService.getWalletById(1, 1)
      ).rejects.toThrow('Failed to fetch wallet');
    });
  });

  describe('getBalance', () => {
    test('should get wallet balance successfully', async () => {
      const mockWallet = {
        id: 1,
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        network: 'sepolia'
      };

      const mockBalance = {
        wei: '1000000000000000000',
        ether: '1.0'
      };

      walletRepository.findByIdAndUserId.mockResolvedValue(mockWallet);
      blockchainService.getBalance.mockResolvedValue(mockBalance);

      const result = await walletService.getBalance(1, 1);

      expect(walletRepository.findByIdAndUserId).toHaveBeenCalledWith(1, 1);
      expect(blockchainService.getBalance).toHaveBeenCalledWith('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
      expect(result).toEqual({
        walletId: 1,
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        network: 'sepolia',
        ...mockBalance
      });
    });

    test('should throw error when wallet not found', async () => {
      walletRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(
        walletService.getBalance(1, 1)
      ).rejects.toThrow('Wallet not found');
    });
  });

  describe('sendFunds', () => {
    test('should send funds successfully', async () => {
      const mockWallet = {
        id: 1,
        address: '0xfromaddress',
        encrypted_private_key: 'encrypted_key'
      };

      const mockTxData = {
        hash: '0xtxhash',
        from: '0xfromaddress',
        to: '0xtoaddress',
        amount: '1.0',
        maxFeePerGas: '20'
      };

      const mockTransaction = {
        id: 1,
        transaction_hash: '0xtxhash',
        status: 'pending'
      };

      walletRepository.findWithPrivateKey.mockResolvedValue(mockWallet);
      decrypt.mockReturnValue('decrypted_private_key');
      blockchainService.sendTransaction.mockResolvedValue(mockTxData);
      transactionRepository.createTransaction.mockResolvedValue(mockTransaction);

      const result = await walletService.sendFunds(1, 1, '0xtoaddress', '1.0');

      expect(walletRepository.findWithPrivateKey).toHaveBeenCalledWith(1, 1);
      expect(decrypt).toHaveBeenCalledWith('encrypted_key');
      expect(blockchainService.sendTransaction).toHaveBeenCalledWith(
        'decrypted_private_key',
        '0xtoaddress',
        '1.0'
      );
      expect(result).toHaveProperty('transaction');
      expect(result).toHaveProperty('txData');
    });

    test('should throw error when wallet not found', async () => {
      walletRepository.findWithPrivateKey.mockResolvedValue(null);

      await expect(
        walletService.sendFunds(1, 1, '0xtoaddress', '1.0')
      ).rejects.toThrow('Wallet not found');
    });

    test('should throw error when transaction fails', async () => {
      const mockWallet = {
        id: 1,
        encrypted_private_key: 'encrypted_key'
      };

      walletRepository.findWithPrivateKey.mockResolvedValue(mockWallet);
      decrypt.mockReturnValue('decrypted_private_key');
      blockchainService.sendTransaction.mockRejectedValue(new Error('Insufficient funds'));

      await expect(
        walletService.sendFunds(1, 1, '0xtoaddress', '1.0')
      ).rejects.toThrow('Insufficient funds');
    });
  });

  describe('storeTransaction', () => {
    test('should store transaction successfully', async () => {
      const mockTransaction = {
        id: 1,
        transaction_hash: '0xtxhash',
        status: 'pending'
      };

      transactionRepository.createTransaction.mockResolvedValue(mockTransaction);

      const result = await walletService.storeTransaction(
        1,
        '0xtxhash',
        '0xfrom',
        '0xto',
        '1.0',
        '20',
        null,
        'pending'
      );

      expect(transactionRepository.createTransaction).toHaveBeenCalledWith(
        1,
        '0xtxhash',
        '0xfrom',
        '0xto',
        '1.0',
        '20',
        null,
        'pending'
      );
      expect(result).toEqual(mockTransaction);
    });

    test('should return existing transaction if duplicate', async () => {
      const duplicateError = new Error('Duplicate');
      duplicateError.code = '23505';

      const existingTransaction = {
        id: 1,
        transaction_hash: '0xtxhash',
        status: 'confirmed'
      };

      transactionRepository.createTransaction.mockRejectedValue(duplicateError);
      transactionRepository.findByHash.mockResolvedValue(existingTransaction);

      const result = await walletService.storeTransaction(
        1,
        '0xtxhash',
        '0xfrom',
        '0xto',
        '1.0',
        '20',
        null
      );

      expect(transactionRepository.findByHash).toHaveBeenCalledWith('0xtxhash');
      expect(result).toEqual(existingTransaction);
    });

    test('should throw error for non-duplicate errors', async () => {
      transactionRepository.createTransaction.mockRejectedValue(new Error('Database error'));

      await expect(
        walletService.storeTransaction(1, '0xtxhash', '0xfrom', '0xto', '1.0', '20', null)
      ).rejects.toThrow('Failed to store transaction');
    });
  });

  describe('getTransactionHistory', () => {
    test('should get transaction history successfully', async () => {
      const mockWallet = {
        id: 1,
        address: '0xaddress'
      };

      const mockBlockchainTxs = [
        {
          hash: '0xtxhash1',
          from: '0xfrom',
          to: '0xto',
          value: '1.0',
          gasPrice: '20',
          gasUsed: '21000',
          status: 'confirmed'
        }
      ];

      const mockDbTxs = [
        {
          id: 1,
          transaction_hash: '0xtxhash1',
          status: 'confirmed'
        }
      ];

      walletRepository.findByIdAndUserId.mockResolvedValue(mockWallet);
      blockchainService.getTransactionHistory.mockResolvedValue(mockBlockchainTxs);
      transactionRepository.createTransaction.mockResolvedValue({});
      transactionRepository.findByWalletId.mockResolvedValue(mockDbTxs);

      const result = await walletService.getTransactionHistory(1, 1, 10, 0);

      expect(blockchainService.getTransactionHistory).toHaveBeenCalledWith('0xaddress', 10);
      expect(transactionRepository.findByWalletId).toHaveBeenCalledWith(1, 10, 0);
      expect(result).toEqual(mockDbTxs);
    });

    test('should throw error when wallet not found', async () => {
      walletRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(
        walletService.getTransactionHistory(1, 1, 10, 0)
      ).rejects.toThrow('Wallet not found');
    });
  });

  describe('getTransaction', () => {
    test('should get transaction by hash and user ID', async () => {
      const mockTransaction = {
        id: 1,
        transaction_hash: '0xtxhash',
        status: 'confirmed'
      };

      transactionRepository.findByHashAndUserId.mockResolvedValue(mockTransaction);

      const result = await walletService.getTransaction('0xtxhash', 1);

      expect(transactionRepository.findByHashAndUserId).toHaveBeenCalledWith('0xtxhash', 1);
      expect(result).toEqual(mockTransaction);
    });

    test('should throw error when fetch fails', async () => {
      transactionRepository.findByHashAndUserId.mockRejectedValue(new Error('Database error'));

      await expect(
        walletService.getTransaction('0xtxhash', 1)
      ).rejects.toThrow('Failed to fetch transaction');
    });
  });
});

