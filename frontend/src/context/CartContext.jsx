import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { apiRequest } from '../lib/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);
const EMPTY_CART = { items: [], subtotalCents: 0 };

export function CartProvider({ children }) {
  const { token, user, restoring } = useAuth();
  const [cart, setCart] = useState(EMPTY_CART);

  const refreshCart = useCallback(async () => {
    if (!token) return;
    const { data } = await apiRequest('/cart', { token });
    setCart(data);
  }, [token]);

  useEffect(() => {
    if (restoring) return;
    if (user) {
      refreshCart();
    } else {
      setCart(EMPTY_CART);
    }
  }, [restoring, user, refreshCart]);

  const value = useMemo(() => {
    const addItem = async (productId, quantity = 1) => {
      const { data } = await apiRequest('/cart/items', {
        method: 'POST',
        token,
        body: { productId, quantity },
      });
      setCart(data);
    };

    const updateQuantity = async (productId, quantity) => {
      const { data } = await apiRequest(`/cart/items/${productId}`, {
        method: 'PATCH',
        token,
        body: { quantity },
      });
      setCart(data);
    };

    const removeItem = async (productId) => {
      const { data } = await apiRequest(`/cart/items/${productId}`, {
        method: 'DELETE',
        token,
      });
      setCart(data);
    };

    const checkout = async (shippingAddress, paymentMethod, card) => {
      const { data: order } = await apiRequest('/orders', {
        method: 'POST',
        token,
        body: { shippingAddress, paymentMethod, card: paymentMethod === 'credit_card' ? card : undefined },
      });
      setCart(EMPTY_CART);
      return order;
    };

    const itemCount = cart.items.reduce((acc, item) => acc + item.quantity, 0);

    return {
      items: cart.items,
      subtotalCents: cart.subtotalCents,
      itemCount,
      addItem,
      updateQuantity,
      removeItem,
      checkout,
      refreshCart,
    };
  }, [cart, token, refreshCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
