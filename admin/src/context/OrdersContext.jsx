import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { orderApi, getErrorMessage } from "../services/api.js";
import { useAuth } from "./AuthContext.jsx";
import { useToast } from "./ToastContext.jsx";

const OrdersContext = createContext(null);
const POLL_MS = 10000; // check for new orders every 10 seconds

// One shared copy of the orders for the whole admin panel (sidebar badge, dashboard, orders page).
export function OrdersProvider({ children }) {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const knownIds = useRef(null); // ids we have already seen, to detect brand-new orders

  const refresh = useCallback(async (silent = true) => {
    if (!isAdmin) return;
    if (!silent) setLoading(true);
    try {
      const list = await orderApi.list();
      if (knownIds.current) {
        const fresh = list.filter((o) => !knownIds.current.has(o._id));
        if (fresh.length) showToast(fresh.length === 1 ? "A new order has arrived" : `${fresh.length} new orders have arrived`);
      }
      knownIds.current = new Set(list.map((o) => o._id));
      setOrders(list);
      setError("");
      setLastUpdated(new Date());
    } catch (e) {
      setError(e.response?.status === 403
        ? "This account does not have admin permission. Log out and sign in with an admin account."
        : getErrorMessage(e, "Could not load orders."));
    } finally { setLoading(false); }
  }, [isAdmin, showToast]);

  useEffect(() => {
    if (!isAdmin) { setOrders([]); knownIds.current = null; return; }
    refresh(false);
    const timer = setInterval(() => refresh(true), POLL_MS);
    const onWake = () => { if (document.visibilityState === "visible") refresh(true); };
    window.addEventListener("focus", onWake);
    document.addEventListener("visibilitychange", onWake);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", onWake);
      document.removeEventListener("visibilitychange", onWake);
    };
  }, [isAdmin, refresh]);

  const patchOrder = (id, patch) => setOrders((list) => list.map((o) => (o._id === id ? { ...o, ...patch } : o)));
  const pendingCount = orders.filter((o) => o.orderStatus === "pending").length;

  return (
    <OrdersContext.Provider value={{ orders, loading, error, lastUpdated, refresh, patchOrder, pendingCount }}>
      {children}
    </OrdersContext.Provider>
  );
}
export const useOrders = () => useContext(OrdersContext);
