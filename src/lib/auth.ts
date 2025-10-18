i// import { sdk } from "@farcaster/frame-sdk"; // Not used currentlyport { createClient } from '@farcaster/quick-auth';
import { sdk } from '@farcaster/frame-sdk';

const quickAuth = createClient();

export async function verifyAuth(request: Request): Promise<number | null> {
    const auth = request.headers.get('authorization');
    if (!auth?.startsWith('Bearer ')) return null;

    try {
        const payload = await quickAuth.verifyJwt({
            token: auth.split(' ')[1],
            domain: (new URL(process.env.NEXT_PUBLIC_URL!)).hostname
        });

        return Number(payload.sub);
    } catch (error) {
        console.error('Auth verification failed:', error);
        return null;
    }
}

// Helper to get user info from Farcaster API
export async function getUserInfo(fid: number) {
    try {
        const response = await fetch(
            `https://api.farcaster.xyz/fc/primary-address?fid=${fid}&protocol=ethereum`
        );
        if (!response.ok) return null;

        const data = await response.json();
        return {
            fid,
            address: data?.result?.address?.address
        };
    } catch (error) {
        console.error('Failed to fetch user info:', error);
        return null;
    }
}

// Helper function to make authenticated requests
export async function fetchWithAuth(url: string, options?: RequestInit) {
    try {
        // For our Web3 social app, we'll use a simpler auth approach
        // In a real app, you'd want proper JWT tokens from wallet signatures
        
        // If options include a body, ensure Content-Type is set
        const headers = {
            'Content-Type': 'application/json',
            // For now, we'll use a simple auth header
            // In production, implement proper wallet signature authentication
            'Authorization': 'Bearer wallet-connected',
            ...options?.headers,
        };

        // Make the request with standard fetch
        const response = await fetch(url, {
            ...options,
            headers,
        });

        // Handle non-OK responses
        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }

        return response;
    } catch (error) {
        console.error('fetchWithAuth error:', error);
        throw error; // Re-throw to let the caller handle it
    }
}

// Simple auth verification for our demo
// In production, implement proper wallet signature verification
export async function verifyWalletAuth(request: Request): Promise<string | null> {
    const auth = request.headers.get('authorization');
    if (!auth?.startsWith('Bearer ')) return null;
    
    // For demo purposes, return a mock wallet address
    // In production, verify the wallet signature and return the actual address
    return '0x1234567890123456789012345678901234567890';
}