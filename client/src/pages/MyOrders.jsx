import { useCallback, useEffect, useState } from "react";
import OrderCard from "../components/OrderCard.jsx";
import Loader from "../components/Loader.jsx";
import ErrorState from "../components/ErrorState.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { orderApi, getErrorMessage } from "../services/api.js";

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (silent = false) => {
    if (!silent) { setLoading(true); setError(""); }
    try {
      const list = await orderApi.myOrders();
      setOrders([...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (e) { if (!silent) setError(getErrorMessage(e, "Could not load your orders.")); }
    finally { if (!silent) setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  // refresh in the background so status changes made by the seller show up
  useEffect(() => {
    const refresh = () => load(true);
    const timer = setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    return () => { clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [load]);

  if (loading) return <Loader label="Loading your orders" />;
  if (error) return <ErrorState message={error} onRetry={() => load()} />;
  if (orders.length === 0) return <EmptyState title="No orders yet" text="When you place an order, you can follow it here." actionLabel="Start shopping" actionTo="/products" />;

  return (
    <div className="container-x py-12">
      <h1 className="text-5xl text-forest sm:text-6xl">My orders</h1>
      <div className="mt-8 space-y-4">{orders.map((o) => <OrderCard key={o.id} order={o} />)}</div>
    </div>
  );
}
