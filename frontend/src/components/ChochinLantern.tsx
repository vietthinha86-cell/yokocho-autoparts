"use client";

import { useId } from "react";

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
  const uid = useId().replace(/:/g, "");
  const gradId = `lanternFlame-${uid}`;
  const rimId = `lanternRim-${uid}`;

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
      <div className="h-3 w-px bg-gradient-to-b from-zinc-500 to-red-700" />
      <svg viewBox="0 0 80 112" className={`${dimensions} animate-lantern-breath`}>
        <defs>
          <radialGradient id={gradId} cx="50%" cy="46%" r="54%">
            <stop offset="0%" stopColor="#ffd27d" stopOpacity="0.98" />
            <stop offset="38%" stopColor="#e11d2e" stopOpacity="0.97" />
            <stop offset="100%" stopColor="#4c0610" stopOpacity="0.99" />
          </radialGradient>
          <linearGradient id={rimId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff4d5e" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#ff4d5e" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <rect
          x="24"
          y="6"
          width="32"
          height="8"
          rx="2"
          fill="#140b0e"
          stroke="#b91c1c"
          strokeWidth="1.4"
        />
        <ellipse
          cx="40"
          cy="54"
          rx="28"
          ry="40"
          fill={`url(#${gradId})`}
          stroke={`url(#${rimId})`}
          strokeWidth="1.4"
        />
        <path d="M16 36 Q40 42 64 36" fill="none" stroke="#3b0709" strokeWidth="1.3" opacity="0.75" />
        <path d="M12 54 Q40 60 68 54" fill="none" stroke="#3b0709" strokeWidth="1.3" opacity="0.75" />
        <path d="M16 72 Q40 78 64 72" fill="none" stroke="#3b0709" strokeWidth="1.3" opacity="0.75" />
        <text
          x="40"
          y="62"
          textAnchor="middle"
          fill="#160305"
          fontSize="26"
          fontWeight="900"
          style={{ fontFamily: "var(--font-noto-jp), sans-serif" }}
        >
          {kanji}
        </text>
        <rect
          x="26"
          y="92"
          width="28"
          height="7"
          rx="1.5"
          fill="#140b0e"
          stroke="#b91c1c"
          strokeWidth="1.4"
        />
        <line
          x1="40"
          y1="99"
          x2="40"
          y2="111"
          stroke="#e11d2e"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
