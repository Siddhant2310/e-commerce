import ProductCard from "./ProductCard.jsx";

export default function ProductGrid({ products }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => <ProductCard key={p._id} product={p} />)}
    </div>
  );
}
