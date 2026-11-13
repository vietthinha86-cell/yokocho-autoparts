"use client";

import Image from "next/image";

interface AnimatedProductVisualProps {
  productId: string;
  category: string;
  src: string;
  alt: string;
  kanjiMark?: string;
  sizes: string;
  index?: number;
  variant?: "card" | "modal";
}

interface MotionPreset {
  coreClass: string;
  secondaryClass?: string;
  badgeLabel: string;
}

const MOTION_PRESETS: Record<string, MotionPreset> = {
  "akari-biled-yami-v9": {
    coreClass:
      "right-[16%] top-[24%] h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(125,211,252,0.48)_0%,rgba(225,29,46,0.26)_48%,transparent_72%)] mix-blend-screen",
    secondaryClass:
      "right-[24%] top-[37%] h-14 w-14 rounded-full border border-sky-300/65 shadow-[0_0_26px_rgba(56,189,248,0.7)]",
    badgeLabel: "LASER CORE LIVE",
  },
  "kuro-fog-kitsune-f30": {
    coreClass:
      "left-[24%] top-[34%] h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.56)_0%,rgba(234,88,12,0.22)_58%,transparent_75%)] mix-blend-screen",
    secondaryClass:
      "right-[22%] top-[34%] h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.56)_0%,rgba(234,88,12,0.22)_58%,transparent_75%)] mix-blend-screen",
    badgeLabel: "3000K DUAL OPTIC",
  },
  "yokocho-tail-oni-seq": {
    coreClass:
      "left-[10%] top-[18%] h-52 w-52 bg-[radial-gradient(ellipse_at_center,rgba(255,46,67,0.75)_0%,rgba(225,29,46,0.22)_46%,transparent_70%)] mix-blend-screen animate-seq-scan",
    secondaryClass:
      "bottom-0 left-[6%] h-20 w-[58%] bg-[radial-gradient(ellipse_at_center,rgba(225,29,46,0.5)_0%,transparent_72%)] mix-blend-screen",
    badgeLabel: "SEQUENTIAL OLED",
  },
  "shinigami-led-bulb-h11": {
    coreClass:
      "left-[42%] top-[44%] h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(224,242,254,0.72)_0%,rgba(56,189,248,0.26)_45%,transparent_72%)] mix-blend-screen",
    secondaryClass:
      "left-[14%] top-[34%] h-24 w-28 rounded-full bg-[radial-gradient(circle,rgba(225,29,46,0.36)_0%,transparent_72%)] mix-blend-screen",
    badgeLabel: "7.200 LM EMITTER",
  },
  "tokyogarage-caliper-4pot": {
    coreClass:
      "right-[22%] top-[20%] h-40 w-24 rounded-full bg-[radial-gradient(ellipse,rgba(255,46,67,0.46)_0%,rgba(245,158,11,0.18)_52%,transparent_75%)] mix-blend-screen",
    secondaryClass:
      "left-[16%] top-[6%] h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(251,146,60,0.44)_0%,transparent_70%)] mix-blend-screen",
    badgeLabel: "FORGED 7075 CNC",
  },
  "yokocho-underbody-amber": {
    coreClass:
      "bottom-[22%] left-[22%] right-[12%] h-14 bg-[radial-gradient(ellipse_at_center,rgba(255,46,67,0.7)_0%,rgba(225,29,46,0.26)_55%,transparent_80%)] mix-blend-screen",
    secondaryClass:
      "bottom-[4%] left-[18%] right-[12%] h-18 bg-[radial-gradient(ellipse_at_top,rgba(225,29,46,0.42)_0%,transparent_75%)] mix-blend-screen",
    badgeLabel: "UNDERGLOW PULSE",
  },
};

const KEN_CLASSES = ["animate-ken-a", "animate-ken-b", "animate-ken-c"];

export function AnimatedProductVisual({
  productId,
  category,
  src,
  alt,
  kanjiMark,
  sizes,
  index = 0,
  variant = "card",
}: AnimatedProductVisualProps) {
  const preset = MOTION_PRESETS[productId] ?? {
    coreClass:
      "inset-x-[20%] top-[25%] h-32 rounded-full bg-[radial-gradient(circle,rgba(255,46,67,0.42)_0%,transparent_72%)] mix-blend-screen",
    badgeLabel: category.toUpperCase(),
  };

  const kenClass = KEN_CLASSES[index % KEN_CLASSES.length];
  const delaySec = `${(index * 0.9) % 4}s`;

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#050204]">
      {/* Continuous Cinemagraph Motion Layer */}
      <div
        className={`relative h-full w-full ${kenClass} transition-transform duration-700 ease-out group-hover:scale-105`}
        style={{ animationDelay: delaySec }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className="photo-razor object-cover transition duration-500 group-hover:brightness-115 group-hover:contrast-115"
        />

        {/* Tailored Animated Optical / Atmospheric Glow synced to camera motion */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute animate-optic-pulse ${preset.coreClass}`}
          style={{ animationDelay: delaySec }}
        />
        {preset.secondaryClass && (
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute animate-optic-pulse ${preset.secondaryClass}`}
            style={{ animationDelay: `${(index * 0.7 + 1.2) % 4}s` }}
          />
        )}
      </div>

      {/* Sharp Diagonal Katana Light Sweep */}
      <div
        aria-hidden="true"
        className="animate-blade-sweep pointer-events-none absolute -top-1/2 bottom-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        style={{ animationDelay: `${index * 1.1}s` }}
      />

      {/* Deep Obsidian Vignette & Subtle Scanline Crispness */}
      <div className="hud-scanlines pointer-events-none absolute inset-0 opacity-35" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#070305] via-transparent to-black/55" />

      {/* Optical Precision Target Reticle Lines */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-3 transition-all duration-300 group-hover:inset-2"
      >
        <span className="absolute top-0 left-0 h-3 w-3 border-t border-l border-red-400/60 transition-colors group-hover:border-[#ff2e43]" />
        <span className="absolute top-0 right-0 h-3 w-3 border-t border-r border-red-400/60 transition-colors group-hover:border-[#ff2e43]" />
        <span className="absolute bottom-0 left-0 h-3 w-3 border-b border-l border-red-400/60 transition-colors group-hover:border-amber-400" />
        <span className="absolute right-0 bottom-0 h-3 w-3 border-r border-b border-red-400/60 transition-colors group-hover:border-amber-400" />
      </div>

      {/* Live Motion Status Micro-Pill */}
      {variant === "card" && (
        <div className="pointer-events-none absolute top-11 left-3 z-10 inline-flex items-center gap-1.5 border border-white/15 bg-black/75 px-2 py-0.5 font-mono text-[9px] tracking-[0.16em] text-zinc-200 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 animate-ping bg-[#ff2e43] shadow-[0_0_8px_#ff2e43]" />
          <span>{preset.badgeLabel}</span>
        </div>
      )}

      {/* Crimson Hanko Kanji Watermark */}
      {kanjiMark && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-4 bottom-8 font-[family-name:var(--font-serif-jp)] text-6xl font-black text-red-500/14 transition-all duration-300 select-none group-hover:scale-110 group-hover:text-red-500/40 group-hover:drop-shadow-[0_0_24px_rgba(255,46,67,0.85)]"
        >
          {kanjiMark}
        </span>
      )}
    </div>
  );
}
