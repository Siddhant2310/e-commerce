const STYLES = {
  pending: "bg-sand/60 text-ink",
  confirmed: "bg-forest/10 text-forest",
  shipped: "bg-gold/20 text-[#7a5f22]",
  delivered: "bg-forest text-ivory",
  cancelled: "bg-maroon/10 text-maroon",
  paid: "bg-forest text-ivory",
  failed: "bg-maroon text-ivory",
};

export default function StatusBadge({ status = "pending" }) {
  const key = String(status).toLowerCase();
  return (
    <span className={`inline-block px-3 py-1 text-xs font-medium capitalize ${STYLES[key] || STYLES.pending}`}>
      {key}
    </span>
  );
}
