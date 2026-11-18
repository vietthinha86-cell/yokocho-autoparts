"use client";

import Image from "next/image";
import { Check, Layers, ShoppingBag, Sparkles } from "lucide-react";
import { formatVnd } from "@/lib/api";
import type { AutoPartProduct, VehicleBuildCombo } from "@/types/autoparts";

interface VehicleBuildsShowcaseProps {
  combos: VehicleBuildCombo[];
  products: AutoPartProduct[];
  onAddCombo: (parts: AutoPartProduct[]) => void;
}

export function VehicleBuildsShowcase({
  combos,
  products,
  onAddCombo,
}: VehicleBuildsShowcaseProps) {
  return (
    <section id="builds" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-red-800/45 pb-6 md:flex-row md:items-end">
        <div>
          <p className="flex items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.2em] text-[#ff4d5e] uppercase">
            <span>XE ĐÃ LÊN ĐÈN THỰC TẾ</span>
            <span className="font-jp text-zinc-500">車両実例</span>
          </p>
          <h2 className="font-display mt-1.5 text-2xl leading-[1.2] font-bold tracking-[-0.02em] text-[#f3ede8] sm:text-3xl">
            Cấu Hình Combo Đèn Đêm Theo Từng Dòng Xe
          </h2>
        </div>
        <p className="max-w-md text-sm text-zinc-300">
          Chưa biết ghép đèn thế nào? Chọn ngay cấu hình đã test thực tế dưới mưa —{" "}
          <span className="font-bold text-amber-300">thêm cả combo vào giỏ chỉ 1 chạm</span>.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {combos.map((combo, index) => {
          const comboParts = combo.productIds
            .map((pid) => products.find((p) => p.id === pid))
            .filter((p): p is AutoPartProduct => Boolean(p));

          const rawTotal = comboParts.reduce((sum, p) => sum + p.priceVnd, 0);
          const discountedTotal = Math.round(
            (rawTotal * (100 - combo.bundleDiscountPct)) / 100,
          );

          return (
            <article
              key={combo.id}
              className="lantern-card chamfer-card group flex flex-col overflow-hidden"
            >
              {/* Animated Showcase Photo */}
              <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-red-800/45 bg-black">
                <div
                  className={`relative h-full w-full ${
                    index % 2 === 0 ? "animate-ken-a" : "animate-ken-b"
                  } transition-transform duration-700 group-hover:scale-105`}
                >
                  <Image
                    src={combo.image}
                    alt={combo.vehicleTitle}
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="photo-razor object-cover"
                  />
                </div>
                <div
                  aria-hidden="true"
                  className="animate-blade-sweep pointer-events-none absolute -top-1/2 bottom-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/18 to-transparent"
                  style={{ animationDelay: `${index * 1.4}s` }}
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#080305] via-transparent to-black/45" />

                <div className="absolute top-3 right-3 left-3 flex items-center justify-between gap-2">
                  <span className="chamfer-sm border border-amber-400/75 bg-black/85 px-2.5 py-0.5 font-mono text-[10px] font-bold text-amber-300">
                    -{combo.bundleDiscountPct}% COMBO
                  </span>
                  <span className="font-jp border border-red-600/70 bg-[#1a0509]/90 px-2 py-0.5 text-[10px] font-bold text-red-200">
                    {combo.jpSubtitle}
                  </span>
                </div>

                <div className="absolute right-3 bottom-2.5 left-3 flex items-center gap-1.5 text-[11px] text-zinc-200">
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  <span className="truncate font-semibold">{combo.driverStyle}</span>
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-between p-5">
                <div>
                  <h3 className="font-display text-lg leading-snug font-bold tracking-tight text-white">
                    {combo.vehicleTitle}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-zinc-400">
                    {combo.descriptionVi}
                  </p>

                  <div className="mt-4 space-y-1.5 border border-red-900/45 bg-[#080305] p-3">
                    <p className="flex items-center gap-1.5 font-mono text-[10px] font-bold tracking-wider text-red-400 uppercase">
                      <Layers className="h-3.5 w-3.5" />
                      <span>Gồm {comboParts.length} phụ tùng khớp bộ:</span>
                    </p>
                    {comboParts.map((part) => (
                      <div
                        key={part.id}
                        className="flex items-center justify-between gap-2 text-xs text-zinc-200"
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <Check className="h-3 w-3 shrink-0 text-emerald-400" />
                          <span className="truncate">{part.nameVi}</span>
                        </span>
                        <span className="shrink-0 font-mono text-[11px] text-zinc-400">
                          {formatVnd(part.priceVnd)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 flex items-end justify-between border-t border-red-900/40 pt-4">
                  <div>
                    <p className="font-mono text-[11px] text-zinc-500 line-through">
                      {formatVnd(rawTotal)}
                    </p>
                    <p className="font-mono text-lg font-bold text-[#ff4d5e]">
                      {formatVnd(discountedTotal)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onAddCombo(comboParts)}
                    className="chamfer-sm inline-flex cursor-pointer items-center gap-1.5 bg-gradient-to-r from-[#b91c1c] to-[#ff2e43] px-4 py-2.5 text-xs font-bold text-white shadow-[0_0_20px_rgba(225,29,46,0.45)] transition hover:brightness-115"
                  >
                    <ShoppingBag className="h-3.5 w-3.5" />
                    <span>Chọn Cả Combo</span>
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

