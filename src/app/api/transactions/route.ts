import { NextResponse } from 'next/server';
import { blockchainReader } from '~/lib/blockchain';

export async function GET(request: Request) {
  // For demo purposes, skip auth check - in production implement proper wallet auth
  const walletAddress = request.headers.get('authorization') ? 'demo-wallet' : null;
  if (!walletAddress) {
    return NextResponse.json({ error: 'Wallet not connected' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!address) {
      return NextResponse.json({ error: 'Address parameter required' }, { status: 400 });
    }

    // Validate Ethereum address format (basic check)
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json({ error: 'Invalid Ethereum address' }, { status: 400 });
    }

    const transactions = await blockchainReader.getRecentTransactions(address, limit);
    
    return NextResponse.json({
      success: true,
      address,
      transactions,
      count: transactions.length
    });
  } catch (error: unknown) {
    console.error('Transactions API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch transactions';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  // For demo purposes, skip auth check - in production implement proper wallet auth
  const walletAddress = request.headers.get('authorization') ? 'demo-wallet' : null;
  if (!walletAddress) {
    return NextResponse.json({ error: 'Wallet not connected' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { hash } = body;

    if (!hash) {
      return NextResponse.json({ error: 'Transaction hash required' }, { status: 400 });
    }

    const transaction = await blockchainReader.getTransactionDetails(hash);
    
    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      transaction
    });
  } catch (error: unknown) {
    console.error('Transaction details API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch transaction details';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
