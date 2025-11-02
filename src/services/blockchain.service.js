import { ethers } from 'ethers';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

class BlockchainService {
  constructor() {
    this.network = process.env.ETHEREUM_NETWORK || 'sepolia';
    this.provider = this.initializeProvider();
  }

  initializeProvider() {
    try {
      const alchemyKey = process.env.ALCHEMY_API_KEY;
      
      if (!alchemyKey) {
        logger.warn('No Alchemy API key found, using default provider');
        return ethers.getDefaultProvider(this.network);
      }

      const alchemyUrl = `https://eth-${this.network}.g.alchemy.com/v2/${alchemyKey}`;
      return new ethers.JsonRpcProvider(alchemyUrl);
    } catch (error) {
      logger.error('Failed to initialize blockchain provider:', error);
      throw new Error('Blockchain provider initialization failed');
    }
  }

  /**
   * Creates a new Ethereum wallet
   */
  async createWallet() {
    try {
      const wallet = ethers.Wallet.createRandom();
      
      return {
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: wallet.mnemonic?.phrase || null
      };
    } catch (error) {
      logger.error('Error creating wallet:', error);
      throw new Error('Failed to create wallet');
    }
  }

  /**
   * Gets the balance of a wallet address
   */
  async getBalance(address) {
    try {
      const balance = await this.provider.getBalance(address);
      
      return {
        wei: balance.toString(),
        ether: ethers.formatEther(balance),
        address
      };
    } catch (error) {
      logger.error(`Error fetching balance for ${address}:`, error);
      throw new Error('Failed to fetch balance');
    }
  }

  /**
   * Sends ETH from one address to another
   */
  async sendTransaction(privateKey, toAddress, amountInEther) {
    try {
      const wallet = new ethers.Wallet(privateKey, this.provider);
      
      // Validate addresses
      if (!ethers.isAddress(toAddress)) {
        throw new Error('Invalid recipient address');
      }

      // Parse amount
      const amount = ethers.parseEther(amountInEther);
      
      // Check balance
      const balance = await this.provider.getBalance(wallet.address);
      if (balance < amount) {
        throw new Error('Insufficient balance');
      }

      // Estimate gas
      const gasLimit = await this.provider.estimateGas({
        to: toAddress,
        value: amount
      });

      // Get gas price
      const feeData = await this.provider.getFeeData();
      
      // Create transaction
      const tx = await wallet.sendTransaction({
        to: toAddress,
        value: amount,
        gasLimit: gasLimit,
        maxFeePerGas: feeData.maxFeePerGas,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas
      });

      logger.info(`Transaction sent: ${tx.hash}`);

      return {
        hash: tx.hash,
        from: wallet.address,
        to: toAddress,
        amount: amountInEther,
        gasLimit: gasLimit.toString(),
        maxFeePerGas: feeData.maxFeePerGas?.toString() || '0'
      };
    } catch (error) {
      logger.error('Error sending transaction:', error);
      throw new Error(error.message || 'Failed to send transaction');
    }
  }

  /**
   * Gets transaction details
   */
  async getTransaction(transactionHash) {
    try {
      const tx = await this.provider.getTransaction(transactionHash);
      
      if (!tx) {
        return null;
      }

      const receipt = await this.provider.getTransactionReceipt(transactionHash);
      
      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: ethers.formatEther(tx.value),
        gasPrice: tx.gasPrice?.toString() || '0',
        gasLimit: tx.gasLimit.toString(),
        gasUsed: receipt?.gasUsed.toString() || '0',
        status: receipt ? (receipt.status === 1 ? 'confirmed' : 'failed') : 'pending',
        blockNumber: tx.blockNumber,
        timestamp: receipt?.blockNumber ? await this.getBlockTimestamp(receipt.blockNumber) : null
      };
    } catch (error) {
      logger.error(`Error fetching transaction ${transactionHash}:`, error);
      throw new Error('Failed to fetch transaction');
    }
  }

  /**
   * Gets transaction history for an address using Etherscan API
   */
  async getTransactionHistory(address, limit = 10) {
    try {
      const etherscanKey = process.env.ETHERSCAN_API_KEY;
      
      if (!etherscanKey) {
        logger.warn('No Etherscan API key, fetching basic transaction data');
        return this.getBasicTransactionHistory(address, limit);
      }

      const apiUrl = this.getEtherscanApiUrl();
      const url = `${apiUrl}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=${limit}&sort=desc&apikey=${etherscanKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== '1') {
        logger.warn('Etherscan API error:', data.message);
        return [];
      }

      return data.result.map(tx => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: ethers.formatEther(tx.value),
        gasPrice: tx.gasPrice,
        gasUsed: tx.gasUsed,
        status: tx.txreceipt_status === '1' ? 'confirmed' : 'failed',
        blockNumber: parseInt(tx.blockNumber),
        timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString()
      }));
    } catch (error) {
      logger.error(`Error fetching transaction history for ${address}:`, error);
      return [];
    }
  }

  /**
   * Fallback method to get basic transaction history without Etherscan
   */
  async getBasicTransactionHistory(address, limit = 10) {
    try {
      // This is limited but works without Etherscan API
      const currentBlock = await this.provider.getBlockNumber();
      const transactions = [];
      
      // Search last 1000 blocks (approximately 3-4 hours on mainnet)
      const startBlock = Math.max(0, currentBlock - 1000);
      
      for (let i = currentBlock; i >= startBlock && transactions.length < limit; i--) {
        try {
          const block = await this.provider.getBlock(i, true);
          
          if (block && block.transactions) {
            for (const tx of block.transactions) {
              if (tx.from === address || tx.to === address) {
                transactions.push({
                  hash: tx.hash,
                  from: tx.from,
                  to: tx.to || 'Contract Creation',
                  value: ethers.formatEther(tx.value),
                  gasPrice: tx.gasPrice?.toString() || '0',
                  blockNumber: i,
                  timestamp: new Date(block.timestamp * 1000).toISOString()
                });
                
                if (transactions.length >= limit) break;
              }
            }
          }
        } catch (blockError) {
          // Skip blocks that fail
          continue;
        }
      }
      
      return transactions;
    } catch (error) {
      logger.error('Error in basic transaction history:', error);
      return [];
    }
  }

  /**
   * Gets the timestamp for a specific block
   */
  async getBlockTimestamp(blockNumber) {
    try {
      const block = await this.provider.getBlock(blockNumber);
      return block ? new Date(block.timestamp * 1000).toISOString() : null;
    } catch (error) {
      logger.error(`Error fetching block ${blockNumber}:`, error);
      return null;
    }
  }

  /**
   * Returns the appropriate Etherscan API URL based on network
   */
  getEtherscanApiUrl() {
    const urls = {
      mainnet: 'https://api.etherscan.io/api',
      sepolia: 'https://api-sepolia.etherscan.io/api',
      goerli: 'https://api-goerli.etherscan.io/api'
    };
    
    return urls[this.network] || urls.sepolia;
  }

  /**
   * Waits for a transaction to be confirmed
   */
  async waitForTransaction(transactionHash, confirmations = 1) {
    try {
      const receipt = await this.provider.waitForTransaction(transactionHash, confirmations);
      return receipt;
    } catch (error) {
      logger.error(`Error waiting for transaction ${transactionHash}:`, error);
      throw new Error('Transaction confirmation failed');
    }
  }
}

export default new BlockchainService();
