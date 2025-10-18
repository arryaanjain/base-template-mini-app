"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Button } from "~/components/ui/Button";
import { Header } from "~/components/ui/Header";
import { WalletConnection } from "~/components/ui/WalletConnection";
import { fetchWithAuth } from "~/lib/auth";
import { truncateAddress } from "~/lib/truncateAddress";
import type { Transaction } from "~/lib/blockchain";

interface TransactionCardProps {
  transaction: Transaction;
  onSelect: (tx: Transaction) => void;
  isSelected: boolean;
}

function TransactionCard({ transaction, onSelect, isSelected }: TransactionCardProps) {
  const formatValue = () => {
    if (transaction.tokenValue && transaction.tokenSymbol) {
      return `${transaction.tokenValue} ${transaction.tokenSymbol}`;
    }
    if (transaction.valueInEth !== '0.000000') {
      return `${transaction.valueInEth} ETH`;
    }
    return 'Contract interaction';
  };

  const getTypeColor = () => {
    switch (transaction.type) {
      case 'swap': return 'bg-blue-100 text-blue-800';
      case 'nft_mint': return 'bg-purple-100 text-purple-800';
      case 'token_transfer': return 'bg-green-100 text-green-800';
      case 'contract_call': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div 
      className={`p-4 border rounded-lg cursor-pointer transition-all ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={() => onSelect(transaction)}
    >
      <div className="flex justify-between items-start mb-2">
        <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor()}`}>
          {transaction.type.replace('_', ' ').toUpperCase()}
        </span>
        <span className="text-sm text-gray-500">
          {new Date(transaction.timestamp).toLocaleDateString()}
        </span>
      </div>
      
      <p className="font-medium text-gray-900 mb-1">{transaction.description}</p>
      
      <div className="text-sm text-gray-600 space-y-1">
        <p><strong>Value:</strong> {formatValue()}</p>
        <p><strong>To:</strong> {truncateAddress(transaction.to)}</p>
        <p><strong>Hash:</strong> {truncateAddress(transaction.hash)}</p>
      </div>
      
      {transaction.isError && (
        <div className="mt-2 text-red-600 text-sm">⚠️ Failed transaction</div>
      )}
    </div>
  );
}

export default function CreatePost() {
  const { address, isConnected } = useAccount();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (isConnected && address) {
      fetchTransactions();
    }
  }, [isConnected, address]);

  const fetchTransactions = async () => {
    if (!address) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetchWithAuth(`/api/transactions?address=${address}&limit=20`);
      const data = await response.json();
      
      if (data.success) {
        // Filter out failed transactions and transactions with no meaningful data
        const validTxs = data.transactions.filter((tx: Transaction) => 
          !tx.isError && 
          (tx.valueInEth !== '0.000000' || tx.tokenValue || tx.type !== 'eth_transfer')
        );
        setTransactions(validTxs);
      } else {
        setError(data.error || 'Failed to fetch transactions');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch transactions');
      console.error('Error fetching transactions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedTx || !comment.trim()) return;

    try {
      setIsLoading(true);
      
      // TODO: Create API endpoint to save posts
      const response = await fetchWithAuth('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction: selectedTx,
          comment: comment.trim(),
          walletAddress: address
        })
      });

      if (response.ok) {
        // Reset form
        setSelectedTx(null);
        setComment('');
        // TODO: Redirect to feed or show success message
        alert('Post created successfully!');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create post');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to create post');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-md w-full mx-auto p-6 bg-white rounded-lg shadow-md">
            <WalletConnection onConnect={fetchTransactions} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create a Post
          </h1>
          <p className="text-gray-600">
            Select a recent transaction and add your witty commentary
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
            <Button 
              onClick={fetchTransactions} 
              className="mt-2 bg-gray-500 hover:bg-gray-600"
            >
              Retry
            </Button>
          </div>
        )}

        {isLoading && transactions.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your transactions...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Your Recent Transactions ({transactions.length})
              </h2>
              
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">
                    No recent transactions found. Make sure you have some transaction history on Ethereum mainnet.
                  </p>
                  <Button onClick={fetchTransactions} className="bg-gray-500 hover:bg-gray-600">
                    Refresh
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {transactions.map((tx) => (
                    <TransactionCard
                      key={tx.hash}
                      transaction={tx}
                      onSelect={setSelectedTx}
                      isSelected={selectedTx?.hash === tx.hash}
                    />
                  ))}
                </div>
              )}
            </div>

            {selectedTx && (
              <div className="bg-white p-6 rounded-lg border">
                <h3 className="text-lg font-semibold mb-4">Add Your Comment</h3>
                
                <div className="mb-4 p-4 bg-gray-50 rounded border">
                  <p className="font-medium">{selectedTx.description}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(selectedTx.timestamp).toLocaleString()}
                  </p>
                </div>

                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add your witty comment about this transaction... 🚀"
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  maxLength={280}
                />
                
                <div className="flex justify-between items-center mt-4">
                  <span className="text-sm text-gray-500">
                    {comment.length}/280 characters
                  </span>
                  
                  <Button 
                    onClick={handleSubmit}
                    disabled={!comment.trim() || isLoading}
                    isLoading={isLoading}
                  >
                    Create Post
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
      
      {/* Footer removed since it requires activeTab/setActiveTab props */}
    </div>
  );
}
