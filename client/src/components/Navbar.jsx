import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { CATEGORIES } from "../constants.js";
import SearchBar from "./SearchBar.jsx";

const linkClass = ({ isActive }) =>
  `text-sm tracking-wide transition-colors hover:text-maroon ${isActive ? "text-maroon" : "text-forest"}`;

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const catRef = useRef(null);

  // close the categories dropdown when clicking elsewhere
  useEffect(() => {
    const onClick = (e) => { if (catRef.current && !catRef.current.contains(e.target)) setCatOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const goCategory = (name) => {
    setCatOpen(false);
    setMenuOpen(false);
    navigate(`/products?category=${encodeURIComponent(name)}`);
  };
  const handleLogout = async () => { setMenuOpen(false); await logout(); navigate("/"); };
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-sand bg-ivory/95 backdrop-blur">
      <div className="bg-forest py-1.5 text-center text-xs tracking-wide text-ivory/90">Elegance Woven in Tradition</div>
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Link to="/" className="font-display text-2xl font-semibold tracking-wide text-forest sm:text-3xl" onClick={closeMenu}>
          LUCKNOWI <span className="text-maroon">NAZAKAT</span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          <NavLink to="/" end className={linkClass}>Home</NavLink>
          <NavLink to="/products" end className={linkClass}>Shop</NavLink>
          <div className="relative" ref={catRef}>
            <button onClick={() => setCatOpen((o) => !o)} className="cursor-pointer text-sm tracking-wide text-forest transition-colors hover:text-maroon" aria-expanded={catOpen}>
              Categories ▾
            </button>
            {catOpen && (
              <div className="absolute left-0 top-full mt-3 w-60 border border-sand bg-ivory py-2 shadow-lg">
                {CATEGORIES.map((c) => (
                  <button key={c.name} onClick={() => goCategory(c.name)} className="block w-full cursor-pointer px-5 py-2 text-left text-sm hover:bg-cream hover:text-maroon">
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className="hidden flex-1 justify-center px-4 lg:flex"><SearchBar /></div>

        <div className="flex items-center gap-4">
          <Link to="/cart" className="relative text-sm text-forest hover:text-maroon" aria-label={`Cart, ${cartCount} items`}>
            Cart
            {cartCount > 0 && (
              <span className="absolute -right-4 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-maroon px-1 text-[11px] text-ivory">{cartCount}</span>
            )}
          </Link>
          <div className="hidden items-center gap-4 pl-3 lg:flex">
            {isAuthenticated ? (
              <>
                <NavLink to="/my-orders" className={linkClass}>Orders</NavLink>
                <NavLink to="/profile" className={linkClass}>{user?.name?.split(" ")[0] || "Profile"}</NavLink>
                <button onClick={handleLogout} className="btn-outline !px-4 !py-1.5">Logout</button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={linkClass}>Login</NavLink>
                <Link to="/register" className="btn-primary !px-5 !py-2">Register</Link>
              </>
            )}
          </div>
          <button className="ml-2 cursor-pointer p-1 text-forest lg:hidden" onClick={() => setMenuOpen((o) => !o)} aria-label="Toggle menu" aria-expanded={menuOpen}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              {menuOpen ? <path d="M5 5l14 14M19 5L5 19" /> : <path d="M3 7h18M3 12h18M3 17h18" />}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-sand bg-ivory px-4 pb-6 pt-4 lg:hidden">
          <SearchBar onDone={closeMenu} />
          <div className="mt-4 flex flex-col gap-3 text-forest">
            <Link to="/" onClick={closeMenu}>Home</Link>
            <Link to="/products" onClick={closeMenu}>Shop all</Link>
            <p className="mt-2 text-xs text-gold">Categories</p>
            {CATEGORIES.map((c) => (
              <button key={c.name} onClick={() => goCategory(c.name)} className="cursor-pointer pl-3 text-left text-sm text-ink/80">{c.name}</button>
            ))}
            <hr className="my-2 border-sand" />
            {isAuthenticated ? (
              <>
                <Link to="/my-orders" onClick={closeMenu}>My orders</Link>
                <Link to="/profile" onClick={closeMenu}>Profile</Link>
                <button onClick={handleLogout} className="cursor-pointer text-left text-maroon">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={closeMenu}>Login</Link>
                <Link to="/register" onClick={closeMenu} className="btn-primary">Register</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
