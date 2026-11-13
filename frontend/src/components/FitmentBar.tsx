"use client";

import { Car, Search, X } from "lucide-react";
import type { VehicleFitment } from "@/types/autoparts";

interface FitmentBarProps {
  fitments: VehicleFitment[];
  selectedMake: string;
  searchQuery: string;
  onSelectMake: (make: string) => void;
  onSearchChange: (q: string) => void;
}

export function FitmentBar({
  fitments,
  selectedMake,
  searchQuery,
  onSelectMake,
  onSearchChange,
}: FitmentBarProps) {
  const activeVehicle = fitments.find((f) => f.make === selectedMake);

  return (
    <section id="fitment" className="mx-auto -mt-8 relative z-20 max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="lantern-glow rounded-2xl border border-red-800/50 bg-[#0d070a]/95 p-5 backdrop-blur-xl sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-red-400 uppercase">
              <Car className="h-4 w-4" />
              <span>車両適合検索 // Tra Cứu Tương Thích Theo Xe</span>
            </div>
            <h2 className="mt-1 text-lg font-bold text-[#ede6e1]">
              Chọn Hãng Xe hoặc Nhập Mã OEM / Chân Bóng (H4, H11, Bi-Gầm...)
            </h2>
          </div>

          <div className="relative w-full lg:w-80">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm mã SKU, KOITO, H11, Bi-LED..."
              className="w-full rounded-lg border border-red-900/50 bg-[#150b10] py-2.5 pr-9 pl-10 text-sm text-[#ede6e1] placeholder:text-zinc-500 focus:border-red-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                aria-label="Xóa từ khóa"
                className="absolute top-1/2 right-2.5 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onSelectMake("")}
            className={`rounded-md border px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
              selectedMake === ""
                ? "border-red-500 bg-[#e11d2e] text-white shadow-[0_0_16px_rgba(225,29,46,0.45)]"
                : "border-red-900/40 bg-[#140b0f] text-zinc-300 hover:border-red-600/60"
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
                className={`rounded-md border px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  active
                    ? "border-red-500 bg-[#e11d2e] text-white shadow-[0_0_16px_rgba(225,29,46,0.45)]"
                    : "border-red-900/40 bg-[#140b0f] text-zinc-300 hover:border-red-600/60"
                }`}
              >
                {fit.make}
              </button>
            );
          })}
        </div>

        {activeVehicle && (
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-amber-500/30 bg-amber-950/20 px-4 py-2.5 text-xs">
            <span className="text-amber-300 font-semibold">
              Dòng xe hỗ trợ ({activeVehicle.make}): {activeVehicle.model}
            </span>
            <span className="text-zinc-400">
              Đời xe: {activeVehicle.years[0]} – {activeVehicle.years[activeVehicle.years.length - 1]}
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-zinc-400">Chân chuẩn:</span>
              {activeVehicle.recommendedSockets.map((sock) => (
                <span
                  key={sock}
                  className="rounded border border-red-800/50 bg-[#1a0b10] px-2 py-0.5 font-mono text-[11px] text-red-200"
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

