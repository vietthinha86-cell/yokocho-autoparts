"use client";

import Image from "next/image";
import { CloudRain, Eye, Flame, Moon, Sun, Zap } from "lucide-react";
import { useState } from "react";

type BeamMode = "off" | "3000k" | "4300k" | "6000k" | "combo";

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
    ambientClass: "brightness-[0.38] contrast-125",
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
      "opacity-95 bg-[radial-gradient(ellipse_at_50%_95%,rgba(245,158,11,0.8)_0%,rgba(234,88,12,0.42)_42%,transparent_76%)]",
    cutLineColor: "rgba(251, 191, 36, 0.85)",
    ambientClass: "brightness-[0.88] sepia-[0.22]",
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
      "opacity-90 bg-[radial-gradient(ellipse_at_bottom,rgba(254,240,138,0.85)_0%,rgba(245,158,11,0.28)_55%,transparent_80%)]",
    rightBeamGradient:
      "opacity-90 bg-[radial-gradient(ellipse_at_bottom,rgba(254,240,138,0.85)_0%,rgba(245,158,11,0.28)_55%,transparent_80%)]",
    fogCarpetGradient: "opacity-35 bg-[radial-gradient(ellipse_at_50%_95%,rgba(251,191,36,0.35)_0%,transparent_68%)]",
    cutLineColor: "rgba(253, 224, 71, 0.85)",
    ambientClass: "brightness-100",
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
      "opacity-95 bg-[radial-gradient(ellipse_at_bottom,rgba(224,242,254,0.92)_0%,rgba(125,211,252,0.3)_55%,transparent_82%)]",
    rightBeamGradient:
      "opacity-95 bg-[radial-gradient(ellipse_at_bottom,rgba(224,242,254,0.92)_0%,rgba(125,211,252,0.3)_55%,transparent_82%)]",
    fogCarpetGradient: "opacity-25 bg-[radial-gradient(ellipse_at_50%_95%,rgba(186,230,253,0.3)_0%,transparent_65%)]",
    cutLineColor: "rgba(125, 211, 252, 0.95)",
    ambientClass: "brightness-110 contrast-110",
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
      "opacity-95 bg-[radial-gradient(ellipse_at_bottom,rgba(248,250,252,0.88)_0%,rgba(147,197,253,0.28)_55%,transparent_80%)]",
    rightBeamGradient:
      "opacity-95 bg-[radial-gradient(ellipse_at_bottom,rgba(248,250,252,0.88)_0%,rgba(147,197,253,0.28)_55%,transparent_80%)]",
    fogCarpetGradient:
      "opacity-95 bg-[radial-gradient(ellipse_at_50%_95%,rgba(245,158,11,0.82)_0%,rgba(234,88,12,0.38)_44%,transparent_76%)]",
    cutLineColor: "rgba(224, 242, 254, 0.9)",
    ambientClass: "brightness-115 contrast-110",
  },
];

export function RainBeamSimulator() {
  const [mode, setMode] = useState<BeamMode>("combo");
  const [highBeam, setHighBeam] = useState(false);
  const active = BEAM_PROFILES.find((p) => p.id === mode) ?? BEAM_PROFILES[4];

  const canHighBeam = mode !== "off";

  return (
    <section
      id="simulator"
      className="border-y border-red-900/35 bg-[#040203] py-16"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="font-mono text-xs tracking-[0.22em] text-red-400 uppercase">
              夜間雨天テスト // Phòng Thử 2 Luồng Ánh Sáng
            </p>
            <h2 className="mt-1.5 font-[family-name:var(--font-serif-jp)] text-2xl font-bold text-[#ede6e1] sm:text-3xl">
              Trải Nghiệm Rọi Đèn Xuyên Con Hẻm Mưa Đêm
            </h2>
          </div>
          <p className="max-w-md text-sm text-zinc-400">
            Bật từng chế độ nhiệt màu hoặc giữ nút{" "}
            <span className="font-semibold text-sky-300">Đá Pha Laser (+80W)</span> để kiểm chứng
            đường cắt sáng thực tế.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Interactive Dark Alley Projection Viewport */}
          <div className="yokocho-panel relative overflow-hidden lg:col-span-8">
            <div className="relative h-80 w-full sm:h-[430px]">
              <Image
                src="/images/alley-beam-stage.jpg"
                alt="Con hẻm đêm mưa Nhật Bản thử nghiệm tia sáng Bi-LED"
                fill
                sizes="(max-width: 1024px) 100vw, 66vw"
                className={`object-cover transition-all duration-500 ${active.ambientClass} ${
                  highBeam && canHighBeam ? "brightness-125" : ""
                }`}
              />

              <div className="midnight-rain pointer-events-none absolute inset-0 opacity-75" />

              {/* Left & Right Headlight Beams */}
              <div
                className={`pointer-events-none absolute bottom-0 left-[8%] h-[78%] w-[46%] transition-all duration-500 mix-blend-screen ${active.leftBeamGradient}`}
                style={{
                  clipPath: "polygon(32% 100%, 62% 100%, 96% 32%, 2% 38%)",
                }}
              />
              <div
                className={`pointer-events-none absolute right-[8%] bottom-0 h-[78%] w-[46%] transition-all duration-500 mix-blend-screen ${active.rightBeamGradient}`}
                style={{
                  clipPath: "polygon(38% 100%, 68% 100%, 98% 38%, 4% 32%)",
                }}
              />

              {/* Low-Mounted Bi-Fog Amber / Reflection Carpet */}
              <div
                className={`pointer-events-none absolute inset-x-0 bottom-0 h-[55%] transition-all duration-500 mix-blend-screen ${active.fogCarpetGradient}`}
                style={{
                  clipPath: "polygon(18% 100%, 82% 100%, 100% 35%, 0% 35%)",
                }}
              />

              {/* Piercing Center High-Beam Laser Flash */}
              {highBeam && canHighBeam && (
                <div
                  className="pointer-events-none absolute inset-x-[18%] bottom-0 h-[92%] bg-[radial-gradient(ellipse_at_50%_65%,rgba(224,242,254,0.95)_0%,rgba(56,189,248,0.42)_42%,transparent_75%)] mix-blend-screen transition-opacity duration-150"
                  style={{
                    clipPath: "polygon(36% 100%, 64% 100%, 86% 10%, 14% 10%)",
                  }}
                />
              )}

              {/* Japanese Z-Step Cut-off Horizon Line */}
              {mode !== "off" && (
                <div
                  className="pointer-events-none absolute right-[10%] left-[10%] top-[48%] h-[2px] transition-all duration-500"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${active.cutLineColor}, transparent)`,
                    boxShadow: `0 0 18px ${active.cutLineColor}`,
                  }}
                />
              )}

              {/* Top HUD */}
              <div className="absolute top-4 right-4 left-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="border border-red-800/65 bg-black/80 px-3 py-1 font-mono text-xs text-red-300 backdrop-blur-md">
                    {active.kelvinText}
                  </span>
                  {highBeam && canHighBeam && (
                    <span className="border border-sky-400/70 bg-sky-950/85 px-2.5 py-1 font-mono text-xs font-bold text-sky-200 shadow-[0_0_16px_rgba(56,189,248,0.6)]">
                      LASER PHA +80W ON
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  disabled={!canHighBeam}
                  onClick={() => setHighBeam((prev) => !prev)}
                  className={`inline-flex cursor-pointer items-center gap-1.5 border px-3 py-1.5 font-mono text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    highBeam && canHighBeam
                      ? "border-sky-300 bg-sky-500 text-slate-950 shadow-[0_0_24px_rgba(56,189,248,0.8)]"
                      : "border-red-700/60 bg-black/80 text-sky-300 hover:border-sky-400"
                  }`}
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>{highBeam && canHighBeam ? "Tắt Đá Pha" : "Đá Pha Laser (+80W)"}</span>
                </button>
              </div>

              {/* Bottom Optical Telemetry Readout */}
              <div className="absolute right-4 bottom-4 left-4 border border-red-900/45 bg-black/80 p-3.5 backdrop-blur-md">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <p className="font-[family-name:var(--font-serif-jp)] text-sm font-bold text-white">
                      {active.label}{" "}
                      <span className="ml-2 text-xs text-red-400">{active.jpLabel}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-300">{active.description}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-4 font-mono text-xs">
                    <div>
                      <span className="block text-[10px] text-zinc-500">XUYÊN MƯA</span>
                      <span className="font-bold text-amber-300">{active.rainPct}%</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-zinc-500">CHIẾU XA</span>
                      <span className="font-bold text-sky-300">
                        {highBeam && canHighBeam
                          ? active.distanceMeters + 140
                          : active.distanceMeters}
                        m
                      </span>
                    </div>
                    <Eye className="hidden h-5 w-5 text-red-400 sm:block" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Illuminated JDM Switch Stack */}
          <div className="yokocho-panel flex flex-col justify-between gap-3 p-5 lg:col-span-4">
            <div className="space-y-2">
              <p className="font-mono text-xs tracking-widest text-zinc-400 uppercase">
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
                    className={`flex w-full cursor-pointer items-center justify-between border p-3 text-left transition ${
                      selected
                        ? "border-red-500 bg-gradient-to-r from-red-950/90 to-[#180a0f] shadow-[0_0_20px_rgba(225,29,46,0.35)]"
                        : "border-red-900/30 bg-[#0d0609] hover:border-red-600/60"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        {profile.id === "off" ? (
                          <Moon className="h-4 w-4 text-zinc-400" />
                        ) : profile.id === "3000k" ? (
                          <CloudRain className="h-4 w-4 text-amber-400" />
                        ) : profile.id === "combo" ? (
                          <Flame className="h-4 w-4 text-red-400" />
                        ) : (
                          <Sun className="h-4 w-4 text-sky-300" />
                        )}
                        <span className="text-xs font-bold text-[#ede6e1] sm:text-sm">
                          {profile.label}
                        </span>
                      </div>
                      <p className="mt-0.5 font-mono text-[11px] text-zinc-400">
                        {profile.kelvinText}
                      </p>
                    </div>
                    <span className="font-[family-name:var(--font-serif-jp)] text-xs text-red-400">
                      {profile.jpLabel}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="border-l-2 border-red-600 bg-[#12080c] p-3 text-xs text-zinc-400">
              <span className="font-semibold text-red-300">Khuyên dùng đi đêm Việt Nam:</span>{" "}
              Cấu hình <span className="text-amber-300">Combo Bi-LED + Bi-Gầm 3000K</span> giúp đi
              mưa bão hay sương mù đèo đều thấy rõ vạch đường.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
