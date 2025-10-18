"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Button } from "~/components/ui/Button";
import { PageLayout } from "~/components/ui/PageLayout";
import { WalletConnection } from "~/components/ui/WalletConnection";
import { fetchWithAuth } from "~/lib/auth";
import { truncateAddress } from "~/lib/truncateAddress";
import type { Post } from "~/lib/supabase";
import Link from "next/link";

interface PostCardProps {
  post: Post;
  currentUserAddress?: string;
  onLike: (postId: string) => void;
}

function PostCard({ post, currentUserAddress, onLike }: PostCardProps) {
  const isLiked = currentUserAddress ? post.liked_by.includes(currentUserAddress) : false;
  
  const formatValue = () => {
    if (post.transaction_data.tokenValue && post.transaction_data.tokenSymbol) {
      return `${post.transaction_data.tokenValue} ${post.transaction_data.tokenSymbol}`;
    }
    if (post.transaction_data.valueInEth !== '0.000000') {
      return `${post.transaction_data.valueInEth} ETH`;
    }
    return 'Contract interaction';
  };

  const getTypeColor = () => {
    switch (post.transaction_data.type) {
      case 'eth_transfer': return 'bg-blue-100 text-blue-800';
      case 'token_transfer': return 'bg-green-100 text-green-800';
      case 'contract_interaction': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleLike = () => {
    onLike(post.id);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      {/* Post Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
            {post.wallet_address.slice(2, 4).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {truncateAddress(post.wallet_address)}
            </p>
            <p className="text-sm text-gray-500">
              {new Date(post.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor()}`}>
          {post.transaction_data.type.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      {/* User Comment */}
      <div className="mb-4">
        <p className="text-lg text-black">{post.comment}</p>
      </div>

      {/* Transaction Details */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-black">Transaction Details</h4>
          <a
            href={`https://etherscan.io/tx/${post.transaction_data.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            View on Etherscan ↗
          </a>
        </div>
        
        <p className="text-gray-700 mb-2">{post.transaction_data.description}</p>
        
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">Value:</span> {formatValue()}
          </div>
          <div>
            <span className="font-medium">To:</span> {truncateAddress(post.transaction_data.to)}
          </div>
          <div className="col-span-2">
            <span className="font-medium">Hash:</span> {truncateAddress(post.transaction_data.hash)}
          </div>
        </div>
      </div>

      {/* Post Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleLike}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
            isLiked 
              ? 'bg-red-50 text-red-600 hover:bg-red-100' 
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          }`}
        >
          <span>{isLiked ? '❤️' : '🤍'}</span>
          <span>{post.likes}</span>
        </button>
        
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span>{new Date(post.created_at).toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
}

export default function Feed() {
  const { isConnected, address } = useAccount();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected) {
      fetchPosts();
      // TODO: Get current user's fid from context
    }
  }, [isConnected]);

  const fetchPosts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetchWithAuth('/api/posts?limit=50');
      const data = await response.json();
      
      if (data.success) {
        setPosts(data.posts);
      } else {
        setError(data.error || 'Failed to fetch posts');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch posts';
      setError(errorMessage);
      console.error('Error fetching posts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!address) return;
    
    try {
      const response = await fetchWithAuth('/api/posts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, userAddress: address })
      });

      if (response.ok) {
        const { post: updatedPost } = await response.json();
        // Update the post in local state
        setPosts(prevPosts => 
          prevPosts.map(post => post.id === postId ? updatedPost : post)
        );
      }
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  if (!isConnected) {
    return (
      <PageLayout title="Social Feed">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="max-w-md w-full mx-auto p-6 bg-white rounded-lg shadow-md text-center">
            <h2 className="text-xl font-semibold text-black mb-4">Connect Your Wallet</h2>
            <p className="text-gray-600 mb-6">Connect your wallet to see the social feed and interact with posts!</p>
            <WalletConnection onConnect={fetchPosts} />
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Social Feed">
            <div className="p-4 space-y-6">
        {/* Action Buttons */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-black">Ready to make a transaction?</h3>
              <p className="text-sm text-gray-600">Send ETH and share your crypto puns!</p>
            </div>
            <Link href="/send">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                💸 Send ETH
              </Button>
            </Link>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
            <Button 
              onClick={fetchPosts} 
              className="mt-2 bg-gray-500 hover:bg-gray-600"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && posts.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading posts...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Posts */}
            {posts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">�</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Welcome to CryptoSocial!
                </h3>
                <p className="text-gray-600 mb-6">
                  Send some ETH, add a witty pun, and share it with the world! 
                  <br />Be the first to post your trading humor.
                </p>
                <Link href="/send">
                  <Button>
                    💸 Send Your First Transaction
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUserAddress={address}
                    onLike={handleLike}
                  />
                ))}
                
                {posts.length >= 20 && (
                  <div className="text-center py-8">
                    <Button onClick={fetchPosts} className="bg-gray-500 hover:bg-gray-600">
                      Load More Posts
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </PageLayout>
  );
}
