export default function Loader({ label = "Loading" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24" role="status">
      <span className="h-9 w-9 animate-spin rounded-full border-2 border-sand border-t-maroon" />
      <span className="text-sm text-ink/60">{label}…</span>
    </div>
  );
}

export function ProductSkeletons({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[3/4] bg-cream" />
          <div className="mt-3 h-4 w-3/4 bg-cream" />
          <div className="mt-2 h-4 w-1/3 bg-cream" />
        </div>
      ))}
    </div>
  );
}
