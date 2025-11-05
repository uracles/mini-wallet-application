import TransactionRepository from '../repositories/TransactionRepository.js';
import { query } from '../config/database.js';

// Mock the database module
jest.mock('../config/database.js', () => ({
  query: jest.fn()
}));

describe('TransactionRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTransaction', () => {
    test('should create a new transaction successfully', async () => {
      const mockTransaction = {
        id: 1,
        wallet_id: 1,
        transaction_hash: '0xabcdef1234567890',
        from_address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        to_address: '0x1234567890123456789012345678901234567890',
        amount: '1.5',
        gas_price: '20',
        gas_used: '21000',
        status: 'pending',
        created_at: new Date()
      };

      query.mockResolvedValue({ rows: [mockTransaction] });

      const result = await TransactionRepository.createTransaction(
        1,
        '0xabcdef1234567890',
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        '0x1234567890123456789012345678901234567890',
        '1.5',
        '20',
        '21000',
        'pending'
      );

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO transactions'),
        [1, '0xabcdef1234567890', '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', '0x1234567890123456789012345678901234567890', '1.5', '20', '21000', 'pending']
      );
      expect(result).toEqual(mockTransaction);
    });

    test('should throw error when transaction creation fails', async () => {
      query.mockRejectedValue(new Error('Database error'));

      await expect(
        TransactionRepository.createTransaction(1, '0xhash', '0xfrom', '0xto', '1.0', '20', '21000')
      ).rejects.toThrow('Database error');
    });
  });

  describe('findByHash', () => {
    test('should find transaction by hash', async () => {
      const mockTransaction = {
        id: 1,
        wallet_id: 1,
        transaction_hash: '0xabcdef1234567890',
        status: 'confirmed',
        created_at: new Date()
      };

      query.mockResolvedValue({ rows: [mockTransaction] });

      const result = await TransactionRepository.findByHash('0xabcdef1234567890');

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE transaction_hash = $1'),
        ['0xabcdef1234567890']
      );
      expect(result).toEqual(mockTransaction);
    });

    test('should return null when transaction not found', async () => {
      query.mockResolvedValue({ rows: [] });

      const result = await TransactionRepository.findByHash('0xnonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByHashAndUserId', () => {
    test('should find transaction by hash and user ID', async () => {
      const mockTransaction = {
        id: 1,
        wallet_id: 1,
        transaction_hash: '0xabcdef1234567890',
        user_id: 1,
        status: 'confirmed',
        created_at: new Date()
      };

      query.mockResolvedValue({ rows: [mockTransaction] });

      const result = await TransactionRepository.findByHashAndUserId('0xabcdef1234567890', 1);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('JOIN wallets'),
        ['0xabcdef1234567890', 1]
      );
      expect(result).toEqual(mockTransaction);
    });

    test('should return null when transaction not found for user', async () => {
      query.mockResolvedValue({ rows: [] });

      const result = await TransactionRepository.findByHashAndUserId('0xabcdef1234567890', 999);

      expect(result).toBeNull();
    });
  });

  describe('findByWalletId', () => {
    test('should find transactions by wallet ID with pagination', async () => {
      const mockTransactions = [
        {
          id: 1,
          wallet_id: 1,
          transaction_hash: '0xhash1',
          status: 'confirmed',
          created_at: new Date()
        },
        {
          id: 2,
          wallet_id: 1,
          transaction_hash: '0xhash2',
          status: 'pending',
          created_at: new Date()
        }
      ];

      query.mockResolvedValue({ rows: mockTransactions });

      const result = await TransactionRepository.findByWalletId(1, 10, 0);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE wallet_id = $1'),
        [1, 10, 0]
      );
      expect(result).toEqual(mockTransactions);
      expect(result).toHaveLength(2);
    });

    test('should respect pagination parameters', async () => {
      query.mockResolvedValue({ rows: [] });

      await TransactionRepository.findByWalletId(1, 5, 10);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT $2 OFFSET $3'),
        [1, 5, 10]
      );
    });
  });

  describe('updateTransactionStatus', () => {
    test('should update transaction status successfully', async () => {
      const mockTransaction = {
        id: 1,
        transaction_hash: '0xabcdef1234567890',
        status: 'confirmed',
        gas_used: '21000',
        block_number: 12345,
        timestamp: new Date()
      };

      query.mockResolvedValue({ rows: [mockTransaction] });

      const result = await TransactionRepository.updateTransactionStatus(
        '0xabcdef1234567890',
        'confirmed',
        '21000',
        12345,
        new Date()
      );

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE transactions'),
        expect.arrayContaining(['confirmed', '21000', 12345])
      );
      expect(result).toEqual(mockTransaction);
    });

    test('should return null when transaction not found', async () => {
      query.mockResolvedValue({ rows: [] });

      const result = await TransactionRepository.updateTransactionStatus(
        '0xnonexistent',
        'confirmed',
        '21000',
        12345,
        new Date()
      );

      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    test('should find all transactions for a user', async () => {
      const mockTransactions = [
        {
          id: 1,
          wallet_id: 1,
          transaction_hash: '0xhash1',
          status: 'confirmed',
          created_at: new Date()
        },
        {
          id: 2,
          wallet_id: 2,
          transaction_hash: '0xhash2',
          status: 'pending',
          created_at: new Date()
        }
      ];

      query.mockResolvedValue({ rows: mockTransactions });

      const result = await TransactionRepository.findByUserId(1, 10, 0);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('JOIN wallets'),
        [1, 10, 0]
      );
      expect(result).toEqual(mockTransactions);
    });

    test('should return empty array when user has no transactions', async () => {
      query.mockResolvedValue({ rows: [] });

      const result = await TransactionRepository.findByUserId(999, 10, 0);

      expect(result).toEqual([]);
    });
  });

  describe('findPendingTransactions', () => {
    test('should find all pending transactions', async () => {
      const mockTransactions = [
        {
          id: 1,
          transaction_hash: '0xhash1',
          status: 'pending',
          created_at: new Date()
        }
      ];

      query.mockResolvedValue({ rows: mockTransactions });

      const result = await TransactionRepository.findPendingTransactions();

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining("WHERE status = 'pending'"),
        []
      );
      expect(result).toEqual(mockTransactions);
    });

    test('should find pending transactions for specific wallet', async () => {
      query.mockResolvedValue({ rows: [] });

      await TransactionRepository.findPendingTransactions(1);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('AND wallet_id = $1'),
        [1]
      );
    });
  });

  describe('countByWalletId', () => {
    test('should count transactions for a wallet', async () => {
      query.mockResolvedValue({ rows: [{ count: '15' }] });

      const result = await TransactionRepository.countByWalletId(1);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*) FROM transactions WHERE wallet_id = $1'),
        [1]
      );
      expect(result).toBe(15);
    });

    test('should return 0 when wallet has no transactions', async () => {
      query.mockResolvedValue({ rows: [{ count: '0' }] });

      const result = await TransactionRepository.countByWalletId(999);

      expect(result).toBe(0);
    });
  });

  describe('findByStatus', () => {
    test('should find transactions by status', async () => {
      const mockTransactions = [
        {
          id: 1,
          transaction_hash: '0xhash1',
          status: 'confirmed',
          created_at: new Date()
        },
        {
          id: 2,
          transaction_hash: '0xhash2',
          status: 'confirmed',
          created_at: new Date()
        }
      ];

      query.mockResolvedValue({ rows: mockTransactions });

      const result = await TransactionRepository.findByStatus('confirmed', 10, 0);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE status = $1'),
        ['confirmed', 10, 0]
      );
      expect(result).toEqual(mockTransactions);
    });

    test('should return empty array when no transactions with status', async () => {
      query.mockResolvedValue({ rows: [] });

      const result = await TransactionRepository.findByStatus('failed', 10, 0);

      expect(result).toEqual([]);
    });
  });
});
