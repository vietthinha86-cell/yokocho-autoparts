"use client";

import Image from "next/image";
import { ArrowDownRight, Eye, ShieldCheck, Sparkles, Wrench } from "lucide-react";
import { useRef, useState } from "react";
import { ChochinLantern } from "./ChochinLantern";
import { MidnightRainCanvas, type CanvasPointerTarget } from "./MidnightRainCanvas";

const NOREN_PANELS = [
  { kanji: "赤", sub: "AKARI" },
  { kanji: "灯", sub: "OPTICS" },
  { kanji: "横", sub: "YOKOCHO" },
  { kanji: "丁", sub: "GARAGE" },
];

export function HeroAlley() {
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const pointerRef = useRef<CanvasPointerTarget>({ x: 0, y: 0, active: false });

  function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    pointerRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true,
    };
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    setParallax({ x: Number((-nx * 18).toFixed(1)), y: Number((-ny * 12).toFixed(1)) });
  }

  return (
    <section
      id="top"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        pointerRef.current = { ...pointerRef.current, active: false };
        setParallax({ x: 0, y: 0 });
      }}
      className="relative overflow-hidden border-b border-red-700/50 bg-[#040204]"
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
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#040204] via-transparent to-[#040204]/75" />

      {/* Live 60fps HTML5 Canvas Midnight Rain, Crimson Embers & Pointer Optical Vortex */}
      <div className="pointer-events-none absolute inset-0 z-[5]">
        <MidnightRainCanvas intensity="hero" pointerRef={pointerRef} />
      </div>

      {/* Montfort-Inspired Spatial Bi-LED Glass Ring Emblem at Optical Vortex Core */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[24%] right-[14%] z-[7] hidden h-48 w-48 items-center justify-center transition-transform duration-300 ease-out lg:flex"
        style={{
          transform: `translate3d(${(-parallax.x * 0.7).toFixed(1)}px, ${(-parallax.y * 0.7).toFixed(1)}px, 0)`,
        }}
      >
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,46,67,0.22)_0%,rgba(245,158,11,0.1)_48%,transparent_72%)] blur-xl" />
        <div className="animate-orbit-slow absolute inset-2 rounded-full border border-dashed border-amber-400/35" />
        <div className="animate-orbit-reverse absolute inset-7 rounded-full border border-[#ff2e43]/55 shadow-[0_0_24px_rgba(255,46,67,0.35),inset_0_0_20px_rgba(245,158,11,0.18)]" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-white/25 bg-black/35 shadow-[0_0_32px_rgba(255,46,67,0.45),inset_0_1px_0_rgba(255,255,255,0.3)] backdrop-blur-[2px]">
          <span className="font-jp text-2xl font-black text-amber-300/90 drop-shadow-[0_0_12px_rgba(245,158,11,0.8)]">
            光
          </span>
        </div>
      </div>

      {/* Drifting crimson mist + crisp katana laser horizon edge */}
      <div className="animate-mist pointer-events-none absolute inset-x-0 bottom-0 z-[6] h-40 bg-gradient-to-t from-[#1c040a]/75 via-[#2a060e]/25 to-transparent blur-2xl" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[2px] bg-gradient-to-r from-transparent via-[#ff2e43] to-transparent shadow-[0_0_22px_#ff2e43]" />

      {/* Top Split Noren Curtains (Japanese Night Garage Entrance) */}
      <div className="pointer-events-none relative z-10 mx-auto hidden max-w-7xl justify-center gap-2 px-8 md:flex">
        {NOREN_PANELS.map((panel) => (
          <div
            key={panel.kanji}
            className="noren-panel flex h-12 w-24 flex-col items-center justify-center"
          >
            <span className="font-jp text-base font-black text-[#f6f1ec]">
              {panel.kanji}
            </span>
            <span className="font-display text-[9px] font-semibold tracking-[0.26em] text-red-400">
              {panel.sub}
            </span>
          </div>
        ))}
      </div>

      {/* Hanging swaying lanterns + Vertical Japanese Neon Signboards */}
      <div className="pointer-events-none absolute top-0 right-10 z-10 hidden items-start gap-7 lg:flex">
        <ChochinLantern kanji="闇" size="lg" />
        <div className="mt-7 flex flex-col items-center border border-red-500/75 bg-[#0c0306]/92 px-2.5 py-3.5 shadow-[0_0_30px_rgba(225,29,46,0.5)]">
          <span className="vertical-jp neon-flicker font-jp text-sm font-black tracking-[0.35em] text-[#ff3b4e]">
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
      <div className="pointer-events-none absolute top-24 left-4 z-10 hidden flex-col items-center gap-3 xl:flex">
        <div className="h-12 w-px bg-gradient-to-b from-transparent to-[#ff2e43]" />
        <span className="vertical-jp font-jp text-xs tracking-[0.42em] text-red-400/90 drop-shadow-[0_0_12px_rgba(255,46,67,0.85)]">
          深夜自動車部品・闇夜光学
        </span>
        <div className="h-12 w-px bg-gradient-to-b from-[#ff2e43] to-transparent" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col justify-center px-4 pt-8 pb-12 sm:px-6 lg:px-14 lg:pt-9 lg:pb-16">
        <div className="max-w-2xl">
          <div className="chamfer-sm mb-4 inline-flex items-center gap-2.5 border border-red-600/70 bg-[#140508]/92 px-3.5 py-1.5 shadow-[0_0_24px_rgba(225,29,46,0.28)] backdrop-blur-md">
            <span className="h-2 w-2 animate-ping bg-[#ff2e43] shadow-[0_0_12px_#ff2e43]" />
            <span className="font-mono text-[11px] font-semibold tracking-[0.14em] text-red-200 uppercase">
              Kabukicho Midnight Spec
            </span>
            <span className="text-red-700">/</span>
            <span className="font-jp text-[11px] font-bold tracking-[0.18em] text-amber-300">
              赤灯自動車整備
            </span>
          </div>

          <h1 className="font-display text-3xl leading-[1.08] font-bold tracking-[-0.015em] text-[#f6f1ec] drop-shadow-[0_4px_24px_rgba(0,0,0,0.92)] sm:text-5xl lg:text-[3.35rem]">
            <span className="block sm:whitespace-nowrap">Ánh Sáng Xuyên Màn Đêm</span>
            <span className="mt-1.5 block bg-gradient-to-r from-[#ff2e43] via-[#ff6a45] to-amber-300 bg-clip-text text-transparent drop-shadow-[0_0_32px_rgba(255,46,67,0.65)]">
              Phố Đèn Đỏ
            </span>
          </h1>

          <p className="mt-4 max-w-xl border-l-2 border-[#ff2e43] bg-gradient-to-r from-[#130508]/82 to-transparent py-1 pl-4 text-sm leading-relaxed text-zinc-200 sm:text-base">
            Kho phụ tùng ô tô, đèn{" "}
            <span className="font-bold text-white">Bi-LED Laser</span>,{" "}
            <span className="font-bold text-amber-300">Bi-Gầm phá sương 3000K</span> và đồ chơi
            JDM thuần chất đêm Tokyo. Cắm giắc zin chuẩn OEM — cắt nét mặt đường trong mưa lớn.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3.5">
            <a
              href="#catalog"
              className="chamfer-sm font-display group relative inline-flex items-center gap-2.5 bg-gradient-to-r from-[#991b1b] via-[#e11d2e] to-[#ff2e43] px-6 py-3 text-sm font-bold tracking-[0.12em] text-white uppercase shadow-[0_0_36px_rgba(225,29,46,0.65)] transition hover:brightness-115"
            >
              <span>Vào Kệ Hàng Đêm</span>
              <ArrowDownRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5" />
            </a>

            <a
              href="#simulator"
              className="chamfer-sm font-display inline-flex items-center gap-2 border border-amber-400/65 bg-[#12080b]/92 px-5 py-3 text-sm font-semibold tracking-wide text-amber-300 shadow-[0_0_24px_rgba(245,158,11,0.18)] backdrop-blur-md transition hover:border-amber-300 hover:bg-amber-950/50 hover:shadow-[0_0_28px_rgba(245,158,11,0.35)]"
            >
              <Sparkles className="h-4 w-4" />
              <span>Thử 2 Tia Đèn Đêm Mưa</span>
            </a>
          </div>
        </div>

        {/* Bottom aligned row: 3 Trust Pillars (left) + Optical Alley Cam HUD (right) */}
        <div className="mt-8 flex flex-col gap-5 border-t border-red-900/55 pt-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid max-w-2xl flex-1 grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex items-start gap-2.5 border-l-2 border-red-600/75 pl-3">
              <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-[#ff4d5e]" />
              <div>
                <p className="font-display text-xs font-bold tracking-wider text-white uppercase">
                  Plug &amp; Play Zin 100%
                </p>
                <p className="mt-0.5 text-xs text-zinc-300">Không cắt trích dây điện xe</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 border-l-2 border-amber-500/75 pl-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <div>
                <p className="font-display text-xs font-bold tracking-wider text-white uppercase">
                  Bảo Hành 1 Đổi 1
                </p>
                <p className="mt-0.5 text-xs text-zinc-300">Tem điện tử tới 36 tháng</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 border-l-2 border-red-600/75 pl-3">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#ff4d5e]" />
              <div>
                <p className="font-display text-xs font-bold tracking-wider text-white uppercase">
                  Chuẩn Mặt Cắt Nhật
                </p>
                <p className="mt-0.5 text-xs text-zinc-300">Sáng gắt nhưng không chói mắt</p>
              </div>
            </div>
          </div>

          <a
            href="#simulator"
            className="chamfer-sm group hidden items-center gap-3.5 border border-red-500/60 bg-[#0b0407]/88 px-4 py-2.5 backdrop-blur-md transition hover:border-amber-400/80 lg:inline-flex"
          >
            <span className="h-2 w-2 animate-pulse bg-[#ff2e43] shadow-[0_0_12px_#ff2e43]" />
            <div className="text-left font-mono text-[11px]">
              <p className="font-bold tracking-wider text-amber-300">
                OPTIC Z-CUTOFF // ALLEY CAM LIVE
              </p>
              <p className="text-zinc-300">3000K Phá Sương • 6000K Laser 9.800 lm</p>
            </div>
            <Eye className="h-4 w-4 text-red-400 transition-transform group-hover:scale-110 group-hover:text-amber-300" />
          </a>
        </div>
      </div>
    </section>
  );
}
