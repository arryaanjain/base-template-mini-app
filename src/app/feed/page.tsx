"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Button } from "~/components/ui/Button";
import { Header } from "~/components/ui/Header";
import { WalletConnection } from "~/components/ui/WalletConnection";
import { fetchWithAuth } from "~/lib/auth";
import { truncateAddress } from "~/lib/truncateAddress";
import type { Post } from "~/lib/kv";
import Link from "next/link";

interface PostCardProps {
  post: Post;
  currentUserFid?: number;
  onLike: (postId: string, isLiked: boolean) => void;
}

function PostCard({ post, currentUserFid, onLike }: PostCardProps) {
  const isLiked = currentUserFid ? post.likedBy.includes(currentUserFid) : false;
  
  const formatValue = () => {
    if (post.transaction.tokenValue && post.transaction.tokenSymbol) {
      return `${post.transaction.tokenValue} ${post.transaction.tokenSymbol}`;
    }
    if (post.transaction.valueInEth !== '0.000000') {
      return `${post.transaction.valueInEth} ETH`;
    }
    return 'Contract interaction';
  };

  const getTypeColor = () => {
    switch (post.transaction.type) {
      case 'swap': return 'bg-blue-100 text-blue-800';
      case 'nft_mint': return 'bg-purple-100 text-purple-800';
      case 'token_transfer': return 'bg-green-100 text-green-800';
      case 'contract_call': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleLike = () => {
    onLike(post.id, isLiked);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      {/* Post Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
            {post.walletAddress.slice(2, 4).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {truncateAddress(post.walletAddress)}
            </p>
            <p className="text-sm text-gray-500">
              {new Date(post.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor()}`}>
          {post.transaction.type.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      {/* User Comment */}
      <div className="mb-4">
        <p className="text-lg text-gray-900">{post.comment}</p>
      </div>

      {/* Transaction Details */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-gray-900">Transaction Details</h4>
          <a
            href={`https://etherscan.io/tx/${post.transaction.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            View on Etherscan ↗
          </a>
        </div>
        
        <p className="text-gray-700 mb-2">{post.transaction.description}</p>
        
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">Value:</span> {formatValue()}
          </div>
          <div>
            <span className="font-medium">To:</span> {truncateAddress(post.transaction.to)}
          </div>
          <div className="col-span-2">
            <span className="font-medium">Hash:</span> {truncateAddress(post.transaction.hash)}
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
          <span>{new Date(post.createdAt).toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
}

export default function Feed() {
  const { isConnected } = useAccount();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserFid, setCurrentUserFid] = useState<number | undefined>();

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
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch posts');
      console.error('Error fetching posts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (postId: string, isCurrentlyLiked: boolean) => {
    try {
      const action = isCurrentlyLiked ? 'unlike' : 'like';
      const response = await fetchWithAuth('/api/posts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, action })
      });

      if (response.ok) {
        // Update the post in local state
        setPosts(prevPosts => 
          prevPosts.map(post => {
            if (post.id === postId) {
              const newLikedBy = isCurrentlyLiked 
                ? post.likedBy.filter(fid => fid !== currentUserFid)
                : [...post.likedBy, currentUserFid!];
              
              return {
                ...post,
                likes: post.likes + (isCurrentlyLiked ? -1 : 1),
                likedBy: newLikedBy
              };
            }
            return post;
          })
        );
      }
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-md w-full mx-auto p-6 bg-white rounded-lg shadow-md">
            <WalletConnection onConnect={fetchPosts} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-2xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Social Feed
            </h1>
            <p className="text-gray-600">
              See what the crypto community is saying about their trades
            </p>
          </div>
          
          <div className="space-x-2">
            <Link href="/send">
              <Button>
                💸 Send ETH
              </Button>
            </Link>
            <Link href="/create">
              <Button className="bg-gray-500 hover:bg-gray-600">
                Browse Transactions
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
                    currentUserFid={currentUserFid}
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
      </main>
      
      {/* Footer removed since it requires activeTab/setActiveTab props */}
    </div>
  );
}
