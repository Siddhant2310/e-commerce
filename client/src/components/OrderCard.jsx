import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge.jsx";
import { formatPrice } from "../services/api.js";

export default function OrderCard({ order }) {
  return (
    <div className="border border-sand bg-white/60 p-5 transition-shadow hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-xl text-forest">Order #{String(order.id).slice(-8).toUpperCase()}</p>
          <p className="text-sm text-ink/60">{order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : ""}</p>
        </div>
        <StatusBadge status={order.orderStatus} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div><p className="text-ink/50">Total</p><p className="font-medium">{formatPrice(order.total)}</p></div>
        <div><p className="text-ink/50">Payment</p><p className="font-medium">{order.paymentMethod}</p></div>
        <div><p className="text-ink/50">Payment status</p><StatusBadge status={order.paymentStatus} /></div>
        <div className="flex items-end sm:justify-end"><Link to={`/orders/${order.id}`} className="btn-outline !px-5 !py-2">View order</Link></div>
      </div>
    </div>
  );
}
