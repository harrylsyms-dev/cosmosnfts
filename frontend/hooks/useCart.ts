import { useState, useEffect, useCallback } from 'react';

interface CartItem {
  nftId: number;
  name: string;
  price: number;
  image?: string;
  score: number;
}

interface Cart {
  cartId: string | null;
  items: CartItem[];
  itemCount: number;
  totalPrice: number;
  expiresAt: number | null;
}

interface UseCartReturn {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
  addToCart: (nftId: number) => Promise<void>;
  removeFromCart: (nftId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  isInCart: (nftId: number) => boolean;
  refreshCart: () => Promise<void>;
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

// Get user ID from localStorage or generate new one
function getUserId(): string {
  if (typeof window === 'undefined') return '';

  let userId = localStorage.getItem('cosmonfts_user_id');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('cosmonfts_user_id', userId);
  }
  return userId;
}

export function useCart(): UseCartReturn {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('');

  // Get userId only on client side
  useEffect(() => {
    const id = getUserId();
    setUserId(id);
  }, []);

  useEffect(() => {
    if (userId) {
      fetchCart();
    }
  }, [userId]);

  const fetchCart = useCallback(async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      const res = await fetch(`${apiUrl}/api/cart?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();

      setCart({
        cartId: data.cartId,
        items: data.items || [],
        itemCount: data.itemCount || 0,
        totalPrice: data.totalPrice || 0,
        expiresAt: data.expiresAt,
      });
    } catch (err) {
      console.error('Failed to fetch cart:', err);
      setError('Failed to load cart');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const addToCart = useCallback(
    async (nftId: number) => {
      if (!userId) return;

      try {
        setError(null);
        const res = await fetch(`${apiUrl}/api/cart/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nftId, userId }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to add to cart');
        }

        setCart({
          cartId: data.cartId,
          items: data.items,
          itemCount: data.itemCount,
          totalPrice: data.totalPrice,
          expiresAt: data.expiresAt,
        });
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [userId]
  );

  const removeFromCart = useCallback(
    async (nftId: number) => {
      if (!userId) return;

      try {
        setError(null);
        const res = await fetch(`${apiUrl}/api/cart/remove`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nftId, userId }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to remove from cart');
        }

        // Refresh cart
        await fetchCart();
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [userId, fetchCart]
  );

  const clearCart = useCallback(async () => {
    if (!userId) return;

    try {
      setError(null);
      const res = await fetch(`${apiUrl}/api/cart/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to clear cart');
      }

      setCart({
        cartId: null,
        items: [],
        itemCount: 0,
        totalPrice: 0,
        expiresAt: null,
      });
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [userId]);

  const isInCart = useCallback(
    (nftId: number) => {
      return cart?.items.some((item) => item.nftId === nftId) || false;
    },
    [cart]
  );

  return {
    cart,
    isLoading,
    error,
    addToCart,
    removeFromCart,
    clearCart,
    isInCart,
    refreshCart: fetchCart,
  };
}

export default useCart;
