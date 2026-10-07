import { Link } from "react-router-dom";
import Jaali from "./Jaali.jsx";

const link = "text-ivory/70 transition-colors hover:text-gold";

export default function Footer() {
  return (
    <footer className="relative mt-24 overflow-hidden bg-forest-dark text-ivory">
      <Jaali opacity={0.07} />
      <div className="container-x relative grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h3 className="text-3xl">Lucknowi Nazakat</h3>
          <p className="mt-3 text-sm leading-relaxed text-ivory/70">
            Chikankari and ethnic wear rooted in the craft of Lucknow, made to be worn for generations.
          </p>
        </div>
        <div>
          <h4 className="font-display text-xl text-gold">Quick links</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className={link} to="/">Home</Link></li>
            <li><Link className={link} to="/products">Shop all</Link></li>
            <li><Link className={link} to="/my-orders">My orders</Link></li>
            <li><Link className={link} to="/cart">Cart</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-xl text-gold">Customer support</h4>
          <ul className="mt-3 space-y-2 text-sm text-ivory/70">
            <li>Shipping information</li>
            <li>Returns and exchanges</li>
            <li>Size guide</li>
            <li>Care for Chikankari</li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-xl text-gold">Contact</h4>
          <ul className="mt-3 space-y-2 text-sm text-ivory/70">
            <li>Lucknow, Uttar Pradesh, India</li>
            <li>support@lucknowinazakat.example</li>
            <li>+91 00000 00000</li>
          </ul>
          <div className="mt-4 flex gap-3 text-sm">
            <a href="#" className={link}>Instagram</a>
            <a href="#" className={link}>Facebook</a>
            <a href="#" className={link}>Pinterest</a>
          </div>
        </div>
      </div>
      <div className="relative border-t border-ivory/10 py-5 text-center text-xs text-ivory/50">
        © {new Date().getFullYear()} Lucknowi Nazakat. All rights reserved.
      </div>
    </footer>
  );
}
