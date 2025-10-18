import { NextRequest, NextResponse } from 'next/server';
import { createPost, getRecentPosts, likePost } from '~/lib/supabase';
import type { Transaction } from '~/lib/blockchain';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const posts = await getRecentPosts(limit);
    
    return NextResponse.json({ success: true, posts });
  } catch (error: unknown) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { transaction, comment, walletAddress }: { 
      transaction: Transaction; 
      comment: string; 
      walletAddress: string; 
    } = await request.json();
    
    if (!transaction || !comment || !walletAddress) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Convert transaction type to match Supabase Post interface
    const convertedType = transaction.type === 'contract_call' ? 'contract_interaction' as const :
                         transaction.type === 'nft_mint' ? 'contract_interaction' as const :
                         transaction.type === 'swap' ? 'contract_interaction' as const :
                         transaction.type as 'eth_transfer' | 'token_transfer';

    const post = await createPost({
      transaction_hash: transaction.hash,
      wallet_address: walletAddress,
      comment,
      transaction_data: {
        ...transaction,
        type: convertedType
      },
      likes: 0,
      liked_by: []
    });

    if (post) {
      return NextResponse.json({ success: true, post }, { status: 201 });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to create post' },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create post' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { postId, userAddress }: { postId: string; userAddress: string } = await request.json();
    
    if (!postId || !userAddress) {
      return NextResponse.json(
        { success: false, error: 'Missing postId or userAddress' },
        { status: 400 }
      );
    }

    const updatedPost = await likePost(postId, userAddress);
    
    if (updatedPost) {
      return NextResponse.json({ success: true, post: updatedPost });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to update post' },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error('Error updating post:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update post' },
      { status: 500 }
    );
  }
}
