import { useMemo, useState } from "react";
import Loader from "../components/Loader.jsx";
import ErrorBox from "../components/ErrorBox.jsx";
import Thumb from "../components/Thumb.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useOrders } from "../context/OrdersContext.jsx";
import { orderApi, formatPrice, getErrorMessage } from "../services/api.js";

const TABS = ["all", "pending", "confirmed", "shipped", "delivered", "cancelled"];
const TAB_LABEL = { all: "All", pending: "New", confirmed: "Accepted", shipped: "Shipped", delivered: "Delivered", cancelled: "Rejected / cancelled" };

// What the admin can do from each status (mirrors the backend rules)
const ACTIONS = {
  pending: [
    { to: "confirmed", label: "Accept order", style: "btn-primary" },
    { to: "cancelled", label: "Reject order", style: "btn-danger", confirm: "Reject this order? The customer will see it as cancelled and the stock will be returned." },
  ],
  confirmed: [
    { to: "shipped", label: "Mark as shipped", style: "btn-primary" },
    { to: "cancelled", label: "Cancel order", style: "btn-danger", confirm: "Cancel this accepted order? Stock will be returned." },
  ],
  shipped: [{ to: "delivered", label: "Mark as delivered", style: "btn-primary" }],
};

const fmtDate = (d) => (d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "-");
const shortId = (o) => String(o._id).slice(-8).toUpperCase();

export default function Orders() {
  const { showToast } = useToast();
  const { orders, loading, error, lastUpdated, refresh, patchOrder } = useOrders();
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [busy, setBusy] = useState(false);

  const counts = useMemo(() => {
    const c = { all: orders.length };
    orders.forEach((o) => { c[o.orderStatus] = (c[o.orderStatus] || 0) + 1; });
    return c;
  }, [orders]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => (tab === "all" || o.orderStatus === tab) &&
      (!q || `${shortId(o)} ${o.user?.name || ""} ${o.user?.email || ""} ${o.shippingAddress?.fullName || ""} ${o.shippingAddress?.phone || ""}`.toLowerCase().includes(q)));
  }, [orders, tab, search]);

  const selected = orders.find((o) => o._id === selectedId) || null;

  const changeStatus = async (order, action) => {
    if (action.confirm && !window.confirm(action.confirm)) return;
    setBusy(true);
    try {
      const updated = await orderApi.updateStatus(order._id, action.to);
      patchOrder(order._id, { orderStatus: updated.orderStatus, paymentStatus: updated.paymentStatus });
      showToast(`Order #${shortId(order)} is now ${action.to}`);
    } catch (e) { showToast(getErrorMessage(e, "Could not update the order"), "error"); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl text-forest sm:text-5xl">Orders</h1>
        <div className="flex items-center gap-3">
          {lastUpdated && <span className="text-xs text-ink/60">Updated {lastUpdated.toLocaleTimeString("en-IN")} · checks every 10 s</span>}
          <button onClick={() => refresh(false)} className="btn-outline">Refresh now</button>
        </div>
      </div>
      {error && orders.length > 0 && <p role="alert" className="mt-4 border border-maroon/30 bg-maroon/5 p-3 text-sm text-maroon">Live updates paused: {error}</p>}

      <div className="mt-6 flex flex-wrap gap-2" role="tablist">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={`cursor-pointer border px-4 py-2 text-sm transition-colors ${tab === t ? "border-forest bg-forest text-ivory" : "border-sand hover:border-forest"}`}>
            {TAB_LABEL[t]} <span className="opacity-70">({counts[t] || 0})</span>
          </button>
        ))}
      </div>
      <input className="input mt-4 sm:max-w-sm" placeholder="Search order ID, customer, phone" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search orders" />

      <div className="mt-6">
        {loading && orders.length === 0 ? <Loader label="Loading orders" /> : error && orders.length === 0 ? <ErrorBox message={error} onRetry={() => refresh(false)} /> : visible.length === 0 ? (
          <p className="border border-sand bg-cream/60 p-10 text-center text-ink/70">{orders.length === 0 ? "No orders have been placed yet. New orders appear here automatically." : "No orders in this view."}</p>
        ) : (
          <div className="overflow-x-auto border border-sand bg-white/60">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-cream text-ink/70">
                <tr><th className="p-3">Order</th><th className="p-3">Customer</th><th className="p-3">Items</th><th className="p-3">Total</th><th className="p-3">Payment</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-sand">
                {visible.map((o) => (
                  <tr key={o._id} className={o.orderStatus === "pending" ? "bg-gold/5" : ""}>
                    <td className="p-3"><p className="font-medium">#{shortId(o)}</p><p className="text-xs text-ink/60">{fmtDate(o.createdAt)}</p></td>
                    <td className="p-3"><p>{o.shippingAddress?.fullName || o.user?.name}</p><p className="text-xs text-ink/60">{o.shippingAddress?.city}</p></td>
                    <td className="p-3">{o.items.reduce((n, i) => n + i.quantity, 0)}</td>
                    <td className="p-3">{formatPrice(o.totalAmount)}</td>
                    <td className="p-3"><p>{o.paymentMethod}</p><StatusBadge status={o.paymentStatus} plain /></td>
                    <td className="p-3"><StatusBadge status={o.orderStatus} /></td>
                    <td className="p-3">
                      <div className="flex justify-end gap-2">
                        <button className="btn-outline !px-3 !py-1.5" onClick={() => setSelectedId(o._id)}>Details</button>
                        {o.orderStatus === "pending" && (
                          <>
                            <button className="btn-primary !px-3 !py-1.5" disabled={busy} onClick={() => changeStatus(o, ACTIONS.pending[0])}>Accept</button>
                            <button className="btn-danger" disabled={busy} onClick={() => changeStatus(o, ACTIONS.pending[1])}>Reject</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={() => setSelectedId(null)}>
          <aside role="dialog" aria-label="Order details" className="h-full w-full max-w-lg overflow-y-auto bg-ivory p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-3xl text-forest">Order #{shortId(selected)}</h2>
                <p className="text-sm text-ink/60">Placed {fmtDate(selected.createdAt)}</p>
              </div>
              <button onClick={() => setSelectedId(null)} aria-label="Close" className="cursor-pointer text-2xl leading-none text-ink/60">×</button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2"><StatusBadge status={selected.orderStatus} /><StatusBadge status={selected.paymentStatus} plain /></div>

            <h3 className="mt-6 text-2xl text-forest">Customer</h3>
            <p className="text-sm">{selected.user?.name || "-"}<br /><span className="text-ink/60">{selected.user?.email}</span></p>

            <h3 className="mt-5 text-2xl text-forest">Ship to</h3>
            <p className="text-sm leading-relaxed">
              {selected.shippingAddress?.fullName}<br />{selected.shippingAddress?.address}<br />
              {[selected.shippingAddress?.city, selected.shippingAddress?.state, selected.shippingAddress?.pincode].filter(Boolean).join(", ")}<br />
              Phone: {selected.shippingAddress?.phone}
            </p>

            <h3 className="mt-5 text-2xl text-forest">Items</h3>
            <ul className="divide-y divide-sand border-y border-sand">
              {selected.items.map((i, idx) => (
                <li key={idx} className="flex items-center gap-3 py-3">
                  <Thumb src={i.image || i.product?.images?.[0]} className="h-16 w-12" />
                  <div className="flex-1 text-sm"><p className="font-medium">{i.name}</p><p className="text-ink/60">{i.quantity} × {formatPrice(i.price)}</p></div>
                  <p className="text-sm">{formatPrice(i.price * i.quantity)}</p>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex justify-between font-medium"><span>Total ({selected.paymentMethod})</span><span>{formatPrice(selected.totalAmount)}</span></div>

            {ACTIONS[selected.orderStatus] ? (
              <div className="mt-8 flex flex-wrap gap-3">
                {ACTIONS[selected.orderStatus].map((a) => (
                  <button key={a.to} disabled={busy} onClick={() => changeStatus(selected, a)} className={`${a.style} ${a.style === "btn-danger" ? "!px-5 !py-2.5" : ""}`}>{busy ? "Please wait…" : a.label}</button>
                ))}
              </div>
            ) : <p className="mt-8 text-sm text-ink/60">This order is closed. No further changes are possible.</p>}
          </aside>
        </div>
      )}
    </div>
  );
}
