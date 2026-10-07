import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Loader from "../components/Loader.jsx";
import ErrorState from "../components/ErrorState.jsx";
import ProductImage from "../components/ProductImage.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { orderApi, formatPrice, getImageUrl, getErrorMessage } from "../services/api.js";
import { useToast } from "../context/ToastContext.jsx";

const STEPS = ["pending", "confirmed", "shipped", "delivered"];
const MESSAGES = {
  pending: "Your order is placed. Waiting for the seller to accept it.",
  confirmed: "The seller has accepted your order and is preparing it.",
  shipped: "Your order has been shipped and is on its way.",
  delivered: "Delivered. Thank you for shopping with Lucknowi Nazakat.",
  cancelled: "This order was cancelled (by you or the seller). Any reserved items were returned to stock.",
};

// An order line may hold a populated `product`, or copy name/price/image onto the line itself.
const lineInfo = (item) => {
  const p = typeof item.product === "object" && item.product ? item.product : {};
  return {
    id: p._id || item._id,
    name: item.name || p.name || "Product",
    price: item.price ?? p.price ?? 0,
    image: getImageUrl(p) || getImageUrl(item),
  };
};

export default function OrderDetails() {
  const { id } = useParams();
  const { showToast } = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  // silent = background refresh: no spinner, and errors are ignored
  const load = useCallback(async (silent = false) => {
    if (!silent) { setLoading(true); setError(""); }
    try { setOrder(await orderApi.get(id)); }
    catch (e) { if (!silent) setError(e.response?.status === 404 ? "We could not find this order." : getErrorMessage(e, "Could not load this order.")); }
    finally { if (!silent) setLoading(false); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  // pick up the seller's accept / reject / shipped updates without a manual reload
  useEffect(() => {
    const refresh = () => load(true);
    const timer = setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    return () => { clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [load]);

  const cancel = async () => {
    if (!window.confirm("Cancel this order? This cannot be undone.")) return;
    setCancelling(true);
    try {
      await orderApi.cancel(id);
      showToast("Order cancelled");
      await load(true);
    } catch (e) { showToast(getErrorMessage(e, "Could not cancel this order"), "error"); }
    finally { setCancelling(false); }
  };

  if (loading) return <Loader label="Loading order" />;
  if (error) return <ErrorState message={error} onRetry={() => load()} />;

  const status = String(order.orderStatus || "pending").toLowerCase();
  const cancellable = status === "pending" || status === "confirmed";
  const addr = order.shippingAddress || {};
  const stepIndex = STEPS.indexOf(status);

  return (
    <div className="container-x py-12">
      <Link to="/my-orders" className="text-sm text-maroon underline underline-offset-4">Back to my orders</Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl text-forest sm:text-5xl">Order #{String(order.id).slice(-8).toUpperCase()}</h1>
          <p className="text-sm text-ink/60">Placed on {order.createdAt ? new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" }) : "-"}</p>
        </div>
        <StatusBadge status={status} />
      </div>

      <p className={`mt-4 border-l-2 px-4 py-2 text-sm ${status === "cancelled" ? "border-maroon bg-maroon/5 text-maroon" : "border-forest bg-cream/60"}`}>{MESSAGES[status]}</p>

      {status !== "cancelled" && stepIndex >= 0 && (
        <ol className="mt-8 grid grid-cols-4 gap-2" aria-label="Order progress">
          {STEPS.map((s, i) => (
            <li key={s} className="text-center">
              <div className={`h-1.5 ${i <= stepIndex ? "bg-forest" : "bg-sand"}`} />
              <p className={`mt-2 text-xs capitalize sm:text-sm ${i <= stepIndex ? "text-forest" : "text-ink/40"}`}>{s}</p>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_340px]">
        <ul className="divide-y divide-sand border-y border-sand">
          {order.items.map((item, i) => {
            const l = lineInfo(item);
            return (
              <li key={l.id || i} className="flex gap-4 py-4">
                <div className="h-24 w-20 shrink-0 overflow-hidden bg-cream"><ProductImage src={l.image} alt={l.name} className="h-full w-full" /></div>
                <div className="flex-1">
                  <p className="font-display text-xl text-forest">{l.name}</p>
                  <p className="text-sm text-ink/60">Qty {item.quantity} × {formatPrice(l.price)}</p>
                </div>
                <p className="font-medium">{formatPrice(l.price * item.quantity)}</p>
              </li>
            );
          })}
        </ul>

        <aside className="h-fit space-y-6 border border-sand bg-cream/60 p-6 text-sm">
          <div className="flex justify-between text-base font-medium"><span>Total</span><span>{formatPrice(order.total)}</span></div>
          <div>
            <h2 className="text-2xl text-forest">Shipping address</h2>
            <p className="mt-1 leading-relaxed text-ink/80">
              {addr.fullName}<br />{addr.address}<br />{[addr.city, addr.state, addr.pincode].filter(Boolean).join(", ")}<br />{addr.phone}
            </p>
          </div>
          <div>
            <h2 className="text-2xl text-forest">Payment</h2>
            <p className="mt-1">{order.paymentMethod}</p>
            <div className="mt-2"><StatusBadge status={order.paymentStatus} /></div>
          </div>
          {cancellable && <button onClick={cancel} disabled={cancelling} className="btn-outline w-full !border-maroon !text-maroon hover:!bg-maroon hover:!text-ivory">{cancelling ? "Cancelling…" : "Cancel order"}</button>}
        </aside>
      </div>
    </div>
  );
}
