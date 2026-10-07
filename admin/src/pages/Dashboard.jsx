import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Loader from "../components/Loader.jsx";
import ErrorBox from "../components/ErrorBox.jsx";
import Thumb from "../components/Thumb.jsx";
import { useOrders } from "../context/OrdersContext.jsx";
import { productApi, categoryApi, formatPrice, getErrorMessage } from "../services/api.js";

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const { orders } = useOrders();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [p, c] = await Promise.all([productApi.list(), categoryApi.list()]);
      setProducts(p);
      setCategories(c);
    } catch (e) { setError(getErrorMessage(e, "Could not load dashboard data.")); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  if (loading) return <Loader />;
  if (error) return <ErrorBox message={error} onRetry={load} />;

  const outOfStock = products.filter((p) => !(p.stock > 0));
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 5);
  const stockValue = products.reduce((s, p) => s + p.price * p.stock, 0);
  const pendingOrders = orders.filter((o) => o.orderStatus === "pending").length;
  const stats = [
    ["Orders waiting for you", pendingOrders],
    ["Active products", products.length],
    ["Categories", categories.length],
    ["Low stock (5 or fewer)", lowStock.length],
    ["Out of stock", outOfStock.length],
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl text-forest sm:text-5xl">Dashboard</h1>
        <Link to="/products/new" className="btn-primary">Add product</Link>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        {stats.map(([label, value]) => (
          <div key={label} className={`border p-5 ${label.startsWith("Orders") && value > 0 ? "border-maroon bg-maroon/5" : "border-sand bg-white/60"}`}>
            <p className="font-display text-4xl text-forest">{value}</p>
            <p className="text-sm text-ink/60">{label}</p>
          </div>
        ))}
      </div>
      {pendingOrders > 0 && <p className="mt-4 text-sm"><Link to="/orders" className="text-maroon underline underline-offset-4">{pendingOrders} new {pendingOrders === 1 ? "order needs" : "orders need"} your decision</Link></p>}
      <p className="mt-4 text-sm text-ink/70">Stock value at current prices: <strong>{formatPrice(stockValue)}</strong></p>

      <h2 className="mt-10 text-3xl text-forest">Needs attention</h2>
      {outOfStock.length + lowStock.length === 0 ? (
        <p className="mt-3 text-sm text-ink/60">Every product has healthy stock.</p>
      ) : (
        <ul className="mt-3 divide-y divide-sand border border-sand bg-white/60">
          {[...outOfStock, ...lowStock].map((p) => (
            <li key={p._id} className="flex items-center gap-3 p-3">
              <Thumb src={p.images?.[0]} />
              <span className="flex-1 truncate text-sm">{p.name}</span>
              <span className={`text-sm ${p.stock > 0 ? "text-[#7a5f22]" : "text-maroon"}`}>{p.stock > 0 ? `${p.stock} left` : "Out of stock"}</span>
              <Link to={`/products/${p._id}/edit`} className="text-sm text-forest underline underline-offset-4">Restock</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
