"use client";

import Image from "next/image";
import { CloudRain, Eye, Flame, Moon, Sun, Zap } from "lucide-react";
import { useState } from "react";
import { MidnightRainCanvas, type RainBeamColorMode } from "./MidnightRainCanvas";

type BeamMode = RainBeamColorMode;

interface BeamProfile {
  id: BeamMode;
  label: string;
  jpLabel: string;
  kelvinText: string;
  description: string;
  rainPct: number;
  distanceMeters: number;
  leftBeamGradient: string;
  rightBeamGradient: string;
  fogCarpetGradient: string;
  cutLineColor: string;
  chromaRimColor: string;
  ambientClass: string;
}

const BEAM_PROFILES: BeamProfile[] = [
  {
    id: "off",
    label: "Tắt Đèn (Chỉ Đèn Lồng)",
    jpLabel: "消灯・闇",
    kelvinText: "0K • Bóng Tối Phố Đêm",
    description: "Con hẻm ướt sũng chỉ còn ánh đèn lồng đỏ mờ ảo — gần như mất tầm nhìn xa.",
    rainPct: 14,
    distanceMeters: 12,
    leftBeamGradient: "opacity-0",
    rightBeamGradient: "opacity-0",
    fogCarpetGradient: "opacity-0",
    cutLineColor: "transparent",
    chromaRimColor: "transparent",
    ambientClass: "brightness-[0.34] contrast-125",
  },
  {
    id: "3000k",
    label: "3000K Bi-Gầm Phá Sương",
    jpLabel: "霧突破・黄光",
    kelvinText: "3000K • Vàng Đậm Xuyên Mưa",
    description:
      "Hai luồng bi-gầm trải rộng mặt đường ướt, xuyên màn mưa nặng hạt và sương mù mà không bị dội trắng.",
    rainPct: 96,
    distanceMeters: 95,
    leftBeamGradient: "opacity-0",
    rightBeamGradient: "opacity-0",
    fogCarpetGradient:
      "opacity-95 bg-[radial-gradient(ellipse_at_50%_94%,rgba(245,158,11,0.88)_0%,rgba(234,88,12,0.48)_42%,transparent_76%)]",
    cutLineColor: "rgba(251, 191, 36, 0.9)",
    chromaRimColor: "rgba(249, 115, 22, 0.65)",
    ambientClass: "brightness-[0.88] sepia-[0.22] contrast-110",
  },
  {
    id: "4300k",
    label: "4300K Nắng Ấm Bám Đường",
    jpLabel: "標準・晴雨両用",
    kelvinText: "4300K • Vàng Nắng Cắt Nét",
    description:
      "Hai cụm Bi-LED 4300K cho mặt cắt Cos Z-cutoff chuẩn Nhật, cân bằng đi phố mưa và cao tốc.",
    rainPct: 91,
    distanceMeters: 165,
    leftBeamGradient:
      "opacity-92 bg-[radial-gradient(ellipse_at_bottom,rgba(254,240,138,0.88)_0%,rgba(245,158,11,0.32)_55%,transparent_80%)]",
    rightBeamGradient:
      "opacity-92 bg-[radial-gradient(ellipse_at_bottom,rgba(254,240,138,0.88)_0%,rgba(245,158,11,0.32)_55%,transparent_80%)]",
    fogCarpetGradient:
      "opacity-40 bg-[radial-gradient(ellipse_at_50%_95%,rgba(251,191,36,0.4)_0%,transparent_68%)]",
    cutLineColor: "rgba(253, 224, 71, 0.9)",
    chromaRimColor: "rgba(96, 165, 250, 0.6)",
    ambientClass: "brightness-100 contrast-110",
  },
  {
    id: "6000k",
    label: "6000K Bi-LED Laser Trắng",
    jpLabel: "レーザー・白光",
    kelvinText: "6000K • Trắng Lạnh 9.800 lm",
    description:
      "Tâm sáng Laser đôi cắt mặt đường như dao cạo, soi rõ từng chi tiết biển báo và vạch kẻ cuối hẻm.",
    rainPct: 82,
    distanceMeters: 240,
    leftBeamGradient:
      "opacity-95 bg-[radial-gradient(ellipse_at_bottom,rgba(224,242,254,0.95)_0%,rgba(125,211,252,0.34)_54%,transparent_82%)]",
    rightBeamGradient:
      "opacity-95 bg-[radial-gradient(ellipse_at_bottom,rgba(224,242,254,0.95)_0%,rgba(125,211,252,0.34)_54%,transparent_82%)]",
    fogCarpetGradient:
      "opacity-28 bg-[radial-gradient(ellipse_at_50%_95%,rgba(186,230,253,0.36)_0%,transparent_65%)]",
    cutLineColor: "rgba(125, 211, 252, 0.98)",
    chromaRimColor: "rgba(129, 140, 248, 0.85)",
    ambientClass: "brightness-110 contrast-115",
  },
  {
    id: "combo",
    label: "COMBO: Bi-LED + Bi-Gầm 3000K",
    jpLabel: "双灯・完全装備",
    kelvinText: "5500K Pha + 3000K Gầm • Tối Thượng",
    description:
      "Tầng dưới vàng 3000K bám chặt nhựa đường ướt, tầng trên trắng 5500K chiếu xa xé toạc màn sương đêm.",
    rainPct: 99,
    distanceMeters: 280,
    leftBeamGradient:
      "opacity-95 bg-[radial-gradient(ellipse_at_bottom,rgba(248,250,252,0.92)_0%,rgba(147,197,253,0.32)_55%,transparent_80%)]",
    rightBeamGradient:
      "opacity-95 bg-[radial-gradient(ellipse_at_bottom,rgba(248,250,252,0.92)_0%,rgba(147,197,253,0.32)_55%,transparent_80%)]",
    fogCarpetGradient:
      "opacity-95 bg-[radial-gradient(ellipse_at_50%_95%,rgba(245,158,11,0.88)_0%,rgba(234,88,12,0.42)_44%,transparent_76%)]",
    cutLineColor: "rgba(224, 242, 254, 0.95)",
    chromaRimColor: "rgba(99, 102, 241, 0.82)",
    ambientClass: "brightness-115 contrast-115",
  },
];

export function RainBeamSimulator() {
  const [mode, setMode] = useState<BeamMode>("combo");
  const [highBeam, setHighBeam] = useState(false);
  const active = BEAM_PROFILES.find((p) => p.id === mode) ?? BEAM_PROFILES[4];

  const canHighBeam = mode !== "off";
  const highBeamActive = highBeam && canHighBeam;
  const effectiveDistance = highBeamActive ? active.distanceMeters + 140 : active.distanceMeters;

  return (
    <section
      id="simulator"
      className="border-y border-red-800/45 bg-[#040203] py-16"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold tracking-[0.16em] text-[#ff4d5e] uppercase">
              <span className="font-jp">夜間雨天テスト</span>
              <span className="font-mono">{"//"} Phòng Thử 2 Luồng Ánh Sáng Live</span>
            </p>
            <h2 className="font-display mt-1.5 text-2xl font-bold tracking-tight text-[#f3ede8] sm:text-3xl">
              Trải Nghiệm Rọi Đèn Xuyên Con Hẻm Mưa Đêm
            </h2>
          </div>
          <p className="max-w-md text-sm text-zinc-300">
            Bật từng chế độ nhiệt màu hoặc giữ nút{" "}
            <span className="font-bold text-sky-300">Đá Pha Laser (+80W)</span> để thấy hạt mưa
            bắt sáng và đường cắt Z-Step thực tế.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Interactive Live Dark Alley Projection Viewport */}
          <div className="yokocho-panel chamfer-md relative overflow-hidden lg:col-span-8">
            <div className="relative h-80 w-full sm:h-[440px]">
              {/* Subtle breathing camera cinemagraph */}
              <div className="animate-hero-cinema relative h-full w-full">
                <Image
                  src="/images/alley-beam-stage.jpg"
                  alt="Con hẻm đêm mưa Nhật Bản thử nghiệm tia sáng Bi-LED"
                  fill
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  className={`photo-razor object-cover transition-all duration-500 ${active.ambientClass} ${
                    highBeamActive ? "brightness-125 contrast-120" : ""
                  }`}
                />
              </div>

              {/* Dual Headlight Optical Projections + Live Shimmer */}
              <div
                className={`animate-road-shimmer pointer-events-none absolute bottom-0 left-[7%] h-[78%] w-[46%] mix-blend-screen transition-all duration-500 ${active.leftBeamGradient}`}
                style={{
                  clipPath: "polygon(32% 100%, 62% 100%, 96% 31%, 2% 38%)",
                }}
              />
              <div
                className={`animate-road-shimmer pointer-events-none absolute right-[7%] bottom-0 h-[78%] w-[46%] mix-blend-screen transition-all duration-500 ${active.rightBeamGradient}`}
                style={{
                  clipPath: "polygon(38% 100%, 68% 100%, 98% 38%, 4% 31%)",
                  animationDelay: "0.4s",
                }}
              />

              {/* Low-Mounted Bi-Fog Amber & Asphalt Wet Reflection */}
              <div
                className={`animate-road-shimmer pointer-events-none absolute inset-x-0 bottom-0 h-[56%] mix-blend-screen transition-all duration-500 ${active.fogCarpetGradient}`}
                style={{
                  clipPath: "polygon(16% 100%, 84% 100%, 100% 34%, 0% 34%)",
                }}
              />

              {/* Piercing Center High-Beam Laser Ignition */}
              {highBeamActive && (
                <>
                  <div
                    className="animate-optic-pulse pointer-events-none absolute inset-x-[16%] bottom-0 h-[94%] bg-[radial-gradient(ellipse_at_50%_62%,rgba(224,242,254,0.96)_0%,rgba(56,189,248,0.46)_42%,transparent_76%)] mix-blend-screen transition-opacity duration-150"
                    style={{
                      clipPath: "polygon(36% 100%, 64% 100%, 84% 8%, 16% 8%)",
                    }}
                  />
                  <div
                    className="pointer-events-none absolute inset-x-[28%] bottom-0 h-[88%] bg-[radial-gradient(ellipse_at_50%_52%,rgba(255,255,255,0.9)_0%,rgba(125,211,252,0.35)_38%,transparent_72%)] mix-blend-screen"
                    style={{
                      clipPath: "polygon(43% 100%, 57% 100%, 72% 12%, 28% 12%)",
                    }}
                  />
                </>
              )}

              {/* Razor-Sharp Japanese Z-Step Cut-off Horizon Edge + Chromatic Blue Dispersion */}
              {mode !== "off" && (
                <div className="pointer-events-none absolute right-[8%] left-[8%] top-[47%] h-3">
                  <svg
                    viewBox="0 0 800 24"
                    preserveAspectRatio="none"
                    className="h-full w-full overflow-visible"
                  >
                    {/* Chromatic signature violet/blue rim */}
                    <polyline
                      points="0,14 350,14 405,6 800,6"
                      fill="none"
                      stroke={active.chromaRimColor}
                      strokeWidth="3.5"
                      opacity="0.7"
                    />
                    {/* Crisp razor cutoff core */}
                    <polyline
                      points="0,16 350,16 405,8 800,8"
                      fill="none"
                      stroke={active.cutLineColor}
                      strokeWidth="1.8"
                    />
                  </svg>
                </div>
              )}

              {/* Real-Time Interactive 60fps Canvas Rain Lit Inside Headlight Cone */}
              <div className="pointer-events-none absolute inset-0 z-10">
                <MidnightRainCanvas
                  intensity="simulator"
                  beamMode={mode}
                  highBeam={highBeamActive}
                />
              </div>

              {/* Optical Viewfinder Crosshairs */}
              <div className="pointer-events-none absolute inset-3 z-20">
                <span className="absolute top-0 left-0 h-3 w-3 border-t-2 border-l-2 border-red-500/80" />
                <span className="absolute top-0 right-0 h-3 w-3 border-t-2 border-r-2 border-red-500/80" />
                <span className="absolute bottom-0 left-0 h-3 w-3 border-b-2 border-l-2 border-amber-500/80" />
                <span className="absolute right-0 bottom-0 h-3 w-3 border-r-2 border-b-2 border-amber-500/80" />
              </div>

              {/* Top HUD */}
              <div className="absolute top-5 right-5 left-5 z-30 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="chamfer-sm border border-red-600/75 bg-black/85 px-3 py-1 font-mono text-xs font-semibold text-red-200 backdrop-blur-md">
                    {active.kelvinText}
                  </span>
                  {highBeamActive && (
                    <span className="chamfer-sm animate-pulse border border-sky-400 bg-sky-950/90 px-2.5 py-1 font-mono text-xs font-bold text-sky-200 shadow-[0_0_20px_rgba(56,189,248,0.75)]">
                      LASER PHA +80W ON
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  disabled={!canHighBeam}
                  onClick={() => setHighBeam((prev) => !prev)}
                  className={`chamfer-sm inline-flex cursor-pointer items-center gap-1.5 border px-3.5 py-1.5 font-mono text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    highBeamActive
                      ? "border-sky-300 bg-sky-400 text-slate-950 shadow-[0_0_28px_rgba(56,189,248,0.85)]"
                      : "border-red-600/70 bg-black/85 text-sky-300 hover:border-sky-400"
                  }`}
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>{highBeamActive ? "Tắt Đá Pha" : "Đá Pha Laser (+80W)"}</span>
                </button>
              </div>

              {/* Bottom Optical Telemetry Readout */}
              <div className="absolute right-5 bottom-5 left-5 z-30 border border-red-700/55 bg-black/85 p-3.5 backdrop-blur-md">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <p className="font-display text-sm font-bold text-white">
                      {active.label}{" "}
                      <span className="font-jp ml-2 text-xs font-bold text-[#ff4d5e]">
                        {active.jpLabel}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-300">{active.description}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-5 font-mono text-xs">
                    <div className="w-20">
                      <div className="flex items-center justify-between text-[10px] text-zinc-400">
                        <span>XUYÊN MƯA</span>
                        <span className="font-bold text-amber-300">{active.rainPct}%</span>
                      </div>
                      <div className="mt-1 h-1 w-full bg-zinc-800">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-300"
                          style={{ width: `${active.rainPct}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-24">
                      <div className="flex items-center justify-between text-[10px] text-zinc-400">
                        <span>CHIẾU XA</span>
                        <span className="font-bold text-sky-300">{effectiveDistance}m</span>
                      </div>
                      <div className="mt-1 h-1 w-full bg-zinc-800">
                        <div
                          className="h-full bg-gradient-to-r from-sky-500 to-cyan-300 transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.round((effectiveDistance / 420) * 100))}%` }}
                        />
                      </div>
                    </div>
                    <Eye className="hidden h-5 w-5 text-[#ff4d5e] sm:block" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Illuminated JDM Switch Stack */}
          <div className="yokocho-panel chamfer-md flex flex-col justify-between gap-3 p-5 lg:col-span-4">
            <div className="space-y-2">
              <p className="font-mono text-xs font-semibold tracking-widest text-zinc-300 uppercase">
                Công Tắc Nhiệt Màu Đêm Mưa
              </p>
              {BEAM_PROFILES.map((profile) => {
                const selected = mode === profile.id;
                return (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => {
                      setMode(profile.id);
                      if (profile.id === "off") setHighBeam(false);
                    }}
                    className={`chamfer-sm flex w-full cursor-pointer items-center justify-between border p-3 text-left transition ${
                      selected
                        ? "border-[#ff2e43] bg-gradient-to-r from-red-950/95 to-[#1a090e] shadow-[0_0_24px_rgba(225,29,46,0.42)]"
                        : "border-red-900/40 bg-[#0d0508] hover:border-red-500/75"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        {profile.id === "off" ? (
                          <Moon className="h-4 w-4 text-zinc-400" />
                        ) : profile.id === "3000k" ? (
                          <CloudRain className="h-4 w-4 text-amber-400" />
                        ) : profile.id === "combo" ? (
                          <Flame className="h-4 w-4 text-[#ff4d5e]" />
                        ) : (
                          <Sun className="h-4 w-4 text-sky-300" />
                        )}
                        <span className="text-xs font-bold text-[#f3ede8] sm:text-sm">
                          {profile.label}
                        </span>
                      </div>
                      <p className="mt-0.5 font-mono text-[11px] text-zinc-400">
                        {profile.kelvinText}
                      </p>
                    </div>
                    <span className="font-jp text-xs font-bold text-[#ff4d5e]">
                      {profile.jpLabel}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="border-l-2 border-[#ff2e43] bg-[#13070b] p-3 text-xs text-zinc-300">
              <span className="font-bold text-red-300">Khuyên dùng đi đêm Việt Nam:</span> Cấu
              hình <span className="font-semibold text-amber-300">Combo Bi-LED + Bi-Gầm 3000K</span>{" "}
              giúp đi mưa bão hay sương mù đèo đều thấy rõ vạch đường.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
