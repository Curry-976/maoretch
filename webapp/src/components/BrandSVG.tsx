type Props = {
  variant?: "full" | "mark";
  className?: string;
  tone?: "brand" | "light";
};

/**
 * Maore-Tech wordmark and standalone mark, rebuilt as inline SVG.
 * - variant="full": phone + wordmark "MAORE-TECH" + tool accent
 * - variant="mark": just the cracked-phone glyph (favicon-ready)
 * - tone="brand": brand blue on transparent background (default)
 * - tone="light": white tint, for use on saturated brand backgrounds
 */
export function BrandSVG({ variant = "full", className = "", tone = "brand" }: Props) {
  const primary = tone === "light" ? "#ffffff" : "#1859b8";
  const accent = tone === "light" ? "#ffffff" : "#0e3f86";
  const screen = tone === "light" ? "#1859b8" : "#ffffff";

  if (variant === "mark") {
    return (
      <svg
        viewBox="0 0 80 120"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="Maore-Tech"
        role="img"
      >
        <Phone primary={primary} accent={accent} screen={screen} />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 340 200"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Maore-Tech"
      role="img"
    >
      {/* Phone — slight tilt to echo the original */}
      <g transform="translate(130 0) rotate(6 40 60)">
        <Phone primary={primary} accent={accent} screen={screen} />
      </g>

      {/* Wordmark */}
      <text
        x="170"
        y="178"
        textAnchor="middle"
        fontFamily="'Bebas Neue', Impact, 'Arial Narrow', sans-serif"
        fontWeight={700}
        fontSize="44"
        letterSpacing="3"
        fill={primary}
      >
        MAORE-TECH
      </text>

      {/* Wrench accent at the end of the wordmark */}
      <g transform="translate(298 152) rotate(38)">
        <rect x="-12" y="-2.5" width="20" height="5" rx="2.5" fill={primary} />
        <circle cx="-14" cy="0" r="5" fill={primary} />
        <circle cx="-14" cy="0" r="2.2" fill={tone === "light" ? "#1859b8" : "#ffffff"} />
      </g>
    </svg>
  );
}

function Phone({
  primary,
  accent,
  screen,
}: {
  primary: string;
  accent: string;
  screen: string;
}) {
  return (
    <>
      {/* Body */}
      <rect x="0" y="0" width="80" height="120" rx="14" ry="14" fill={primary} />
      {/* Subtle bezel highlight */}
      <rect x="0" y="0" width="80" height="120" rx="14" ry="14" fill="none" stroke={accent} strokeWidth="1.5" />
      {/* Camera dot */}
      <circle cx="40" cy="10" r="2.2" fill={accent} />
      {/* Crack starburst on the screen */}
      <g stroke={screen} strokeWidth="2.8" strokeLinecap="round">
        <line x1="40" y1="28" x2="40" y2="92" />
        <line x1="14" y1="42" x2="66" y2="78" />
        <line x1="14" y1="78" x2="66" y2="42" />
        <line x1="10" y1="60" x2="70" y2="60" />
        <line x1="40" y1="22" x2="56" y2="48" />
        <line x1="40" y1="22" x2="24" y2="48" />
        <line x1="40" y1="98" x2="56" y2="72" />
        <line x1="40" y1="98" x2="24" y2="72" />
      </g>
      <circle cx="40" cy="60" r="6.5" fill={screen} />
    </>
  );
}
