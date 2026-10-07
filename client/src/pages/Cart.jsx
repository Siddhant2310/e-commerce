import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import Loader from "../components/Loader.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ProductImage from "../components/ProductImage.jsx";
import QuantitySelector from "../components/QuantitySelector.jsx";
import { formatPrice, getImageUrl, getErrorMessage } from "../services/api.js";

export default function Cart() {
  const { cart, subtotal, cartLoading, updateQuantity, removeFromCart, clearCart } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [busyId, setBusyId] = useState(null);

  // runs any cart action, shows errors, and disables that row while waiting
  const run = async (id, action, okMessage) => {
    setBusyId(id);
    try { await action(); if (okMessage) showToast(okMessage); }
    catch (e) { showToast(getErrorMessage(e, "Could not update your cart"), "error"); }
    finally { setBusyId(null); }
  };

  if (cartLoading && cart.length === 0) return <Loader label="Loading your cart" />;
  if (cart.length === 0) {
    return <EmptyState title="Your cart is empty" text="Pieces you add will wait for you here." actionLabel="Continue shopping" actionTo="/products" />;
  }

  return (
    <div className="container-x py-12">
      <h1 className="text-5xl text-forest sm:text-6xl">Your cart</h1>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <ul className="divide-y divide-sand border-y border-sand">
          {cart.map((item) => {
            const p = item.product;
            const busy = busyId === p._id;
            return (
              <li key={p._id} className="flex gap-4 py-5">
                <Link to={`/products/${p._id}`} className="h-32 w-24 shrink-0 overflow-hidden bg-cream sm:h-36 sm:w-28">
                  <ProductImage src={getImageUrl(p)} alt={p.name} className="h-full w-full" />
                </Link>
                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex justify-between gap-3">
                    <div>
                      <Link to={`/products/${p._id}`} className="font-display text-xl text-forest hover:text-maroon sm:text-2xl">{p.name}</Link>
                      <p className="text-sm text-ink/60">{formatPrice(p.price)} each</p>
                    </div>
                    <p className="font-medium">{formatPrice(p.price * item.quantity)}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <QuantitySelector value={item.quantity} max={p.stock || 99} disabled={busy}
                      onChange={(q) => run(p._id, () => updateQuantity(p._id, q))} />
                    <button disabled={busy} onClick={() => run(p._id, () => removeFromCart(p._id), "Removed from cart")}
                      className="cursor-pointer text-sm text-maroon underline underline-offset-4 disabled:opacity-50">Remove</button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <aside className="h-fit border border-sand bg-cream/60 p-6 lg:sticky lg:top-32">
          <h2 className="text-3xl text-forest">Summary</h2>
          <div className="mt-5 flex justify-between text-sm"><span>Subtotal</span><span className="font-medium">{formatPrice(subtotal)}</span></div>
          <p className="mt-2 text-xs text-ink/60">Shipping and the final total are confirmed when you place the order.</p>
          <button className="btn-primary mt-6 w-full" onClick={() => navigate("/checkout")}>Proceed to checkout</button>
          <Link to="/products" className="btn-outline mt-3 w-full">Continue shopping</Link>
          <button onClick={() => { if (window.confirm("Remove everything from your cart?")) run("all", clearCart, "Cart cleared"); }}
            className="mt-4 w-full cursor-pointer text-center text-sm text-ink/60 underline underline-offset-4">Clear cart</button>
        </aside>
      </div>
    </div>
  );
}
