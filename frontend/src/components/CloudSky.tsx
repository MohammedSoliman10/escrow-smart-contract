/**
 * Hand-drawn cumulus sky — pure SVG, no image assets.
 * Scales to any hero size via `preserveAspectRatio="slice"`.
 */
export function CloudSky({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3d95db" />
          <stop offset="50%" stopColor="#77bce9" />
          <stop offset="100%" stopColor="#cfe8f9" />
        </linearGradient>
        <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#fffbe0" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#fffbe0" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hero-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#eef2f6" stopOpacity="0" />
          <stop offset="100%" stopColor="#eef2f6" stopOpacity="1" />
        </linearGradient>
        {/* One reusable cumulus: backlit lobes with a soft blue underside */}
        <g id="cloud">
          <ellipse cx="150" cy="96" rx="150" ry="56" fill="#eef6fd" />
          <ellipse cx="70" cy="104" rx="82" ry="44" fill="#e3f0fb" />
          <ellipse cx="238" cy="106" rx="92" ry="46" fill="#dcecf9" />
          <ellipse cx="150" cy="70" rx="104" ry="58" fill="#ffffff" />
          <ellipse cx="76" cy="82" rx="66" ry="44" fill="#fbfdff" />
          <ellipse cx="224" cy="84" rx="72" ry="46" fill="#f4faff" />
          <ellipse cx="150" cy="46" rx="62" ry="42" fill="#ffffff" />
        </g>
      </defs>

      <rect width="1440" height="900" fill="url(#sky)" />
      <circle cx="1090" cy="150" r="320" fill="url(#sun)" />

      {/* distant wisps */}
      <use href="#cloud" transform="translate(90 160) scale(0.75)" opacity="0.7" />
      <use href="#cloud" transform="translate(1140 280) scale(0.9)" opacity="0.8" />
      <use href="#cloud" transform="translate(620 370) scale(1.1)" opacity="0.85" />

      {/* heavy cumulus bank along the bottom */}
      <use href="#cloud" transform="translate(-140 500) scale(2.0)" />
      <use href="#cloud" transform="translate(400 640) scale(2.5)" />
      <use href="#cloud" transform="translate(1000 520) scale(2.2)" />
      <use href="#cloud" transform="translate(-260 740) scale(2.7)" />
      <use href="#cloud" transform="translate(880 760) scale(2.8)" />

      {/* melt into the page background */}
      <rect y="720" width="1440" height="180" fill="url(#hero-fade)" />
    </svg>
  )
}
