export function Logo({ size = 38, reverse = false }: { size?: number; reverse?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-label="Daily Desk" style={{ flex: "none", display: "block" }}>
      <rect width="120" height="120" rx="28" fill={reverse ? "#FFFFFF" : "var(--primary)"} />
      <path fill={reverse ? "var(--primary)" : "#FFFFFF"} fillRule="evenodd" d="M22 30h12a30 30 0 0 1 0 60H22z M33 43h1a17 17 0 0 1 0 34h-1z" />
      <path
        fill="var(--accent)"
        fillRule="evenodd"
        stroke={reverse ? "#FFFFFF" : "var(--primary)"}
        strokeWidth={6}
        strokeLinejoin="round"
        paintOrder="stroke"
        d="M56 30h12a30 30 0 0 1 0 60H56z M67 43h1a17 17 0 0 1 0 34h-1z"
      />
    </svg>
  );
}
