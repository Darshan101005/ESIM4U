"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";

export interface CartItemData {
  id: number;
  bundle_code: string;
  bundle_name?: string;
  country?: string;
  country_code?: string;
  data_amount?: string;
  validity?: string;
  price: string;
  cost_price?: string;
  currency: string;
  topup_of_order_id?: number | null;
  previous_order_reference?: string | null;
}

export interface AddToCartPayload {
  bundle_code: string;
  bundle_name?: string;
  country?: string;
  country_code?: string;
  data_amount?: string;
  validity?: string;
  price: number;
  cost_price?: number | null;
  currency?: string;
  /** Top-up context — set when recharging an existing eSIM. */
  topup_of_order_id?: number;
  previous_order_reference?: string;
  previous_monty_order_id?: string;
}

type AddResult = "added" | "exists" | "error";

interface CartContextValue {
  items: CartItemData[];
  count: number;
  loading: boolean;
  addToCart: (payload: AddToCartPayload) => Promise<AddResult>;
  removeItem: (id: number) => Promise<boolean>;
  clearCart: () => void;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItemData[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/cart");
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items || []);
    } catch {
      // keep current state on failure
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addToCart = useCallback(async (payload: AddToCartPayload): Promise<AddResult> => {
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.status === 409) return "exists";
      if (!res.ok) return "error";
      const data = await res.json();
      if (data.item) setItems((prev) => [data.item, ...prev]);
      return "added";
    } catch {
      return "error";
    }
  }, []);

  const removeItem = useCallback(async (id: number): Promise<boolean> => {
    try {
      const res = await fetch(`/api/cart?id=${id}`, { method: "DELETE" });
      if (!res.ok) return false;
      setItems((prev) => prev.filter((i) => i.id !== id));
      return true;
    } catch {
      return false;
    }
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  return (
    <CartContext.Provider value={{ items, count: items.length, loading, addToCart, removeItem, clearCart, refresh }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
