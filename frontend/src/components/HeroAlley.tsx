"use client";

import Image from "next/image";
import { ArrowDownRight, Eye, ShieldCheck, Sparkles, Wrench } from "lucide-react";
import { useState } from "react";
import { ChochinLantern } from "./ChochinLantern";
import { MidnightRainCanvas } from "./MidnightRainCanvas";

const NOREN_PANELS = [
  { kanji: "赤", sub: "AKARI" },
  { kanji: "灯", sub: "OPTICS" },
  { kanji: "横", sub: "YOKOCHO" },
  { kanji: "丁", sub: "GARAGE" },
];

export function HeroAlley() {
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    setParallax({ x: Number((-nx * 18).toFixed(1)), y: Number((-ny * 12).toFixed(1)) });
  }

  return (
    <section
      id="top"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setParallax({ x: 0, y: 0 })}
      className="relative min-h-[86vh] overflow-hidden border-b border-red-700/50 bg-[#040204]"
    >
      {/* Parallax + Living Cinemagraph Photograph */}
      <div
        className="pointer-events-none absolute -inset-4 transition-transform duration-300 ease-out"
        style={{ transform: `translate3d(${parallax.x}px, ${parallax.y}px, 0)` }}
      >
        <div className="animate-hero-cinema relative h-full w-full">
          <Image
            src="/images/hero-yokocho.jpg"
            alt="Con hẻm đêm mưa Nhật Bản cùng xe JDM và đèn lồng đỏ Akari Yokocho"
            fill
            priority
            sizes="100vw"
            className="photo-razor object-cover object-center"
          />
        </div>
      </div>

      {/* Left-focused readability scrim so the wet GT-R & lanterns stay razor-sharp on the right */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#040204]/96 via-[#060205]/74 lg:via-[#070306]/42 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#040204] via-transparent to-[#040204]/80" />

      {/* Live 60fps HTML5 Canvas Midnight Rain, Crimson Embers & Asphalt Puddle Ripples */}
      <div className="pointer-events-none absolute inset-0 z-[5]">
        <MidnightRainCanvas intensity="hero" />
      </div>

      {/* Drifting crimson mist + crisp katana laser horizon edge */}
      <div className="animate-mist pointer-events-none absolute inset-x-0 bottom-0 z-[6] h-44 bg-gradient-to-t from-[#1c040a]/75 via-[#2a060e]/25 to-transparent blur-2xl" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[2px] bg-gradient-to-r from-transparent via-[#ff2e43] to-transparent shadow-[0_0_22px_#ff2e43]" />

      {/* Top Split Noren Curtains (Japanese Night Garage Entrance) */}
      <div className="pointer-events-none relative z-10 mx-auto hidden max-w-7xl justify-center gap-2 px-8 md:flex">
        {NOREN_PANELS.map((panel) => (
          <div
            key={panel.kanji}
            className="noren-panel flex h-14 w-24 flex-col items-center justify-center"
          >
            <span className="font-[family-name:var(--font-serif-jp)] text-lg font-black text-[#f3ede8]">
              {panel.kanji}
            </span>
            <span className="font-mono text-[8px] tracking-[0.28em] text-red-400">
              {panel.sub}
            </span>
          </div>
        ))}
      </div>

      {/* Hanging swaying lanterns + Vertical Japanese Neon Signboards */}
      <div className="pointer-events-none absolute top-0 right-10 z-10 hidden items-start gap-7 lg:flex">
        <ChochinLantern kanji="闇" size="lg" />
        <div className="mt-8 flex flex-col items-center border border-red-500/75 bg-[#0c0306]/92 px-2.5 py-4 shadow-[0_0_30px_rgba(225,29,46,0.5)]">
          <span className="vertical-jp neon-flicker font-[family-name:var(--font-serif-jp)] text-sm font-black tracking-[0.35em] text-[#ff3b4e]">
            赤灯横丁
          </span>
          <span className="mt-2 border-t border-red-800/70 pt-1.5 font-mono text-[9px] font-bold text-amber-300">
            24H
          </span>
        </div>
        <ChochinLantern kanji="灯" size="md" className="mt-3" />
        <ChochinLantern kanji="速" size="lg" className="-mt-1" />
      </div>

      {/* Left vertical neon alley rail */}
      <div className="pointer-events-none absolute top-28 left-4 z-10 hidden flex-col items-center gap-3 xl:flex">
        <div className="h-14 w-px bg-gradient-to-b from-transparent to-[#ff2e43]" />
        <span className="vertical-jp font-[family-name:var(--font-serif-jp)] text-xs tracking-[0.42em] text-red-400/90 drop-shadow-[0_0_12px_rgba(255,46,67,0.85)]">
          深夜自動車部品・闇夜光学
        </span>
        <div className="h-14 w-px bg-gradient-to-b from-[#ff2e43] to-transparent" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col justify-center px-4 py-14 sm:px-6 lg:px-14 lg:py-20">
        <div className="max-w-2xl">
          <div className="chamfer-sm mb-5 inline-flex items-center gap-2.5 border border-red-600/70 bg-[#140508]/92 px-4 py-1.5 text-xs tracking-wider text-red-200 shadow-[0_0_24px_rgba(225,29,46,0.28)] backdrop-blur-md">
            <span className="h-2 w-2 animate-ping bg-[#ff2e43] shadow-[0_0_12px_#ff2e43]" />
            <span className="font-mono font-semibold uppercase">
              Kabukicho Midnight Spec • 赤灯自動車整備
            </span>
          </div>

          <h1 className="font-[family-name:var(--font-serif-jp)] text-4xl leading-[1.1] font-black tracking-tight text-[#f5efea] drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)] sm:text-5xl lg:text-6xl">
            Ánh Sáng Xuyên Màn Đêm{" "}
            <span className="bg-gradient-to-r from-[#ff2e43] via-[#ff6a45] to-amber-300 bg-clip-text text-transparent drop-shadow-[0_0_32px_rgba(255,46,67,0.65)]">
              Phố Đèn Đỏ
            </span>
          </h1>

          <p className="mt-5 border-l-2 border-[#ff2e43] bg-gradient-to-r from-[#130508]/80 to-transparent py-1 pl-4 text-base leading-relaxed text-zinc-200 sm:text-lg">
            Kho phụ tùng ô tô, đèn{" "}
            <span className="font-bold text-white">Bi-LED Laser</span>,{" "}
            <span className="font-bold text-amber-300">Bi-Gầm phá sương 3000K</span> và đồ chơi
            JDM thuần chất đêm Tokyo. Cắm giắc zin chuẩn OEM — cắt nét mặt đường trong mưa lớn.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#catalog"
              className="chamfer-sm group relative inline-flex items-center gap-2.5 bg-gradient-to-r from-[#991b1b] via-[#e11d2e] to-[#ff2e43] px-7 py-3.5 text-sm font-bold tracking-wider text-white uppercase shadow-[0_0_36px_rgba(225,29,46,0.65)] transition hover:brightness-115"
            >
              <span>Vào Kệ Hàng Đêm</span>
              <ArrowDownRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5" />
            </a>

            <a
              href="#simulator"
              className="chamfer-sm inline-flex items-center gap-2 border border-amber-400/65 bg-[#12080b]/92 px-5 py-3.5 text-sm font-semibold text-amber-300 shadow-[0_0_24px_rgba(245,158,11,0.18)] backdrop-blur-md transition hover:border-amber-300 hover:bg-amber-950/50 hover:shadow-[0_0_28px_rgba(245,158,11,0.35)]"
            >
              <Sparkles className="h-4 w-4" />
              <span>Thử 2 Tia Đèn Đêm Mưa</span>
            </a>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-4 border-t border-red-900/55 pt-6 sm:grid-cols-3">
            <div className="flex items-start gap-2.5 border-l-2 border-red-600/75 pl-3">
              <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-[#ff4d5e]" />
              <div>
                <p className="text-xs font-bold tracking-wider text-white uppercase">
                  Plug &amp; Play Zin 100%
                </p>
                <p className="text-xs text-zinc-300">Không cắt trích dây điện xe</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 border-l-2 border-amber-500/75 pl-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <div>
                <p className="text-xs font-bold tracking-wider text-white uppercase">
                  Bảo Hành 1 Đổi 1
                </p>
                <p className="text-xs text-zinc-300">Tem điện tử tới 36 tháng</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 border-l-2 border-red-600/75 pl-3">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#ff4d5e]" />
              <div>
                <p className="text-xs font-bold tracking-wider text-white uppercase">
                  Chuẩn Mặt Cắt Nhật
                </p>
                <p className="text-xs text-zinc-300">Sáng gắt nhưng không chói mắt</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom-right Optical Target Telemetry HUD */}
        <a
          href="#simulator"
          className="chamfer-sm group mt-8 hidden items-center gap-4 self-end border border-red-500/60 bg-[#0b0407]/88 px-4 py-2.5 backdrop-blur-md transition hover:border-amber-400/80 lg:inline-flex"
        >
          <span className="h-2.5 w-2.5 animate-pulse bg-[#ff2e43] shadow-[0_0_12px_#ff2e43]" />
          <div className="text-left font-mono text-[11px]">
            <p className="font-bold tracking-wider text-amber-300">
              OPTIC Z-CUTOFF // ALLEY CAM LIVE
            </p>
            <p className="text-zinc-300">3000K Phá Sương • 6000K Laser 9.800 lm</p>
          </div>
          <Eye className="h-4 w-4 text-red-400 transition-transform group-hover:scale-110 group-hover:text-amber-300" />
        </a>
      </div>
    </section>
  );
}
