import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import ProductImage from "./ProductImage.jsx";
import { formatPrice, getImageUrl, categoryName, getErrorMessage } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function ProductCard({ product }) {
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const outOfStock = !(product.stock > 0);

  const handleAdd = async () => {
    if (!isAuthenticated) return navigate("/login", { state: { from: "/products" } });
    setAdding(true);
    try {
      await addToCart(product._id, 1);
      showToast("Added to your cart");
    } catch (err) {
      showToast(getErrorMessage(err, "Could not add to cart"), "error");
    } finally {
      setAdding(false);
    }
  };

  return (
    <article className="group flex flex-col">
      <Link to={`/products/${product._id}`} className="relative block aspect-[3/4] overflow-hidden bg-cream">
        <ProductImage src={getImageUrl(product)} alt={product.name} className="h-full w-full transition-transform duration-700 group-hover:scale-105" />
        {outOfStock && <span className="absolute left-3 top-3 bg-maroon px-3 py-1 text-xs text-ivory">Out of stock</span>}
      </Link>
      <div className="mt-3 flex flex-1 flex-col">
        <p className="text-xs capitalize text-gold">{categoryName(product)}</p>
        <Link to={`/products/${product._id}`} className="mt-1 line-clamp-2 font-display text-xl leading-snug text-forest hover:text-maroon">
          {product.name}
        </Link>
        <p className="mt-1 text-sm font-medium">{formatPrice(product.price)}</p>
        {product.sizes?.length > 0 && <p className="mt-1 text-xs text-ink/55">Sizes: {product.sizes.join(", ")}</p>}
        <div className="mt-4 flex gap-2">
          <Link to={`/products/${product._id}`} className="btn-outline flex-1 !px-3 !py-2.5">View</Link>
          <button onClick={handleAdd} disabled={outOfStock || adding} className="btn-primary flex-1 !px-3 !py-2.5">
            {adding ? "Adding…" : "Add to cart"}
          </button>
        </div>
      </div>
    </article>
  );
}
