import { useState } from "react";

export default function Thumb({ src, alt = "", className = "h-12 w-10" }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <div className={`flex items-center justify-center bg-cream text-xs text-gold ${className}`}>LN</div>;
  return <img src={src} alt={alt} onError={() => setFailed(true)} className={`object-cover ${className}`} />;
}
