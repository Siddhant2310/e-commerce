export default function QuantitySelector({ value, onChange, max = 99, disabled = false }) {
  const btn = "flex h-9 w-9 items-center justify-center text-lg transition-colors hover:bg-cream disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed";
  return (
    <div className="inline-flex items-center border border-sand bg-white/60">
      <button type="button" aria-label="Decrease quantity" className={btn} disabled={disabled || value <= 1} onClick={() => onChange(value - 1)}>−</button>
      <span className="w-10 text-center text-sm" aria-live="polite">{value}</span>
      <button type="button" aria-label="Increase quantity" className={btn} disabled={disabled || value >= max} onClick={() => onChange(value + 1)}>+</button>
    </div>
  );
}
