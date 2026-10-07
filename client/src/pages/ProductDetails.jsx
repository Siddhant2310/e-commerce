import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Loader from "../components/Loader.jsx";
import ErrorState from "../components/ErrorState.jsx";
import ProductImage from "../components/ProductImage.jsx";
import QuantitySelector from "../components/QuantitySelector.jsx";
import { productApi, formatPrice, getImageUrls, categoryName, getErrorMessage } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImg, setActiveImg] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const p = await productApi.get(id);
      if (!p || !p._id) throw new Error("not found");
      setProduct(p);
      setActiveImg(0);
      setQuantity(1);
    } catch (e) {
      setError(e.response?.status === 404 ? "This product is no longer available." : getErrorMessage(e, "Could not load this product."));
    } finally { setLoading(false); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  if (loading) return <Loader />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const images = getImageUrls(product);
  const outOfStock = !(product.stock > 0);

  // size/colour are shown for the shopper; the cart API only stores product + quantity.
  const addItem = async (goToCheckout) => {
    if (!isAuthenticated) return navigate("/login", { state: { from: `/products/${id}` } });
    setBusy(true);
    try {
      await addToCart(product._id, quantity);
      if (goToCheckout) navigate("/checkout");
      else showToast("Added to your cart");
    } catch (e) {
      showToast(getErrorMessage(e, "Could not add to cart"), "error");
    } finally { setBusy(false); }
  };

  const chip = (active) => `cursor-pointer border px-4 py-2 text-sm transition-colors ${active ? "border-forest bg-forest text-ivory" : "border-sand hover:border-forest"}`;

  return (
    <div className="container-x py-10">
      <nav className="mb-6 text-sm text-ink/60"><Link to="/products" className="hover:text-maroon">Shop</Link> / <span className="capitalize">{categoryName(product)}</span> / {product.name}</nav>
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <div className="aspect-[4/5] overflow-hidden bg-cream">
            <ProductImage src={images[activeImg]} alt={product.name} className="h-full w-full transition-transform duration-700 hover:scale-110" />
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-3 overflow-x-auto">
              {images.map((src, i) => (
                <button key={src + i} onClick={() => setActiveImg(i)} aria-label={`Show image ${i + 1}`}
                  className={`h-20 w-16 shrink-0 cursor-pointer overflow-hidden border-2 ${i === activeImg ? "border-maroon" : "border-transparent"}`}>
                  <ProductImage src={src} alt="" className="h-full w-full" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-sm capitalize text-gold">{categoryName(product)}</p>
          <h1 className="mt-1 text-4xl leading-tight text-forest sm:text-5xl">{product.name}</h1>
          <p className="mt-4 text-3xl font-medium text-maroon">{formatPrice(product.price)}</p>
          <p className="mt-1 text-xs text-ink/50">Inclusive of all taxes</p>
          <p className="mt-6 max-w-prose leading-relaxed text-ink/80">{product.description}</p>

          {product.sizes?.length > 0 && (
            <div className="mt-7">
              <p className="mb-2 text-sm text-gold">Size</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => <button key={s} onClick={() => setSize(s)} className={chip(size === s)}>{s}</button>)}
              </div>
            </div>
          )}
          {product.colors?.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-sm text-gold">Colour</p>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c) => <button key={c} onClick={() => setColor(c)} className={chip(color === c)}>{c}</button>)}
              </div>
            </div>
          )}

          <p className={`mt-7 text-sm ${outOfStock ? "font-medium text-maroon" : "text-forest"}`}>
            {outOfStock ? "Out of stock" : product.stock <= 5 ? `Only ${product.stock} left` : "In stock"}
          </p>

          {!outOfStock && (
            <div className="mt-4">
              <p className="mb-2 text-sm text-gold">Quantity</p>
              <QuantitySelector value={quantity} onChange={setQuantity} max={product.stock} />
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button className="btn-outline flex-1" disabled={outOfStock || busy} onClick={() => addItem(false)}>{busy ? "Please wait…" : "Add to cart"}</button>
            <button className="btn-primary flex-1" disabled={outOfStock || busy} onClick={() => addItem(true)}>Buy now</button>
          </div>
        </div>
      </div>
    </div>
  );
}
