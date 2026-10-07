import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { cartApi, productApi } from "../services/api.js";
import { useAuth } from "./AuthContext.jsx";

const CartContext = createContext(null);

// If the backend returns only a product ID, look the product up so we can show name/image.
async function resolveItems(rawItems) {
  if (!rawItems.some((i) => typeof i.product === "string")) return rawItems;
  try {
    const all = await productApi.list();
    return rawItems.map((i) =>
      typeof i.product === "string" ? { ...i, product: all.find((p) => p._id === i.product) || { _id: i.product, name: "Product", price: 0 } } : i
    );
  } catch {
    return rawItems;
  }
}

export function CartProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const cartOwner = isAuthenticated ? String(user?.id || user?._id || "authenticated") : null;
  const [items, setItems] = useState([]);
  const [requestLoading, setRequestLoading] = useState(false);
  const [loadedFor, setLoadedFor] = useState(null);
  const cartLoading = requestLoading || Boolean(cartOwner && loadedFor !== cartOwner);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      setLoadedFor(null);
      setRequestLoading(false);
      return;
    }

    setRequestLoading(true);
    try {
      const raw = await cartApi.get();
      setItems((await resolveItems(raw)).filter((i) => i.product));
    } catch {
      setItems([]); // e.g. no cart yet
    } finally {
      setLoadedFor(cartOwner);
      setRequestLoading(false);
    }
  }, [isAuthenticated, cartOwner]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  // after every change we re-read the cart: the backend is the source of truth
  const addToCart = async (productId, quantity = 1) => { await cartApi.add(productId, quantity); await fetchCart(); };
  const updateQuantity = async (productId, quantity) => { await cartApi.update(productId, quantity); await fetchCart(); };
  const removeFromCart = async (productId) => { await cartApi.remove(productId); await fetchCart(); };
  const clearCart = async () => { await cartApi.clear(); setItems([]); };

  const cartCount = useMemo(() => items.reduce((n, i) => n + i.quantity, 0), [items]);
  // display only: the backend calculates the real order total
  const subtotal = useMemo(() => items.reduce((s, i) => s + (i.product?.price || 0) * i.quantity, 0), [items]);

  return (
    <CartContext.Provider value={{ cart: items, cartCount, subtotal, cartLoading, fetchCart, addToCart, updateQuantity, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
