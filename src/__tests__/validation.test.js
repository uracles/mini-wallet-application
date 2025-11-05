import { jest, expect, describe, test, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { validate, schemas, isValidEthereumAddress, isValidTransactionHash } from '../utils/validation.js';

describe('Validation Utility', () => {
  describe('register schema', () => {
    test('should validate correct registration data', () => {
      const data = {
        username: 'testuser',
        password: 'Password123!'
      };
      
      const result = validate(schemas.register, data);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
      expect(result.value).toEqual(data);
    });

    test('should reject short username', () => {
      const data = {
        username: 'ab',
        password: 'Password123!'
      };
      
      const result = validate(schemas.register, data);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors[0].field).toBe('username');
    });

    test('should reject weak password', () => {
      const data = {
        username: 'testuser',
        password: 'weak'
      };
      
      const result = validate(schemas.register, data);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors[0].field).toBe('password');
    });

    test('should reject password without special character', () => {
      const data = {
        username: 'testuser',
        password: 'Password123'
      };
      
      const result = validate(schemas.register, data);
      
      expect(result.valid).toBe(false);
    });

    test('should reject missing fields', () => {
      const data = {
        username: 'testuser'
      };
      
      const result = validate(schemas.register, data);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'password')).toBe(true);
    });
  });

  describe('sendFunds schema', () => {
    test('should validate correct send funds data', () => {
      const data = {
        walletId: 1,
        toAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        amount: '0.1'
      };
      
      const result = validate(schemas.sendFunds, data);
      
      expect(result.valid).toBe(true);
    });

    test('should reject invalid Ethereum address', () => {
      const data = {
        walletId: 1,
        toAddress: 'invalid-address',
        amount: '0.1'
      };
      
      const result = validate(schemas.sendFunds, data);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'toAddress')).toBe(true);
    });

    test('should reject invalid amount', () => {
      const data = {
        walletId: 1,
        toAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        amount: 'invalid'
      };
      
      const result = validate(schemas.sendFunds, data);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'amount')).toBe(true);
    });

    test('should reject negative wallet ID', () => {
      const data = {
        walletId: -1,
        toAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        amount: '0.1'
      };
      
      const result = validate(schemas.sendFunds, data);
      
      expect(result.valid).toBe(false);
    });
  });

  describe('getTransactions schema', () => {
    test('should validate correct transaction query', () => {
      const data = {
        walletId: 1,
        limit: 20,
        offset: 0
      };
      
      const result = validate(schemas.getTransactions, data);
      
      expect(result.valid).toBe(true);
      expect(result.value).toEqual(data);
    });

    test('should apply default values', () => {
      const data = {
        walletId: 1
      };
      
      const result = validate(schemas.getTransactions, data);
      
      expect(result.valid).toBe(true);
      expect(result.value.limit).toBe(10);
      expect(result.value.offset).toBe(0);
    });

    test('should reject limit exceeding maximum', () => {
      const data = {
        walletId: 1,
        limit: 101
      };
      
      const result = validate(schemas.getTransactions, data);
      
      expect(result.valid).toBe(false);
    });

    test('should reject negative offset', () => {
      const data = {
        walletId: 1,
        offset: -1
      };
      
      const result = validate(schemas.getTransactions, data);
      
      expect(result.valid).toBe(false);
    });
  });

  describe('isValidEthereumAddress', () => {
    test('should validate correct Ethereum address', () => {
      expect(isValidEthereumAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb')).toBe(true);
      expect(isValidEthereumAddress('0x0000000000000000000000000000000000000000')).toBe(true);
    });

    test('should reject invalid Ethereum address', () => {
      expect(isValidEthereumAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bE')).toBe(false);
      expect(isValidEthereumAddress('742d35Cc6634C0532925a3b844Bc9e7595f0bEb')).toBe(false);
      expect(isValidEthereumAddress('0x')).toBe(false);
      expect(isValidEthereumAddress('')).toBe(false);
      expect(isValidEthereumAddress('not-an-address')).toBe(false);
    });
  });

  describe('isValidTransactionHash', () => {
    test('should validate correct transaction hash', () => {
      const validHash = '0x' + 'a'.repeat(64);
      expect(isValidTransactionHash(validHash)).toBe(true);
    });

    test('should reject invalid transaction hash', () => {
      expect(isValidTransactionHash('0x' + 'a'.repeat(63))).toBe(false);
      expect(isValidTransactionHash('0x' + 'a'.repeat(65))).toBe(false);
      expect(isValidTransactionHash('a'.repeat(64))).toBe(false);
      expect(isValidTransactionHash('invalid')).toBe(false);
    });
  });
});

