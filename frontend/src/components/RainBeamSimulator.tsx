"use client";

import Image from "next/image";
import { CloudRain, Eye, Moon, Sun } from "lucide-react";
import { useState } from "react";

type BeamMode = "off" | "3000k" | "4300k" | "6000k";

interface BeamProfile {
  id: BeamMode;
  label: string;
  jpLabel: string;
  kelvinText: string;
  description: string;
  rainScore: string;
  beamCss: string;
  cutLineColor: string;
  ambientBrightness: string;
}

const BEAM_PROFILES: BeamProfile[] = [
  {
    id: "off",
    label: "Tắt Đèn",
    jpLabel: "消灯・闇",
    kelvinText: "0K • Chỉ còn đèn lồng đỏ",
    description: "Chìm trong bóng tối ẩm ướt của con hẻm Akachochin khi chưa nâng cấp ánh sáng.",
    rainScore: "Tầm nhìn: 15%",
    beamCss: "opacity-0",
    cutLineColor: "transparent",
    ambientBrightness: "brightness-[0.35] contrast-125",
  },
  {
    id: "3000k",
    label: "3000K Phá Sương",
    jpLabel: "霧突破・黄光",
    kelvinText: "3000K • Vàng Đậm Xuyên Mưa",
    description: "Bước sóng vàng dài xuyên thẳng màn mưa nặng hạt và sương mù đèo dốc không bị dội sáng.",
    rainScore: "Xuyên mưa sương: 96%",
    beamCss:
      "opacity-90 bg-[radial-gradient(ellipse_at_bottom_center,rgba(245,158,11,0.75)_0%,rgba(234,88,12,0.28)_48%,transparent_78%)]",
    cutLineColor: "rgba(251, 191, 36, 0.85)",
    ambientBrightness: "brightness-[0.9] sepia-[0.25]",
  },
  {
    id: "4300k",
    label: "4300K Nắng Ấm",
    jpLabel: "標準・晴雨両用",
    kelvinText: "4300K • Vàng Nắng Bám Đường",
    description: "Cân bằng hoàn hảo giữa độ bám nhựa đường ướt và khả năng nhận diện vật cản từ xa.",
    rainScore: "Độ bám đường: 94%",
    beamCss:
      "opacity-90 bg-[radial-gradient(ellipse_at_bottom_center,rgba(253,230,138,0.78)_0%,rgba(245,158,11,0.25)_50%,transparent_78%)]",
    cutLineColor: "rgba(253, 224, 71, 0.8)",
    ambientBrightness: "brightness-100",
  },
  {
    id: "6000k",
    label: "6000K Laser Trắng",
    jpLabel: "レーザー・白光",
    kelvinText: "6000K • Trắng Lạnh Sắc Nét",
    description: "Tâm sáng Laser cực gắt, tái hiện màu sắc biển báo và đường phố đêm rõ như ban ngày.",
    rainScore: "Cường độ tâm sáng: 9.800 lm",
    beamCss:
      "opacity-95 bg-[radial-gradient(ellipse_at_bottom_center,rgba(224,242,254,0.85)_0%,rgba(125,211,252,0.28)_50%,transparent_78%)]",
    cutLineColor: "rgba(125, 211, 252, 0.9)",
    ambientBrightness: "brightness-110 contrast-110",
  },
];

export function RainBeamSimulator() {
  const [mode, setMode] = useState<BeamMode>("3000k");
  const active = BEAM_PROFILES.find((p) => p.id === mode) ?? BEAM_PROFILES[1];

  return (
    <section id="simulator" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="font-mono text-xs tracking-[0.22em] text-red-400 uppercase">
            夜間雨天テスト // Mô Phỏng Quang Học Thực Tế
          </p>
          <h2 className="mt-1.5 font-[family-name:var(--font-serif-jp)] text-2xl font-bold text-[#ede6e1] sm:text-3xl">
            Thử Ánh Sáng Đèn Trong Đêm Mưa Phố Đèn Đỏ
          </h2>
        </div>
        <p className="max-w-md text-sm text-zinc-400">
          Chuyển đổi nhiệt màu để cảm nhận độ xuyên mưa của Bi-Gầm 3000K và độ cắt nét Laser 6000K ngay trên hẻm đêm.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="relative overflow-hidden rounded-2xl border border-red-900/50 bg-[#080406] lg:col-span-8">
          <div className="relative h-72 w-full sm:h-96">
            <Image
              src="/images/hero-yokocho.jpg"
              alt="Mô phỏng chiếu sáng trên con hẻm phố đèn đỏ Nhật Bản"
              fill
              sizes="(max-width: 1024px) 100vw, 66vw"
              className={`object-cover transition-all duration-500 ${active.ambientBrightness}`}
            />
            <div className="midnight-rain pointer-events-none absolute inset-0 opacity-65" />

            {/* Volumetric headlight projection cone */}
            <div
              className={`pointer-events-none absolute inset-x-0 bottom-0 h-3/4 transition-all duration-500 mix-blend-screen ${active.beamCss}`}
              style={{
                clipPath: "polygon(34% 100%, 66% 100%, 96% 24%, 4% 24%)",
              }}
            />

            {/* Japanese Z-cutoff line preview */}
            {mode !== "off" && (
              <div
                className="pointer-events-none absolute right-[8%] left-[8%] top-[52%] h-[2px] transition-all duration-500"
                style={{
                  background: `linear-gradient(90deg, transparent, ${active.cutLineColor}, transparent)`,
                  boxShadow: `0 0 18px ${active.cutLineColor}`,
                }}
              />
            )}

            {/* Telemetry HUD overlay */}
            <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
              <span className="rounded border border-red-800/60 bg-black/75 px-3 py-1 font-mono text-xs text-red-300 backdrop-blur-md">
                {active.kelvinText}
              </span>
              <span className="rounded border border-amber-700/50 bg-black/75 px-3 py-1 font-mono text-xs text-amber-300 backdrop-blur-md">
                {active.rainScore}
              </span>
            </div>

            <div className="absolute right-4 bottom-4 left-4 rounded-xl border border-white/10 bg-black/70 p-3.5 backdrop-blur-md">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-[family-name:var(--font-serif-jp)] text-sm font-bold text-white">
                    {active.label} <span className="ml-2 text-xs text-red-400">{active.jpLabel}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-300">{active.description}</p>
                </div>
                <Eye className="hidden h-5 w-5 shrink-0 text-red-400 sm:block" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-red-900/40 bg-[#0d070a] p-5 lg:col-span-4">
          <div className="space-y-2.5">
            <p className="font-mono text-xs tracking-widest text-zinc-400 uppercase">
              Chọn Nhiệt Màu Thử Nghiệm
            </p>
            {BEAM_PROFILES.map((profile) => {
              const selected = mode === profile.id;
              return (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => setMode(profile.id)}
                  className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition cursor-pointer ${
                    selected
                      ? "border-red-500 bg-gradient-to-r from-red-950/80 to-[#180a0f] shadow-[0_0_20px_rgba(225,29,46,0.3)]"
                      : "border-red-900/30 bg-[#120a0e] hover:border-red-700/60"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      {profile.id === "off" ? (
                        <Moon className="h-4 w-4 text-zinc-400" />
                      ) : profile.id === "3000k" ? (
                        <CloudRain className="h-4 w-4 text-amber-400" />
                      ) : (
                        <Sun className="h-4 w-4 text-sky-300" />
                      )}
                      <span className="text-sm font-bold text-[#ede6e1]">{profile.label}</span>
                    </div>
                    <p className="mt-1 font-mono text-[11px] text-zinc-400">{profile.kelvinText}</p>
                  </div>
                  <span className="font-[family-name:var(--font-serif-jp)] text-xs text-red-400">
                    {profile.jpLabel}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="rounded-xl border border-red-900/30 bg-[#140a0e] p-3.5 text-xs text-zinc-400">
            <span className="font-semibold text-red-300">Mẹo chọn đèn đi đêm:</span> Kết hợp{" "}
            <span className="text-zinc-200">Bi-LED Pha Cốt 5500K</span> +{" "}
            <span className="text-amber-300">Bi-Gầm 3000K</span> cho tầm quan sát tối ưu cả phố ướt lẫn đèo sương.
          </div>
        </div>
      </div>
    </section>
  );
}
