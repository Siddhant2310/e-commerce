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
            <li>siddhantmishrafzd@gmail.com</li>
            <li>+916392286218</li>
          </ul>
          <div className="mt-4 flex gap-3 text-sm">
            <a href="https://www.instagram.com/be_happy_forever_2310?stkn=NHl0bjk4eGtidTVv" className={link}>Instagram</a>
            <a href="#" className={link}>Facebook</a>
            <a href="#" className={link}>Pinterest</a>
          </div>
        </div>
      </div>
      <div className="container-x relative border-t border-ivory/10 py-8">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
            <img
              src="/images/developer-photo.jpg"
              alt="Siddhant Mishra, developer"
              className="h-36 w-36 shrink-0 rounded-full border-4 border-gold/80 object-cover shadow-xl ring-4 ring-ivory/10 transition-transform duration-300 hover:scale-105 sm:h-40 sm:w-40"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = "/images/developer-photo-placeholder.jpeg";
              }}
            />
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gold">Meet the developer</p>
              <h4 className="mt-1 font-display text-2xl">Siddhant Mishra</h4>
              <p className="mt-1 text-sm text-ivory/70">Web developer based in Lucknow</p>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-ivory/70">
                From interactive interfaces to full-stack applications, I turn rough ideas into polished digital experiences.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
            <img
              src="/images/partners-photo.jpg"
              alt="Group photo of the Lucknowi Nazakat partners"
              className="h-40 w-full max-w-60 shrink-0 rounded-xl border-4 border-gold/80 object-cover shadow-xl ring-4 ring-ivory/10 transition-transform duration-300 hover:scale-105 sm:h-48 sm:max-w-none sm:w-72"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = "/images/partners-photo-placeholder.svg";
              }}
            />
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gold">Our team</p>
              <h4 className="mt-1 font-display text-2xl">The Partners</h4>
              <p className="mt-1 text-sm text-ivory/70">Together behind Lucknowi Nazakat</p>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-ivory/70">
                A shared love for Lucknow's craft and culture brings our team together to create every piece with care.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="relative border-t border-ivory/10 py-5 text-center text-xs text-ivory/50">
        © {new Date().getFullYear()} Lucknowi Nazakat. All rights reserved.
      </div>
    </footer>
  );
}
