const STYLES = {
  pending: "bg-gold/20 text-[#7a5f22]",
  confirmed: "bg-forest/10 text-forest",
  shipped: "bg-sky-100 text-sky-800",
  delivered: "bg-forest text-ivory",
  cancelled: "bg-maroon/10 text-maroon",
  paid: "bg-forest text-ivory",
  failed: "bg-maroon text-ivory",
};
const LABELS = { pending: "New", confirmed: "Accepted", cancelled: "Rejected / cancelled" };

export default function StatusBadge({ status = "pending", plain = false }) {
  const key = String(status).toLowerCase();
  return (
    <span className={`inline-block whitespace-nowrap px-2.5 py-1 text-xs font-medium capitalize ${STYLES[key] || STYLES.pending}`}>
      {plain ? key : LABELS[key] || key}
    </span>
  );
}
