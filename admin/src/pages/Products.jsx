import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Loader from "../components/Loader.jsx";
import ErrorBox from "../components/ErrorBox.jsx";
import Thumb from "../components/Thumb.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { productApi, categoryOf, formatPrice, getErrorMessage } from "../services/api.js";

export default function Products() {
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try { setProducts(await productApi.list()); }
    catch (e) { setError(getErrorMessage(e, "Could not load products.")); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const categories = useMemo(() => [...new Set(products.map((p) => categoryOf(p).name).filter(Boolean))].sort(), [products]);
  const visible = useMemo(() => products.filter((p) =>
    (!cat || categoryOf(p).name === cat) && (!search || p.name.toLowerCase().includes(search.toLowerCase()))
  ), [products, search, cat]);

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.name}"? Its images are also removed. This cannot be undone.`)) return;
    setDeletingId(p._id);
    try {
      await productApi.remove(p._id);
      setProducts((list) => list.filter((x) => x._id !== p._id));
      showToast("Product deleted");
    } catch (e) { showToast(getErrorMessage(e, "Could not delete the product"), "error"); }
    finally { setDeletingId(null); }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl text-forest sm:text-5xl">Products</h1>
        <Link to="/products/new" className="btn-primary">Add product</Link>
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input className="input sm:max-w-xs" placeholder="Search by name" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search products" />
        <select className="input sm:max-w-xs" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Filter by category">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="mt-6">
        {loading ? <Loader /> : error ? <ErrorBox message={error} onRetry={load} /> : visible.length === 0 ? (
          <div className="border border-sand bg-cream/60 p-10 text-center">
            <p className="text-ink/70">{products.length === 0 ? "No products yet." : "No products match your filters."}</p>
            {products.length === 0 && <Link to="/products/new" className="btn-primary mt-4">Add your first product</Link>}
          </div>
        ) : (
          <div className="overflow-x-auto border border-sand bg-white/60">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-cream text-ink/70">
                <tr><th className="p-3">Product</th><th className="p-3">Category</th><th className="p-3">Price</th><th className="p-3">Stock</th><th className="p-3 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-sand">
                {visible.map((p) => (
                  <tr key={p._id}>
                    <td className="p-3"><div className="flex items-center gap-3"><Thumb src={p.images?.[0]} /><span className="font-medium">{p.name}</span></div></td>
                    <td className="p-3 capitalize">{categoryOf(p).name || "-"}</td>
                    <td className="p-3">{formatPrice(p.price)}</td>
                    <td className={`p-3 ${p.stock > 0 ? (p.stock <= 5 ? "text-[#7a5f22]" : "") : "text-maroon"}`}>{p.stock > 0 ? p.stock : "Out of stock"}</td>
                    <td className="p-3">
                      <div className="flex justify-end gap-2">
                        <Link to={`/products/${p._id}/edit`} className="btn-outline !px-3 !py-1.5">Edit</Link>
                        <button className="btn-danger" disabled={deletingId === p._id} onClick={() => remove(p)}>{deletingId === p._id ? "Deleting…" : "Delete"}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
