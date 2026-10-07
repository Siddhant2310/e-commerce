export default function Loader({ label = "Loading" }) {
  return (
    <div className="flex flex-col items-center gap-3 py-20" role="status">
      <span className="h-9 w-9 animate-spin rounded-full border-2 border-sand border-t-forest" />
      <span className="text-sm text-ink/60">{label}…</span>
    </div>
  );
}
