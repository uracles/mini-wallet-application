import blockchainService from '../services/blockchain.service.js';

describe('Blockchain Service', () => {
  describe('createWallet', () => {
    test('should create a new wallet with address and private key', async () => {
      const wallet = await blockchainService.createWallet();
      
      expect(wallet).toHaveProperty('address');
      expect(wallet).toHaveProperty('privateKey');
      expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(wallet.privateKey).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });

    test('should create unique wallets', async () => {
      const wallet1 = await blockchainService.createWallet();
      const wallet2 = await blockchainService.createWallet();
      
      expect(wallet1.address).not.toBe(wallet2.address);
      expect(wallet1.privateKey).not.toBe(wallet2.privateKey);
    });

    test('should include mnemonic phrase', async () => {
      const wallet = await blockchainService.createWallet();
      
      expect(wallet.mnemonic).toBeDefined();
      if (wallet.mnemonic) {
        expect(wallet.mnemonic.split(' ').length).toBe(12);
      }
    });
  });

  describe('getBalance', () => {
    test('should return balance object with correct structure', async () => {
      const testAddress = '0x0000000000000000000000000000000000000000';
      
      const balance = await blockchainService.getBalance(testAddress);
      
      expect(balance).toHaveProperty('wei');
      expect(balance).toHaveProperty('ether');
      expect(balance).toHaveProperty('address');
      expect(balance.address).toBe(testAddress);
    });

    test('should return zero balance for new address', async () => {
      const wallet = await blockchainService.createWallet();
      const balance = await blockchainService.getBalance(wallet.address);
      
      expect(balance.ether).toBe('0.0');
    });

    test('should throw error for invalid address', async () => {
      await expect(
        blockchainService.getBalance('invalid-address')
      ).rejects.toThrow();
    });
  });

  describe('getEtherscanApiUrl', () => {
    test('should return correct URL for different networks', () => {
      const urls = {
        mainnet: 'https://api.etherscan.io/api',
        sepolia: 'https://api-sepolia.etherscan.io/api',
        goerli: 'https://api-goerli.etherscan.io/api'
      };
      
      Object.entries(urls).forEach(([network, expectedUrl]) => {
        blockchainService.network = network;
        expect(blockchainService.getEtherscanApiUrl()).toBe(expectedUrl);
      });
    });

    test('should default to sepolia for unknown network', () => {
      blockchainService.network = 'unknown';
      expect(blockchainService.getEtherscanApiUrl()).toBe('https://api-sepolia.etherscan.io/api');
    });
  });

  describe('sendTransaction', () => {
    test('should throw error for insufficient balance', async () => {
      const wallet = await blockchainService.createWallet();
      const toAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      
      await expect(
        blockchainService.sendTransaction(wallet.privateKey, toAddress, '1.0')
      ).rejects.toThrow('Insufficient balance');
    });

    test('should throw error for invalid recipient address', async () => {
      const wallet = await blockchainService.createWallet();
      
      await expect(
        blockchainService.sendTransaction(wallet.privateKey, 'invalid', '0.1')
      ).rejects.toThrow('Invalid recipient address');
    });
  });

  describe('getTransaction', () => {
    test('should return null for non-existent transaction', async () => {
      const fakeHash = '0x' + '0'.repeat(64);
      
      const result = await blockchainService.getTransaction(fakeHash);
      
      expect(result).toBeNull();
    });
  });

  describe('getTransactionHistory', () => {
    test('should return empty array for address with no transactions', async () => {
      const wallet = await blockchainService.createWallet();
      
      const history = await blockchainService.getTransactionHistory(wallet.address, 10);
      
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBe(0);
    });

    test('should respect limit parameter', async () => {
      const testAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      const limit = 5;
      
      const history = await blockchainService.getTransactionHistory(testAddress, limit);
      
      expect(history.length).toBeLessThanOrEqual(limit);
    });
  });
});
