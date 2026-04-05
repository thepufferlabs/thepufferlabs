"use client";

import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from "react";

export interface CartItem {
  productId: string;
  slug: string;
  title: string;
  priceCents: number;
  salePriceCents: number | null;
  saleEndsAt: string | null;
  currency: string;
  thumbnailUrl: string;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  isInCart: (productId: string) => boolean;
  subtotalCents: number;
}

const STORAGE_KEY = "puffer_cart";

const CartContext = createContext<CartContextType>({
  items: [],
  itemCount: 0,
  addItem: () => {},
  removeItem: () => {},
  clearCart: () => {},
  isInCart: () => false,
  subtotalCents: 0,
});

export function useCart() {
  return useContext(CartContext);
}

/** Get the effective price for a cart item, accounting for flash sale expiry */
export function getEffectivePrice(item: CartItem): number {
  if (item.salePriceCents != null && item.saleEndsAt && new Date(item.saleEndsAt) > new Date()) {
    return item.salePriceCents;
  }
  return item.priceCents;
}

export default function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored));
    } catch {
      // Ignore corrupt data
    }
    setMounted(true);
  }, []);

  // Persist to localStorage on change (after initial mount)
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, mounted]);

  function addItem(item: CartItem) {
    setItems((prev) => {
      const exists = prev.findIndex((i) => i.productId === item.productId);
      if (exists >= 0) {
        // Replace with updated pricing
        const next = [...prev];
        next[exists] = item;
        return next;
      }
      return [...prev, item];
    });
  }

  function removeItem(productId: string) {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }

  function clearCart() {
    setItems([]);
  }

  function isInCart(productId: string): boolean {
    return items.some((i) => i.productId === productId);
  }

  const subtotalCents = useMemo(() => {
    return items.reduce((sum, item) => sum + getEffectivePrice(item), 0);
  }, [items]);

  const itemCount = items.length;

  return <CartContext.Provider value={{ items, itemCount, addItem, removeItem, clearCart, isInCart, subtotalCents }}>{children}</CartContext.Provider>;
}
