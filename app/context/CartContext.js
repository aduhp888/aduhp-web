'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext({
  cart: [],
  totalItems: 0,
  totalPrice: 0,
  isCartOpen: false,
  lastAddedItem: null,
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  openCart: () => {},
  closeCart: () => {},
  toggleCart: () => {}
});

const CART_STORAGE_KEY = 'aduhp_cart_items_v1';

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // 1. Hydrate cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setCart(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to parse cart from localStorage:', e);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // 2. Persist cart to localStorage on changes
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.warn('Failed to save cart to localStorage:', e);
    }
  }, [cart, isHydrated]);

  // Add Item to Cart
  const addToCart = (product, variant = null, color = null, quantity = 1) => {
    if (!product) return;

    const ram = variant?.ram || product.ram_gb || 8;
    const storage = variant?.storage || product.storage_gb || 256;
    const colorName = color || product.color || 'Standard';
    const price = variant?.price || product.price || 0;
    const maxStock = variant?.stock !== undefined ? Number(variant.stock) : (product.stock !== undefined ? Number(product.stock) : 5);
    const image = (Array.isArray(product.images) && product.images[0]) ? product.images[0] : (product.image || '');
    
    // Unique identifier for this specific product + variant + color configuration
    const itemKey = `${product.id}_${ram}GB_${storage}GB_${colorName}`;

    setCart(prev => {
      const existingIdx = prev.findIndex(item => item.id === itemKey);
      if (existingIdx > -1) {
        // Update existing item quantity
        const updated = [...prev];
        const currentQty = updated[existingIdx].quantity || 1;
        const newQty = Math.min(currentQty + quantity, maxStock > 0 ? maxStock : currentQty + quantity);
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: newQty,
          maxStock: maxStock
        };
        return updated;
      } else {
        // Add new item
        const newItem = {
          id: itemKey,
          productId: product.id,
          name: product.name,
          brand: product.brand || '',
          condition: product.condition || 'baru',
          grade: product.grade || '',
          ram,
          storage,
          color: colorName,
          price,
          quantity: Math.min(quantity, maxStock > 0 ? maxStock : quantity),
          maxStock: maxStock > 0 ? maxStock : 10,
          image
        };
        return [...prev, newItem];
      }
    });

    setLastAddedItem({
      name: product.name,
      variant: `${ram}/${storage}GB`,
      color: colorName,
      time: Date.now()
    });

    // Auto-open cart drawer to show feedback
    setIsCartOpen(true);
  };

  // Remove Item from Cart
  const removeFromCart = (cartItemId) => {
    setCart(prev => prev.filter(item => item.id !== cartItemId));
  };

  // Update Item Quantity
  const updateQuantity = (cartItemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart(prev => prev.map(item => {
      if (item.id === cartItemId) {
        const cappedQty = item.maxStock ? Math.min(newQuantity, item.maxStock) : newQuantity;
        return { ...item, quantity: cappedQty };
      }
      return item;
    }));
  };

  // Clear Entire Cart
  const clearCart = () => {
    setCart([]);
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen(prev => !prev);

  // Computed Totals
  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const totalPrice = cart.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);

  return (
    <CartContext.Provider value={{
      cart,
      totalItems,
      totalPrice,
      isCartOpen,
      lastAddedItem,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      openCart,
      closeCart,
      toggleCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
