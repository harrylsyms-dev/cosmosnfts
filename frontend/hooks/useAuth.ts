import { useState, useEffect, useCallback } from 'react';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

interface User {
  id: string;
  walletAddress: string;
  email: string | null;
}

interface Order {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  mintedAt: string | null;
  transactionHash: string | null;
  nfts: {
    id: number;
    tokenId: number;
    name: string;
    image: string | null;
    currentPrice: number;
    status: string;
    transactionHash: string | null;
  }[];
}

interface NFT {
  id: number;
  tokenId: number;
  name: string;
  description: string;
  image: string | null;
  imageIpfsHash: string | null;
  currentPrice: number;
  totalScore: number;
  cosmicScore: number;
  badgeTier: string | null;
  transactionHash: string | null;
  mintedAt: string | null;
}

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (walletAddress: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateEmail: (email: string) => Promise<boolean>;
  orders: Order[];
  nfts: NFT[];
  fetchOrders: () => Promise<void>;
  fetchNfts: () => Promise<void>;
  error: string | null;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!user;

  // Check if user is already logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const res = await fetch(`${apiUrl}/api/auth/me`, {
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        localStorage.removeItem('userToken');
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      localStorage.removeItem('userToken');
    } finally {
      setIsLoading(false);
    }
  }

  const login = useCallback(async (walletAddress: string): Promise<boolean> => {
    setError(null);

    try {
      if (!window.ethereum) {
        setError('MetaMask not installed');
        return false;
      }

      // Step 1: Get nonce from server
      const nonceRes = await fetch(`${apiUrl}/api/auth/nonce`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress }),
      });

      if (!nonceRes.ok) {
        setError('Failed to get authentication nonce');
        return false;
      }

      const { message } = await nonceRes.json();

      // Step 2: Request signature from MetaMask
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, walletAddress],
      });

      // Step 3: Verify signature with server
      const verifyRes = await fetch(`${apiUrl}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ walletAddress, signature }),
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        setError(data.error || 'Authentication failed');
        return false;
      }

      const { token, user: userData } = await verifyRes.json();

      localStorage.setItem('userToken', token);
      setUser(userData);

      return true;
    } catch (err: any) {
      if (err.code === 4001) {
        setError('Signature request was rejected');
      } else {
        setError('Authentication failed');
      }
      console.error('Login failed:', err);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const token = localStorage.getItem('userToken');
      if (token) {
        await fetch(`${apiUrl}/api/auth/logout`, {
          method: 'POST',
          credentials: 'include',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (err) {
      console.error('Logout failed:', err);
    }

    localStorage.removeItem('userToken');
    setUser(null);
    setOrders([]);
    setNfts([]);
  }, []);

  const updateEmail = useCallback(async (email: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) return false;

      const res = await fetch(`${apiUrl}/api/auth/email`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setUser(prev => prev ? { ...prev, email } : null);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to update email:', err);
      return false;
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) return;

      const res = await fetch(`${apiUrl}/api/auth/orders`, {
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  }, []);

  const fetchNfts = useCallback(async () => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) return;

      const res = await fetch(`${apiUrl}/api/auth/nfts`, {
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setNfts(data.nfts || []);
      }
    } catch (err) {
      console.error('Failed to fetch NFTs:', err);
    }
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateEmail,
    orders,
    nfts,
    fetchOrders,
    fetchNfts,
    error,
  };
}

export default useAuth;
