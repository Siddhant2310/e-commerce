import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Jaali from "../components/Jaali.jsx";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const rows = [["Name", user?.name], ["Email", user?.email], ["Account type", user?.role === "admin" ? "Administrator" : "Customer"]];

  return (
    <div className="container-x max-w-3xl py-12">
      <div className="relative overflow-hidden bg-forest px-8 py-10 text-ivory">
        <Jaali opacity={0.16} />
        <div className="relative flex items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-gold font-display text-3xl text-gold">{(user?.name || "?").charAt(0).toUpperCase()}</div>
          <div><h1 className="text-4xl">{user?.name}</h1><p className="text-sm text-ivory/70">{user?.email}</p></div>
        </div>
      </div>
      <dl className="divide-y divide-sand border-x border-b border-sand">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 px-6 py-4 text-sm"><dt className="text-ink/60">{k}</dt><dd className="font-medium">{v || "-"}</dd></div>
        ))}
      </dl>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/my-orders" className="btn-green">My orders</Link>
        <Link to="/cart" className="btn-outline">Cart</Link>
        <button onClick={async () => { await logout(); navigate("/"); }} className="btn-outline !border-maroon !text-maroon hover:!bg-maroon hover:!text-ivory">Log out</button>
      </div>
    </div>
  );
}
