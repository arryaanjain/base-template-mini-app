import { createClient } from '@supabase/supabase-js';

// For local development, you can use these dummy values
// Replace with your actual Supabase project URL and anon key when deploying
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Post {
  id: string;
  transaction_hash: string;
  wallet_address: string;
  comment: string;
  transaction_data: {
    hash: string;
    from: string;
    to: string;
    valueInEth: string;
    tokenValue?: string;
    tokenSymbol?: string;
    gasUsed: string;
    timestamp: number;
    blockNumber: string;
    isError: boolean;
    type: 'eth_transfer' | 'token_transfer' | 'contract_interaction';
    description: string;
  };
  likes: number;
  liked_by: string[]; // Array of user addresses who liked
  created_at: string;
  updated_at: string;
}

// Supabase operations
export async function createPost(post: Omit<Post, 'id' | 'created_at' | 'updated_at'>): Promise<Post | null> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .insert({
        transaction_hash: post.transaction_hash,
        wallet_address: post.wallet_address,
        comment: post.comment,
        transaction_data: post.transaction_data,
        likes: post.likes,
        liked_by: post.liked_by
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating post:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error creating post:', error);
    return null;
  }
}

export async function getRecentPosts(limit: number = 50): Promise<Post[]> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching posts:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

export async function likePost(postId: string, userAddress: string): Promise<Post | null> {
  try {
    // First get the current post
    const { data: currentPost, error: fetchError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (fetchError || !currentPost) {
      console.error('Error fetching post:', fetchError);
      return null;
    }

    const isCurrentlyLiked = currentPost.liked_by.includes(userAddress);
    const newLikedBy = isCurrentlyLiked
      ? currentPost.liked_by.filter((addr: string) => addr !== userAddress)
      : [...currentPost.liked_by, userAddress];

    const { data, error } = await supabase
      .from('posts')
      .update({
        likes: newLikedBy.length,
        liked_by: newLikedBy
      })
      .eq('id', postId)
      .select()
      .single();

    if (error) {
      console.error('Error updating post likes:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error liking post:', error);
    return null;
  }
}
