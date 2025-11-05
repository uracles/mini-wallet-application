import { jest, expect, describe, test, beforeEach } from '@jest/globals';
import WalletRepository from '../repositories/WalletRepository.js';
import { query } from '../config/database.js';

// Mock the database module
jest.mock('../config/database.js');

describe('WalletRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createWallet', () => {
    test('should create a new wallet successfully', async () => {
      const mockWallet = {
        id: 1,
        user_id: 1,
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        network: 'sepolia',
        created_at: new Date()
      };

      query.mockResolvedValue({ rows: [mockWallet] });

      const result = await WalletRepository.createWallet(
        1,
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        'encrypted_private_key',
        'sepolia'
      );

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO wallets'),
        [1, '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', 'encrypted_private_key', 'sepolia']
      );
      expect(result).toEqual(mockWallet);
    });

    test('should throw error when wallet creation fails', async () => {
      query.mockRejectedValue(new Error('Database error'));

      await expect(
        WalletRepository.createWallet(1, '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', 'encrypted_key', 'sepolia')
      ).rejects.toThrow('Database error');
    });
  });

  describe('findByUserId', () => {
    test('should find all wallets for a user', async () => {
      const mockWallets = [
        {
          id: 1,
          user_id: 1,
          address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
          network: 'sepolia',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 2,
          user_id: 1,
          address: '0x1234567890123456789012345678901234567890',
          network: 'mainnet',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      query.mockResolvedValue({ rows: mockWallets });

      const result = await WalletRepository.findByUserId(1);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, user_id, address, network'),
        [1]
      );
      expect(result).toEqual(mockWallets);
      expect(result).toHaveLength(2);
    });

    test('should return empty array when user has no wallets', async () => {
      query.mockResolvedValue({ rows: [] });

      const result = await WalletRepository.findByUserId(999);

      expect(result).toEqual([]);
    });
  });

  describe('findByIdAndUserId', () => {
    test('should find wallet by ID and user ID', async () => {
      const mockWallet = {
        id: 1,
        user_id: 1,
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        network: 'sepolia',
        created_at: new Date(),
        updated_at: new Date()
      };

      query.mockResolvedValue({ rows: [mockWallet] });

      const result = await WalletRepository.findByIdAndUserId(1, 1);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1 AND user_id = $2'),
        [1, 1]
      );
      expect(result).toEqual(mockWallet);
    });

    test('should return null when wallet not found', async () => {
      query.mockResolvedValue({ rows: [] });

      const result = await WalletRepository.findByIdAndUserId(999, 1);

      expect(result).toBeNull();
    });

    test('should return null when wallet belongs to different user', async () => {
      query.mockResolvedValue({ rows: [] });

      const result = await WalletRepository.findByIdAndUserId(1, 999);

      expect(result).toBeNull();
    });
  });

  describe('findWithPrivateKey', () => {
    test('should find wallet with encrypted private key', async () => {
      const mockWallet = {
        id: 1,
        user_id: 1,
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        encrypted_private_key: 'encrypted_key_data',
        network: 'sepolia'
      };

      query.mockResolvedValue({ rows: [mockWallet] });

      const result = await WalletRepository.findWithPrivateKey(1, 1);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('encrypted_private_key'),
        [1, 1]
      );
      expect(result).toEqual(mockWallet);
      expect(result).toHaveProperty('encrypted_private_key');
    });

    test('should return null when wallet not found', async () => {
      query.mockResolvedValue({ rows: [] });

      const result = await WalletRepository.findWithPrivateKey(999, 1);

      expect(result).toBeNull();
    });
  });

  describe('findByAddress', () => {
    test('should find wallet by address', async () => {
      const mockWallet = {
        id: 1,
        user_id: 1,
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        network: 'sepolia',
        created_at: new Date(),
        updated_at: new Date()
      };

      query.mockResolvedValue({ rows: [mockWallet] });

      const result = await WalletRepository.findByAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE address = $1'),
        ['0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb']
      );
      expect(result).toEqual(mockWallet);
    });

    test('should return null when address not found', async () => {
      query.mockResolvedValue({ rows: [] });

      const result = await WalletRepository.findByAddress('0x0000000000000000000000000000000000000000');

      expect(result).toBeNull();
    });
  });

  describe('findByNetwork', () => {
    test('should find all wallets on a specific network', async () => {
      const mockWallets = [
        {
          id: 1,
          user_id: 1,
          address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
          network: 'sepolia',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 2,
          user_id: 2,
          address: '0x1234567890123456789012345678901234567890',
          network: 'sepolia',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      query.mockResolvedValue({ rows: mockWallets });

      const result = await WalletRepository.findByNetwork('sepolia');

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE network = $1'),
        ['sepolia']
      );
      expect(result).toEqual(mockWallets);
      expect(result).toHaveLength(2);
    });

    test('should return empty array when no wallets on network', async () => {
      query.mockResolvedValue({ rows: [] });

      const result = await WalletRepository.findByNetwork('unknown');

      expect(result).toEqual([]);
    });
  });

  describe('countByUserId', () => {
    test('should return wallet count for user', async () => {
      query.mockResolvedValue({ rows: [{ count: '5' }] });

      const result = await WalletRepository.countByUserId(1);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*) FROM wallets WHERE user_id = $1'),
        [1]
      );
      expect(result).toBe(5);
    });

    test('should return 0 when user has no wallets', async () => {
      query.mockResolvedValue({ rows: [{ count: '0' }] });

      const result = await WalletRepository.countByUserId(999);

      expect(result).toBe(0);
    });

    test('should throw error when count fails', async () => {
      query.mockRejectedValue(new Error('Count failed'));

      await expect(
        WalletRepository.countByUserId(1)
      ).rejects.toThrow('Count failed');
    });
  });
});

