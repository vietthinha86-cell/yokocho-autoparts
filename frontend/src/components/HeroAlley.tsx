import { ArrowDownRight, ShieldCheck, Sparkles, Wrench } from "lucide-react";
import { ChochinLantern } from "./ChochinLantern";

const NOREN_PANELS = [
  { kanji: "赤", sub: "AKARI" },
  { kanji: "灯", sub: "OPTICS" },
  { kanji: "横", sub: "YOKOCHO" },
  { kanji: "丁", sub: "GARAGE" },
];

export function HeroAlley() {
  return (
    <section
      id="top"
      className="relative min-h-[86vh] overflow-hidden border-b border-red-900/45"
    >
      {/* Background photograph of rainy red-lantern Japanese alley */}
      <div
        className="absolute inset-0 scale-[1.03] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/hero-yokocho.jpg')" }}
      />

      {/* Deep obsidian & crimson atmospheric gradient layers */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#040204]/95 via-[#070306]/82 to-[#090306]/45" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#050305] via-transparent to-[#050305]/80" />
      <div className="midnight-rain pointer-events-none absolute inset-0 opacity-55" />

      {/* Drifting low-altitude red mist */}
      <div className="animate-mist pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#19050a]/75 via-[#2a070f]/25 to-transparent blur-2xl" />

      {/* Top Split Noren Curtains (Japanese Night Garage Entrance) */}
      <div className="pointer-events-none relative z-10 mx-auto hidden max-w-7xl justify-center gap-2 px-8 md:flex">
        {NOREN_PANELS.map((panel) => (
          <div
            key={panel.kanji}
            className="noren-panel flex h-14 w-24 flex-col items-center justify-center rounded-b-sm"
          >
            <span className="font-[family-name:var(--font-serif-jp)] text-lg font-black text-[#ede6e1]/90">
              {panel.kanji}
            </span>
            <span className="font-mono text-[8px] tracking-[0.28em] text-red-400/80">
              {panel.sub}
            </span>
          </div>
        ))}
      </div>

      {/* Hanging swaying lanterns + Vertical Japanese Neon Signboards */}
      <div className="pointer-events-none absolute top-0 right-10 z-10 hidden items-start gap-7 lg:flex">
        <ChochinLantern kanji="闇" size="lg" />
        <div className="mt-8 flex flex-col items-center border border-red-600/60 bg-[#0d0407]/90 px-2.5 py-4 shadow-[0_0_26px_rgba(225,29,46,0.4)]">
          <span className="vertical-jp neon-flicker font-[family-name:var(--font-serif-jp)] text-sm font-black tracking-[0.35em] text-[#ff4d5e]">
            赤灯横丁
          </span>
          <span className="mt-2 border-t border-red-800/60 pt-1.5 font-mono text-[9px] text-amber-300">
            24H
          </span>
        </div>
        <ChochinLantern kanji="灯" size="md" className="mt-3" />
        <ChochinLantern kanji="速" size="lg" className="-mt-1" />
      </div>

      {/* Left vertical neon alley rail */}
      <div className="pointer-events-none absolute top-28 left-4 z-10 hidden flex-col items-center gap-3 xl:flex">
        <div className="h-12 w-px bg-gradient-to-b from-transparent to-red-600/90" />
        <span className="vertical-jp font-[family-name:var(--font-serif-jp)] text-xs tracking-[0.42em] text-red-400/85 drop-shadow-[0_0_10px_rgba(225,29,46,0.8)]">
          深夜自動車部品・闇夜光学
        </span>
        <div className="h-12 w-px bg-gradient-to-b from-red-600/90 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col justify-center px-4 py-16 sm:px-6 lg:px-14 lg:py-22">
        <div className="max-w-2xl">
          <div className="mb-5 inline-flex items-center gap-2.5 border border-red-700/60 bg-[#140609]/90 px-3.5 py-1.5 text-xs tracking-wider text-red-300 backdrop-blur-md">
            <span className="h-2 w-2 bg-[#ff2e43] shadow-[0_0_12px_#ff2e43] animate-pulse" />
            <span className="font-mono uppercase">
              Kabukicho Midnight Spec • 赤灯自動車整備
            </span>
          </div>

          <h1 className="font-[family-name:var(--font-serif-jp)] text-4xl leading-[1.12] font-black tracking-tight text-[#ede6e1] sm:text-5xl lg:text-6xl">
            Ánh Sáng Xuyên Màn Đêm{" "}
            <span className="bg-gradient-to-r from-[#ff2e43] via-[#ff5f40] to-amber-400 bg-clip-text text-transparent drop-shadow-[0_0_28px_rgba(225,29,46,0.5)]">
              Phố Đèn Đỏ
            </span>
          </h1>

          <p className="mt-5 border-l-2 border-red-600/70 pl-4 text-base leading-relaxed text-zinc-300 sm:text-lg">
            Kho phụ tùng ô tô, đèn{" "}
            <span className="font-semibold text-white">Bi-LED Laser</span>,{" "}
            <span className="font-semibold text-amber-300">Bi-Gầm phá sương 3000K</span> và đồ chơi
            JDM thuần chất đêm Tokyo. Cắm giắc zin chuẩn OEM — cắt nét mặt đường trong mưa lớn.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#catalog"
              className="group relative inline-flex items-center gap-2 border border-red-400/40 bg-gradient-to-r from-[#991b1b] via-[#dc2626] to-[#e11d2e] px-6 py-3.5 text-sm font-bold tracking-wider text-white uppercase shadow-[0_0_32px_rgba(225,29,46,0.55)] transition hover:brightness-115"
            >
              <span>Vào Kệ Hàng Đêm</span>
              <ArrowDownRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5" />
            </a>

            <a
              href="#simulator"
              className="inline-flex items-center gap-2 border border-amber-500/50 bg-[#12090b]/90 px-5 py-3.5 text-sm font-semibold text-amber-300 backdrop-blur-md transition hover:border-amber-400 hover:bg-amber-950/40 hover:shadow-[0_0_24px_rgba(245,158,11,0.25)]"
            >
              <Sparkles className="h-4 w-4" />
              <span>Thử 2 Tia Đèn Đêm Mưa</span>
            </a>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-4 border-t border-red-900/45 pt-6 sm:grid-cols-3">
            <div className="flex items-start gap-2.5 border-l border-red-800/50 pl-3">
              <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <div>
                <p className="text-xs font-bold tracking-wider text-zinc-100 uppercase">
                  Plug &amp; Play Zin 100%
                </p>
                <p className="text-xs text-zinc-400">Không cắt trích dây điện xe</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 border-l border-amber-700/50 pl-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <div>
                <p className="text-xs font-bold tracking-wider text-zinc-100 uppercase">
                  Bảo Hành 1 Đổi 1
                </p>
                <p className="text-xs text-zinc-400">Tem điện tử tới 36 tháng</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 border-l border-red-800/50 pl-3">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <div>
                <p className="text-xs font-bold tracking-wider text-zinc-100 uppercase">
                  Chuẩn Mặt Cắt Nhật
                </p>
                <p className="text-xs text-zinc-400">Sáng gắt nhưng không chói mắt</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
