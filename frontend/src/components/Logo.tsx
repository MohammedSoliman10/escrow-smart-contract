export function Logo({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <circle cx="32" cy="32" r="32" fill="#0b0c0e" />
      <path
        d="M32 14v36M16.6 25l30.8 18M16.6 41l30.8-18"
        stroke="#ffffff"
        strokeWidth="6.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
