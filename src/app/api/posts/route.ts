import { NextResponse } from 'next/server';
import { verifyAuth } from '~/lib/auth';
import { createPost, getRecentPosts, likePost, unlikePost } from '~/lib/kv';
import type { Transaction } from '~/lib/blockchain';

export async function GET(request: Request) {
  // For demo purposes, allow public access to view posts
  // In production, you might want authentication for personalized feeds

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const posts = await getRecentPosts(limit, offset);
    
    return NextResponse.json({
      success: true,
      posts,
      count: posts.length
    });
  } catch (error: any) {
    console.error('Posts GET error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  // For demo purposes, use wallet address from request
  const walletAddress = request.headers.get('authorization') ? 'demo-wallet' : null;
  if (!walletAddress) {
    return NextResponse.json({ error: 'Wallet not connected' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { transaction, comment, walletAddress } = body;

    // Validate required fields
    if (!transaction || !comment || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: transaction, comment, walletAddress' },
        { status: 400 }
      );
    }

    // Validate comment length
    if (comment.length > 280) {
      return NextResponse.json(
        { error: 'Comment too long (max 280 characters)' },
        { status: 400 }
      );
    }

    // Validate transaction structure
    if (!transaction.hash || !transaction.description) {
      return NextResponse.json(
        { error: 'Invalid transaction data' },
        { status: 400 }
      );
    }

    const post = await createPost({
      fid: 12345, // Mock fid for demo - in production, get from wallet auth
      walletAddress: walletAddress || 'demo-wallet',
      transaction: transaction as Transaction,
      comment: comment.trim()
    });

    return NextResponse.json({
      success: true,
      post
    });
  } catch (error: any) {
    console.error('Posts POST error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create post' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const walletAddress = request.headers.get('authorization') ? 'demo-wallet' : null;
  if (!walletAddress) {
    return NextResponse.json({ error: 'Wallet not connected' }, { status: 401 });
  }
  const fid = 12345; // Mock fid for demo

  try {
    const body = await request.json();
    const { postId, action } = body;

    if (!postId || !action) {
      return NextResponse.json(
        { error: 'Missing postId or action' },
        { status: 400 }
      );
    }

    let success = false;
    
    if (action === 'like') {
      success = await likePost(postId, fid);
    } else if (action === 'unlike') {
      success = await unlikePost(postId, fid);
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "like" or "unlike"' },
        { status: 400 }
      );
    }

    if (!success) {
      return NextResponse.json(
        { error: `Failed to ${action} post` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      action,
      postId
    });
  } catch (error: any) {
    console.error('Posts PATCH error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update post' },
      { status: 500 }
    );
  }
}
