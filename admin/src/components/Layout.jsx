import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useOrders } from "../context/OrdersContext.jsx";

const NAV = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/orders", label: "Orders" },
  { to: "/products", label: "Products" },
  { to: "/categories", label: "Categories" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { pendingCount } = useOrders();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const link = ({ isActive }) =>
    `block px-5 py-3 text-sm transition-colors ${isActive ? "bg-ivory/10 text-gold border-l-2 border-gold" : "text-ivory/75 hover:text-ivory border-l-2 border-transparent"}`;

  return (
    <div className="min-h-screen lg:flex">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-forest-dark text-ivory transition-transform lg:static lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="px-5 py-6">
          <p className="font-display text-2xl font-semibold leading-tight">Lucknowi Nazakat</p>
          <p className="text-xs text-gold">Admin panel</p>
        </div>
        <nav className="flex-1">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={link} onClick={() => setOpen(false)}>
              <span className="flex items-center justify-between">
                {n.label}
                {n.to === "/orders" && pendingCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-maroon px-1.5 text-[11px] text-ivory">{pendingCount}</span>}
              </span>
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-ivory/10 p-5 text-sm">
          <p className="truncate">{user?.name}</p>
          <p className="truncate text-xs text-ivory/60">{user?.email}</p>
          <button onClick={() => { logout(); navigate("/login"); }} className="mt-3 cursor-pointer text-gold underline underline-offset-4">Log out</button>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="min-w-0 flex-1">
        <header className="flex items-center gap-3 border-b border-sand bg-ivory px-4 py-3 lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Open menu" className="cursor-pointer text-forest">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 7h18M3 12h18M3 17h18" /></svg>
          </button>
          <span className="font-display text-xl font-semibold text-forest">Admin</span>
        </header>
        <main className="p-4 sm:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
