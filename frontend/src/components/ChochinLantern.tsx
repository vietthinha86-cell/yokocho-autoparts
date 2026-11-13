interface ChochinLanternProps {
  kanji?: string;
  size?: "sm" | "md" | "lg";
  sway?: boolean;
  className?: string;
}

export function ChochinLantern({
  kanji = "灯",
  size = "md",
  sway = true,
  className = "",
}: ChochinLanternProps) {
  const dimensions =
    size === "sm"
      ? "h-10 w-8"
      : size === "lg"
        ? "h-28 w-20"
        : "h-16 w-12";

  return (
    <div
      className={`relative inline-flex flex-col items-center select-none ${
        sway ? "animate-lantern-sway" : ""
      } ${className}`}
      aria-hidden="true"
    >
      <div className="h-3 w-px bg-gradient-to-b from-zinc-600 to-red-900/70" />
      <svg
        viewBox="0 0 80 112"
        className={`${dimensions} drop-shadow-[0_0_20px_rgba(225,29,46,0.75)]`}
      >
        <defs>
          <radialGradient id="lanternFlame" cx="50%" cy="48%" r="55%">
            <stop offset="0%" stopColor="#ffb347" stopOpacity="0.95" />
            <stop offset="42%" stopColor="#e11d2e" stopOpacity="0.96" />
            <stop offset="100%" stopColor="#580812" stopOpacity="0.98" />
          </radialGradient>
        </defs>
        {/* Top wooden cap */}
        <rect x="24" y="6" width="32" height="8" rx="3" fill="#181014" stroke="#7f1d1d" strokeWidth="1.5" />
        {/* Main paper body */}
        <ellipse cx="40" cy="54" rx="28" ry="40" fill="url(#lanternFlame)" stroke="#ff4d5e" strokeWidth="1.2" />
        {/* Bamboo ribs */}
        <path d="M16 36 Q40 42 64 36" fill="none" stroke="#450a0a" strokeWidth="1.3" opacity="0.65" />
        <path d="M12 54 Q40 60 68 54" fill="none" stroke="#450a0a" strokeWidth="1.3" opacity="0.65" />
        <path d="M16 72 Q40 78 64 72" fill="none" stroke="#450a0a" strokeWidth="1.3" opacity="0.65" />
        {/* Kanji */}
        <text
          x="40"
          y="62"
          textAnchor="middle"
          fill="#1b0507"
          fontSize="26"
          fontWeight="900"
          style={{ fontFamily: "var(--font-serif-jp), serif" }}
        >
          {kanji}
        </text>
        {/* Bottom wooden cap + tassel */}
        <rect x="26" y="92" width="28" height="7" rx="2.5" fill="#181014" stroke="#7f1d1d" strokeWidth="1.5" />
        <line x1="40" y1="99" x2="40" y2="111" stroke="#b91c1c" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

