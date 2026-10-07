import { useState } from "react";

// Shows the image, or a tidy placeholder if it is missing or broken.
export default function ProductImage({ src, alt, className = "" }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-cream text-gold ${className}`} role="img" aria-label={alt}>
        <span className="font-display text-4xl">LN</span>
      </div>
    );
  }
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={`object-cover ${className}`} />;
}
