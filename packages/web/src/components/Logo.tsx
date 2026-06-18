/** Animated forge mark: an anvil with a flickering ember spark. */
export function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <defs>
        <linearGradient id="ember" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffd27a" />
          <stop offset="100%" stopColor="#ff7a18" />
        </linearGradient>
      </defs>
      {/* anvil */}
      <path
        d="M7 17h14l-2 4H12l-1 3H9l1-3H8a3 3 0 0 1-3-3v-1h2zm12-2H9v-2h13v1a1 1 0 0 1-1 1z"
        fill="url(#ember)"
        opacity="0.95"
      />
      {/* spark */}
      <g>
        <circle cx="24" cy="8" r="2.2" fill="#ffd27a">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="1.6s" repeatCount="indefinite" />
          <animate attributeName="r" values="1.8;2.6;1.8" dur="1.6s" repeatCount="indefinite" />
        </circle>
        <circle cx="27.5" cy="5" r="1" fill="#ffae4d">
          <animate attributeName="opacity" values="0;1;0" dur="2.1s" repeatCount="indefinite" />
        </circle>
      </g>
    </svg>
  );
}
