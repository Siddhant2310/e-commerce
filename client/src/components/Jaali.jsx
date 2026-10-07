// Chikankari-style jaali (lattice) motif drawn as an inline SVG pattern.
// Used as a quiet background texture. No external image needed.
export default function Jaali({ color = "#b8964e", opacity = 0.18, size = 56, className = "" }) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 56 56' fill='none' stroke='${color}' stroke-width='1'>
    <circle cx='28' cy='28' r='3'/>
    <ellipse cx='28' cy='16' rx='3' ry='8'/><ellipse cx='28' cy='40' rx='3' ry='8'/>
    <ellipse cx='16' cy='28' rx='8' ry='3'/><ellipse cx='40' cy='28' rx='8' ry='3'/>
    <circle cx='0' cy='0' r='3'/><circle cx='56' cy='0' r='3'/><circle cx='0' cy='56' r='3'/><circle cx='56' cy='56' r='3'/>
  </svg>`;
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{ opacity, backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")` }}
    />
  );
}
