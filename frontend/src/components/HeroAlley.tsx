import { ArrowDownRight, ShieldCheck, Sparkles, Wrench } from "lucide-react";
import { ChochinLantern } from "./ChochinLantern";

export function HeroAlley() {
  return (
    <section
      id="top"
      className="relative min-h-[82vh] overflow-hidden border-b border-red-900/35"
    >
      {/* Background photograph of rainy red-lantern Japanese alley */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-[1.02]"
        style={{ backgroundImage: "url('/images/hero-yokocho.jpg')" }}
      />
      {/* Layered dark noir vignette & crimson reflection haze */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#050305] via-[#070406]/82 to-[#090407]/45" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#060406] via-transparent to-[#060406]/70" />
      <div className="midnight-rain pointer-events-none absolute inset-0 opacity-45" />

      {/* Hanging swaying lanterns */}
      <div className="pointer-events-none absolute top-0 right-12 hidden gap-10 lg:flex">
        <ChochinLantern kanji="闇" size="lg" />
        <ChochinLantern kanji="灯" size="md" className="mt-4" />
        <ChochinLantern kanji="速" size="lg" className="-mt-2" />
      </div>

      {/* Left Japanese vertical signage */}
      <div className="pointer-events-none absolute top-28 left-4 hidden flex-col items-center gap-3 xl:flex">
        <div className="h-14 w-px bg-gradient-to-b from-transparent to-red-600/80" />
        <span className="vertical-jp font-[family-name:var(--font-serif-jp)] text-xs tracking-[0.4em] text-red-400/80">
          深夜自動車部品・赤灯横丁
        </span>
        <div className="h-14 w-px bg-gradient-to-b from-red-600/80 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col justify-center px-4 py-20 sm:px-6 lg:px-14 lg:py-28">
        <div className="max-w-2xl">
          <div className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-red-700/50 bg-[#14070a]/85 px-4 py-1.5 text-xs tracking-wider text-red-300 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-[#ff2e43] shadow-[0_0_10px_#ff2e43] animate-pulse" />
            <span className="font-mono uppercase">Kabukicho Midnight Spec • 24/7 Garage</span>
          </div>

          <h1 className="font-[family-name:var(--font-serif-jp)] text-4xl leading-[1.15] font-black tracking-tight text-[#ede6e1] sm:text-5xl lg:text-6xl">
            Ánh Sáng Xuyên Màn Đêm{" "}
            <span className="bg-gradient-to-r from-[#ff2e43] via-[#ff6b4a] to-amber-400 bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(225,29,46,0.45)]">
              Phố Đèn Đỏ
            </span>
          </h1>

          <p className="mt-5 text-base leading-relaxed text-zinc-300 sm:text-lg">
            Kho phụ tùng ô tô, đèn{" "}
            <span className="font-semibold text-white">Bi-LED Laser</span>,{" "}
            <span className="font-semibold text-amber-300">Bi-Gầm phá sương 3000K</span> và đồ chơi
            JDM thuần chất đêm Tokyo. Cắm giắc zin chuẩn OEM — cắt nét mặt đường trong mưa lớn.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#catalog"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#b91c1c] to-[#e11d2e] px-6 py-3.5 text-sm font-bold tracking-wide text-white shadow-[0_0_30px_rgba(225,29,46,0.5)] transition hover:brightness-110"
            >
              <span>Vào Kệ Hàng Đêm</span>
              <ArrowDownRight className="h-4 w-4" />
            </a>

            <a
              href="#simulator"
              className="inline-flex items-center gap-2 rounded-lg border border-amber-500/45 bg-[#120b0c]/85 px-5 py-3.5 text-sm font-semibold text-amber-300 backdrop-blur-md transition hover:border-amber-400 hover:bg-amber-950/40"
            >
              <Sparkles className="h-4 w-4" />
              <span>Thử Tia Sáng Phố Đêm Mưa</span>
            </a>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-3 border-t border-red-900/40 pt-6 sm:grid-cols-3">
            <div className="flex items-start gap-2.5">
              <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <div>
                <p className="text-xs font-bold tracking-wider text-zinc-100 uppercase">
                  Plug &amp; Play Zin 100%
                </p>
                <p className="text-xs text-zinc-400">Không cắt trích dây điện xe</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <div>
                <p className="text-xs font-bold tracking-wider text-zinc-100 uppercase">
                  Bảo Hành 1 Đổi 1
                </p>
                <p className="text-xs text-zinc-400">Tem điện tử tới 36 tháng</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
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

