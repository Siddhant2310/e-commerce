import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProductGrid from "../components/ProductGrid.jsx";
import { ProductSkeletons } from "../components/Loader.jsx";
import ErrorState from "../components/ErrorState.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { productApi, categoryName, getErrorMessage } from "../services/api.js";

export default function Products() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("new");
  const [inStockOnly, setInStockOnly] = useState(false);

  const q = params.get("q") || "";
  const category = params.get("category") || "";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try { setProducts(await productApi.list()); }
    catch (e) { setError(getErrorMessage(e, "Could not load products.")); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    setParams(next);
  };

  // category list = our fixed list + any extra categories found in the data
  const categories = useMemo(() => [...new Set(products.map(categoryName).filter(Boolean))].sort(), [products]);
  // URL may say "Kurtis" while the database stores "kurtis": match ignoring case
  const selectedCategory = categories.find((c) => c.toLowerCase() === category.toLowerCase()) ?? "";

  // All filtering happens here, in the browser. To switch to server-side search later, change productApi.list(params).
  const visible = useMemo(() => {
    const text = q.trim().toLowerCase();
    let list = products.filter((p) => {
      if (category && categoryName(p).toLowerCase() !== category.toLowerCase()) return false;
      if (text && !`${p.name} ${p.description} ${categoryName(p)}`.toLowerCase().includes(text)) return false;
      if (minPrice !== "" && p.price < Number(minPrice)) return false;
      if (maxPrice !== "" && p.price > Number(maxPrice)) return false;
      if (inStockOnly && !(p.stock > 0)) return false;
      return true;
    });
    if (sort === "low") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "high") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products, q, category, minPrice, maxPrice, sort, inStockOnly]);

  const reset = () => { setParams({}); setMinPrice(""); setMaxPrice(""); setInStockOnly(false); setSort("new"); };

  return (
    <div className="container-x py-12">
      <h1 className="text-5xl capitalize text-forest sm:text-6xl">{selectedCategory || category || "The collection"}</h1>
      {q && <p className="mt-2 text-ink/70">Results for "{q}"</p>}

      <div className="mt-8 grid gap-10 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-6 lg:sticky lg:top-32 lg:self-start">
          <div>
            <label htmlFor="cat" className="mb-1 block text-sm text-gold">Category</label>
            <select id="cat" value={selectedCategory} onChange={(e) => setParam("category", e.target.value)} className="input">
              <option value="">All categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <p className="mb-1 text-sm text-gold">Price (₹)</p>
            <div className="flex gap-2">
              <input type="number" min="0" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="input" aria-label="Minimum price" />
              <input type="number" min="0" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="input" aria-label="Maximum price" />
            </div>
          </div>
          <div>
            <label htmlFor="sort" className="mb-1 block text-sm text-gold">Sort by</label>
            <select id="sort" value={sort} onChange={(e) => setSort(e.target.value)} className="input">
              <option value="new">Featured</option>
              <option value="low">Price: low to high</option>
              <option value="high">Price: high to low</option>
              <option value="name">Name: A to Z</option>
            </select>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} className="accent-maroon" /> In stock only
          </label>
          <button onClick={reset} className="text-sm text-maroon underline underline-offset-4 cursor-pointer">Clear all filters</button>
        </aside>

        <section>
          {loading ? <ProductSkeletons /> : error ? <ErrorState message={error} onRetry={load} /> : visible.length === 0 ? (
            <EmptyState title="No products found" text="Try a different search or clear the filters." actionLabel="Clear filters" actionTo="/products" />
          ) : (
            <>
              <p className="mb-6 text-sm text-ink/60">{visible.length} {visible.length === 1 ? "piece" : "pieces"}</p>
              <ProductGrid products={visible} />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
