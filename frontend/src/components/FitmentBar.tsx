"use client";

import { Bot, Car, Search, X } from "lucide-react";
import type { VehicleFitment } from "@/types/autoparts";

interface FitmentBarProps {
  fitments: VehicleFitment[];
  selectedMake: string;
  searchQuery: string;
  onSelectMake: (make: string) => void;
  onSearchChange: (q: string) => void;
  onOpenAi?: () => void;
}

export function FitmentBar({
  fitments,
  selectedMake,
  searchQuery,
  onSelectMake,
  onSearchChange,
  onOpenAi,
}: FitmentBarProps) {
  const activeVehicle = fitments.find((f) => f.make === selectedMake);

  return (
    <section id="fitment" className="relative z-20 mx-auto -mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="yokocho-panel lantern-glow chamfer-md relative p-5 backdrop-blur-xl sm:p-6">
        {/* Japanese HUD Corner Ticks */}
        <span className="pointer-events-none absolute top-0 left-0 h-3 w-3 border-t-2 border-l-2 border-[#ff2e43]" />
        <span className="pointer-events-none absolute right-0 bottom-0 h-3 w-3 border-r-2 border-b-2 border-[#ff2e43]" />

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-[#ff4d5e] uppercase">
              <Car className="h-4 w-4" />
              <span className="font-jp">車両適合検索</span>
              <span className="font-mono">{"//"} Tra Cứu Tương Thích Theo Xe</span>
            </div>
            <h2 className="font-display mt-1 text-lg font-bold tracking-tight text-[#f3ede8]">
              Chọn Hãng Xe hoặc Nhập Mã OEM / Chân Bóng (H4, H11, Bi-Gầm...)
            </h2>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full lg:w-84">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Tìm không dấu: 'den gam ranger', 'coi', 'H4'..."
                className="w-full border border-red-800/60 bg-[#080305] py-2.5 pr-9 pl-10 text-sm text-[#f3ede8] placeholder:text-zinc-500 focus:border-[#ff2e43] focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  aria-label="Xóa từ khóa"
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer text-zinc-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {onOpenAi && (
              <button
                type="button"
                onClick={onOpenAi}
                className="chamfer-sm inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 border border-amber-400/75 bg-gradient-to-r from-[#230905] to-[#331308] px-3.5 py-2.5 text-xs font-bold text-amber-200 transition hover:border-amber-300 hover:brightness-115"
              >
                <Bot className="h-4 w-4 text-amber-300" />
                <span>Hỏi AI Chọn Đèn</span>
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onSelectMake("")}
            className={`chamfer-sm cursor-pointer border px-3.5 py-1.5 font-mono text-xs font-semibold tracking-wide uppercase transition ${
              selectedMake === ""
                ? "border-red-400 bg-[#e11d2e] text-white shadow-[0_0_18px_rgba(225,29,46,0.55)]"
                : "border-red-900/50 bg-[#11070b] text-zinc-200 hover:border-red-500"
            }`}
          >
            Tất Cả Dòng Xe
          </button>
          {fitments.map((fit) => {
            const active = selectedMake === fit.make;
            return (
              <button
                key={fit.make}
                type="button"
                onClick={() => onSelectMake(active ? "" : fit.make)}
                className={`chamfer-sm cursor-pointer border px-3.5 py-1.5 font-mono text-xs font-semibold tracking-wide uppercase transition ${
                  active
                    ? "border-red-400 bg-[#e11d2e] text-white shadow-[0_0_18px_rgba(225,29,46,0.55)]"
                    : "border-red-900/50 bg-[#11070b] text-zinc-200 hover:border-red-500"
                }`}
              >
                {fit.make}
              </button>
            );
          })}
        </div>

        {activeVehicle && (
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-l-2 border-amber-400 bg-amber-950/25 px-4 py-2.5 text-xs">
            <span className="font-semibold text-amber-300">
              Dòng xe hỗ trợ ({activeVehicle.make}): {activeVehicle.model}
            </span>
            <span className="font-mono text-zinc-300">
              Đời xe: {activeVehicle.years[0]} – {activeVehicle.years[activeVehicle.years.length - 1]}
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-zinc-300">Chân chuẩn:</span>
              {activeVehicle.recommendedSockets.map((sock) => (
                <span
                  key={sock}
                  className="border border-red-700/60 bg-[#17090e] px-2 py-0.5 font-mono text-[11px] text-red-200"
                >
                  {sock}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
