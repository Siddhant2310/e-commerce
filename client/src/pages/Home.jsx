import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Jaali from "../components/Jaali.jsx";
import ProductGrid from "../components/ProductGrid.jsx";
import { ProductSkeletons } from "../components/Loader.jsx";
import { productApi, getErrorMessage } from "../services/api.js";
import { CATEGORIES } from "../constants.js";

// Add a hero image in src/assets/ to use it as the homepage background and feature photo.
const heroFiles = import.meta.glob("../assets/hero.{avif,jpg,jpeg,png,webp}", { eager: true, query: "?url", import: "default" });
const heroImage = Object.values(heroFiles)[0];

const REASONS = [
  { title: "Authentic craftsmanship", text: "Embroidery done by artisans trained in Lucknow's Chikankari tradition." },
  { title: "Premium fabrics", text: "Soft mulmul, georgette and cotton chosen to feel as good as they look." },
  { title: "Secure shopping", text: "Your account and orders are protected with encrypted sign-in." },
  { title: "Easy returns", text: "Not the right fit? Return it and we will make it right." },
];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    productApi.list()
      .then((list) => setProducts(list.slice(0, 8)))
      .catch((e) => setError(getErrorMessage(e, "Could not load products.")))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-forest text-ivory">
        {heroImage && <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />}
        <Jaali opacity={0.22} size={72} />
        <div className="container-x relative grid min-h-[560px] items-center gap-10 py-20 lg:grid-cols-[1.3fr_1fr]">
          <div className="hero-rise">
            <p className="text-sm text-gold">Lucknowi Najakat</p>
            <h1 className="mt-4 text-5xl font-medium leading-[1.05] sm:text-6xl lg:text-8xl">Elegance woven in tradition</h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ivory/80">
              Hand-embroidered Chikankari and refined ethnic wear from the lanes of Lucknow, for weddings, festivals and everyday grace.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link to="/products" className="btn-primary !bg-gold !text-forest-dark hover:!bg-sand">Shop collection</Link>
              <Link to="/products?category=Chikankari" className="inline-flex items-center border border-ivory/60 px-7 py-3 text-sm transition-colors hover:bg-ivory hover:text-forest">Explore Chikankari</Link>
            </div>
          </div>
          {/* Arched frame: a nod to Mughal arches. */}
          <div className="hidden justify-center lg:flex">
            <div className="flex h-[440px] w-[320px] items-end justify-center rounded-t-full border border-gold/60 p-3">
              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-t-full border border-gold/30 bg-forest-dark/60 text-center">
                {heroImage ? (
                  <img src={heroImage} alt="Lucknowi Nazakat collection" className="h-full w-full object-cover" />
                ) : (
                  <span className="px-8 font-display text-2xl italic text-gold/80">Add your photo as src/assets/hero.jpg</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container-x pt-20">
        <h2 className="text-4xl text-forest sm:text-5xl">Shop by category</h2>
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {CATEGORIES.map((c, i) => (
            <Link key={c.name} to={`/products?category=${encodeURIComponent(c.name)}`}
              className={`group relative flex min-h-36 flex-col justify-end overflow-hidden border border-sand p-5 transition-colors hover:border-maroon ${i % 3 === 0 ? "bg-forest text-ivory" : i % 3 === 1 ? "bg-cream" : "bg-maroon text-ivory"} ${i === 0 ? "md:col-span-2" : ""}`}>
              <Jaali opacity={i % 3 === 1 ? 0.2 : 0.14} />
              <h3 className="relative text-2xl">{c.name}</h3>
              <p className="relative text-sm opacity-70">{c.note}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="container-x pt-24">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="text-4xl text-forest sm:text-5xl">New in the collection</h2>
          <Link to="/products" className="text-sm text-maroon underline underline-offset-4">View all</Link>
        </div>
        {loading ? <ProductSkeletons count={4} /> : error ? (
          <p className="border border-maroon/30 bg-maroon/5 p-6 text-maroon">{error}</p>
        ) : products.length === 0 ? (
          <p className="border border-sand bg-cream/60 p-6 text-ink/70">New pieces are on their way. Please check back soon.</p>
        ) : <ProductGrid products={products} />}
      </section>

      {/* Why us */}
      <section className="container-x pt-24">
        <h2 className="text-4xl text-forest sm:text-5xl">Why Lucknowi Nazakat</h2>
        <div className="mt-8 grid gap-px border border-sand bg-sand sm:grid-cols-2 lg:grid-cols-4">
          {REASONS.map((r) => (
            <div key={r.title} className="bg-ivory p-7">
              <h3 className="text-2xl text-maroon">{r.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/70">{r.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-x pt-24">
        <div className="relative overflow-hidden bg-maroon px-6 py-20 text-center text-ivory">
          <Jaali opacity={0.15} />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-4xl sm:text-6xl">Discover the art of Lucknowi elegance</h2>
            <Link to="/products" className="btn-primary mt-8 !bg-gold !text-forest-dark hover:!bg-sand">Shop now</Link>
          </div>
        </div>
      </section>
    </>
  );
}
