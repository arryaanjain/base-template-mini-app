// Blockchain transaction reading utilities
// Fetches and parses transaction history from Etherscan/Alchemy APIs

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string; // in wei
  valueInEth: string;
  gasPrice: string;
  gasUsed: string;
  timestamp: number;
  blockNumber: string;
  isError: boolean;
  functionName?: string;
  tokenSymbol?: string;
  tokenName?: string;
  tokenValue?: string;
  type: 'eth_transfer' | 'token_transfer' | 'contract_call' | 'nft_mint' | 'swap';
  description: string; // Human readable description
}

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;

export class BlockchainReader {
  private etherscanBaseUrl = 'https://api.etherscan.io/api';
  private alchemyBaseUrl = `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;

  async getRecentTransactions(address: string, limit: number = 10): Promise<Transaction[]> {
    try {
      // If no API key, return sample data for demo
      if (!ETHERSCAN_API_KEY) {
        return this.getSampleTransactions(address, limit);
      }

      // Fetch normal transactions
      const normalTxs = await this.fetchEtherscanTransactions(address, 'txlist', limit);
      
      // Fetch internal transactions (contract interactions)
      const internalTxs = await this.fetchEtherscanTransactions(address, 'txlistinternal', limit);
      
      // Fetch ERC-20 token transfers
      const tokenTxs = await this.fetchEtherscanTransactions(address, 'tokentx', limit);
      
      // Combine and sort by timestamp
      const allTxs = [...normalTxs, ...internalTxs, ...tokenTxs]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);

      return allTxs;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      // Fallback to sample data on error
      return this.getSampleTransactions(address, limit);
    }
  }

  private getSampleTransactions(address: string, limit: number): Transaction[] {
    const now = Date.now();
    const sampleTxs: Transaction[] = [
      {
        hash: '0xabc123def456789012345678901234567890123456789012345678901234567890',
        from: address,
        to: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
        value: '500000000000000000',
        valueInEth: '0.500000',
        gasPrice: '20000000000',
        gasUsed: '21000',
        timestamp: now - 3600000, // 1 hour ago
        blockNumber: '18500000',
        isError: false,
        type: 'swap',
        description: 'Swapped 0.5 ETH for UNI on Uniswap',
        tokenSymbol: 'UNI',
        tokenName: 'Uniswap',
        tokenValue: '125.50'
      },
      {
        hash: '0xdef456789012345678901234567890123456789012345678901234567890abc123',
        from: address,
        to: '0x60e4d786628fea6478f785a6d7e704777c86a7c6',
        value: '0',
        valueInEth: '0.000000',
        gasPrice: '25000000000',
        gasUsed: '85000',
        timestamp: now - 7200000, // 2 hours ago
        blockNumber: '18499950',
        isError: false,
        type: 'nft_mint',
        description: 'Minted Bored Ape NFT #8247'
      },
      {
        hash: '0x789012345678901234567890123456789012345678901234567890123456def4',
        from: address,
        to: '0xa0b86a33e6441c8c0a1b1faf5ab0b8a2e9d8e0bf',
        value: '1000000000000000000',
        valueInEth: '1.000000',
        gasPrice: '18000000000',
        gasUsed: '21000',
        timestamp: now - 14400000, // 4 hours ago
        blockNumber: '18499800',
        isError: false,
        type: 'eth_transfer',
        description: 'Sent 1.0 ETH'
      },
      {
        hash: '0x456789012345678901234567890123456789012345678901234567890def456',
        from: address,
        to: '0x514910771af9ca656af840dff83e8264ecf986ca',
        value: '0',
        valueInEth: '0.000000',
        gasPrice: '22000000000',
        gasUsed: '65000',
        timestamp: now - 21600000, // 6 hours ago
        blockNumber: '18499700',
        isError: false,
        type: 'token_transfer',
        description: 'Transferred 1000 LINK tokens',
        tokenSymbol: 'LINK',
        tokenName: 'Chainlink',
        tokenValue: '1000.00'
      }
    ];

    return sampleTxs.slice(0, limit);
  }

  private async fetchEtherscanTransactions(
    address: string, 
    action: string, 
    limit: number
  ): Promise<Transaction[]> {
    if (!ETHERSCAN_API_KEY) {
      throw new Error('ETHERSCAN_API_KEY not configured');
    }

    const url = `${this.etherscanBaseUrl}?module=account&action=${action}&address=${address}&startblock=0&endblock=99999999&page=1&offset=${limit}&sort=desc&apikey=${ETHERSCAN_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status !== '1') {
      console.warn('Etherscan API error:', data.message);
      return [];
    }

    return data.result.map((tx: any) => this.parseTransaction(tx, action));
  }

  private parseTransaction(tx: any, action: string): Transaction {
    const timestamp = parseInt(tx.timeStamp) * 1000;
    const valueInEth = (parseInt(tx.value) / 1e18).toFixed(6);
    
    let type: Transaction['type'] = 'eth_transfer';
    let description = '';
    let tokenSymbol = '';
    let tokenName = '';
    let tokenValue = '';

    if (action === 'tokentx') {
      type = 'token_transfer';
      tokenSymbol = tx.tokenSymbol;
      tokenName = tx.tokenName;
      const decimals = parseInt(tx.tokenDecimal) || 18;
      tokenValue = (parseInt(tx.value) / Math.pow(10, decimals)).toFixed(6);
      description = `Transferred ${tokenValue} ${tokenSymbol}`;
    } else if (tx.functionName) {
      type = 'contract_call';
      
      // Parse common DeFi function names
      if (tx.functionName.includes('swap')) {
        type = 'swap';
        description = `Swapped tokens via ${tx.to}`;
      } else if (tx.functionName.includes('mint')) {
        type = 'nft_mint';
        description = `Minted NFT from ${tx.to}`;
      } else {
        description = `Called ${tx.functionName} on contract`;
      }
    } else {
      description = valueInEth === '0.000000' 
        ? 'Contract interaction'
        : `Sent ${valueInEth} ETH`;
    }

    return {
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: tx.value,
      valueInEth,
      gasPrice: tx.gasPrice,
      gasUsed: tx.gasUsed,
      timestamp,
      blockNumber: tx.blockNumber,
      isError: tx.isError === '1',
      functionName: tx.functionName,
      tokenSymbol,
      tokenName,
      tokenValue,
      type,
      description
    };
  }

  // Get transaction details for a specific hash (useful for post creation)
  async getTransactionDetails(hash: string): Promise<Transaction | null> {
    try {
      if (!ETHERSCAN_API_KEY) {
        throw new Error('ETHERSCAN_API_KEY not configured');
      }

      const url = `${this.etherscanBaseUrl}?module=proxy&action=eth_getTransactionByHash&txhash=${hash}&apikey=${ETHERSCAN_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (!data.result) return null;
      
      // Convert to our Transaction format
      const tx = data.result;
      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        valueInEth: (parseInt(tx.value, 16) / 1e18).toFixed(6),
        gasPrice: tx.gasPrice,
        gasUsed: tx.gas,
        timestamp: parseInt(tx.blockNumber, 16),
        blockNumber: tx.blockNumber,
        isError: false,
        type: 'eth_transfer',
        description: 'Transaction'
      };
    } catch (error) {
      console.error('Error fetching transaction details:', error);
      return null;
    }
  }

  // Helper to format transaction for display
  static formatTransactionForDisplay(tx: Transaction): string {
    const date = new Date(tx.timestamp).toLocaleDateString();
    const etherscanUrl = `https://etherscan.io/tx/${tx.hash}`;
    
    return `${tx.description} on ${date} (${tx.hash.slice(0, 10)}...)`;
  }

  // Check if an address has interesting recent activity (for onboarding)
  async hasRecentActivity(address: string, days: number = 30): Promise<boolean> {
    try {
      const transactions = await this.getRecentTransactions(address, 5);
      const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
      
      return transactions.some(tx => tx.timestamp > cutoff && !tx.isError);
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const blockchainReader = new BlockchainReader();
