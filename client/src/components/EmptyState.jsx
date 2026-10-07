import { Link } from "react-router-dom";
import Jaali from "./Jaali.jsx";

export default function EmptyState({ title, text, actionLabel, actionTo }) {
  return (
    <div className="container-x py-16">
      <div className="relative overflow-hidden border border-sand bg-cream/60 px-6 py-16 text-center">
        <Jaali opacity={0.15} />
        <div className="relative">
          <h2 className="text-3xl text-forest sm:text-4xl">{title}</h2>
          {text && <p className="mx-auto mt-3 max-w-md text-ink/70">{text}</p>}
          {actionLabel && (
            <Link to={actionTo} className="btn-primary mt-8">{actionLabel}</Link>
          )}
        </div>
      </div>
    </div>
  );
}
