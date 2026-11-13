"use client";

import Image from "next/image";
import { Plus, Shield, Zap } from "lucide-react";
import { useState } from "react";
import { formatVnd } from "@/lib/api";
import type { AutoPartProduct } from "@/types/autoparts";

interface ProductCardProps {
  product: AutoPartProduct;
  onSelect: (product: AutoPartProduct) => void;
  onQuickAdd: (product: AutoPartProduct) => void;
}

const STOCK_LABELS: Record<
  AutoPartProduct["stockStatus"],
  { text: string; classes: string }
> = {
  in_stock: {
    text: "SẴN KHO",
    classes: "border-emerald-700/60 bg-emerald-950/75 text-emerald-300",
  },
  low_stock: {
    text: "SẮP HẾT",
    classes: "border-amber-700/60 bg-amber-950/75 text-amber-300",
  },
  jdm_preorder: {
    text: "ĐẶT NHẬT",
    classes: "border-red-700/60 bg-red-950/80 text-red-300",
  },
};

export function ProductCard({ product, onSelect, onQuickAdd }: ProductCardProps) {
  const stock = STOCK_LABELS[product.stockStatus];
  const [spot, setSpot] = useState({ x: 50, y: 50, active: false });

  function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setSpot({ x, y, active: true });
  }

  return (
    <article
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setSpot((prev) => ({ ...prev, active: false }))}
      className="lantern-card group flex flex-col overflow-hidden"
    >
      {/* Dynamic cursor-follow red lantern glow */}
      <div
        className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300"
        style={{
          opacity: spot.active ? 1 : 0,
          background: `radial-gradient(280px circle at ${spot.x}% ${spot.y}%, rgba(225, 29, 46, 0.2), transparent 65%)`,
        }}
      />

      {/* Sharp Japanese corner ticks */}
      <span className="pointer-events-none absolute top-0 left-0 z-20 h-2.5 w-2.5 border-t border-l border-red-500/80" />
      <span className="pointer-events-none absolute top-0 right-0 z-20 h-2.5 w-2.5 border-t border-r border-red-500/80" />
      <span className="pointer-events-none absolute bottom-0 left-0 z-20 h-2.5 w-2.5 border-b border-l border-red-500/80" />
      <span className="pointer-events-none absolute right-0 bottom-0 z-20 h-2.5 w-2.5 border-r border-b border-red-500/80" />

      <div
        onClick={() => onSelect(product)}
        className="relative aspect-[4/3] w-full cursor-pointer overflow-hidden border-b border-red-900/35 bg-[#060305]"
      >
        <Image
          src={product.image}
          alt={product.nameVi}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition duration-500 group-hover:scale-105 group-hover:brightness-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080407] via-transparent to-black/45" />

        {/* Haunting translucent Kanji watermark that glows crimson on hover */}
        {product.kanjiMark && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-3 bottom-7 font-[family-name:var(--font-serif-jp)] text-6xl font-black text-red-500/10 transition-all duration-300 select-none group-hover:text-red-500/35 group-hover:drop-shadow-[0_0_20px_rgba(225,29,46,0.75)]"
          >
            {product.kanjiMark}
          </span>
        )}

        {/* Top badges */}
        <div className="absolute top-3 right-3 left-3 flex items-center justify-between gap-2">
          <span className="border border-red-600/65 bg-[#19060a]/90 px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-red-300 backdrop-blur-sm">
            {product.badgeText}
          </span>
          <span
            className={`border px-2 py-0.5 font-mono text-[10px] font-semibold ${stock.classes}`}
          >
            {stock.text} ({product.stockQty})
          </span>
        </div>

        {/* Bottom Japanese nameplate */}
        <div className="absolute right-3 bottom-2.5 left-3 flex items-end justify-between gap-2">
          <span className="font-[family-name:var(--font-serif-jp)] text-xs text-amber-300/95 drop-shadow">
            {product.nameJp}
          </span>
          <span className="border border-white/10 bg-black/80 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
            {product.sku}
          </span>
        </div>
      </div>

      <div className="relative z-20 flex flex-1 flex-col justify-between p-5">
        <div>
          <div className="flex items-center justify-between font-mono text-[11px] text-zinc-400">
            <span className="text-red-400">{product.brand}</span>
            <span>OEM: {product.oemRef}</span>
          </div>

          <h3
            onClick={() => onSelect(product)}
            className="mt-1.5 cursor-pointer text-base leading-snug font-bold text-[#ede6e1] transition-colors group-hover:text-[#ff4d5e]"
          >
            {product.nameVi}
          </h3>

          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-400">
            {product.summaryVi}
          </p>

          {/* Compact Japanese technical spec strip */}
          <div className="mt-3.5 grid grid-cols-2 gap-2 border border-red-900/30 bg-[#080406] p-2.5 text-[11px]">
            <div className="flex items-center gap-1.5 text-zinc-300">
              <Zap className="h-3.5 w-3.5 shrink-0 text-amber-400" />
              <span className="truncate">{product.specs.wattage ?? product.specs.voltage}</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-300">
              <Shield className="h-3.5 w-3.5 shrink-0 text-red-400" />
              <span>BH {product.specs.warrantyMonths} tháng</span>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {product.compatibleVehicles.slice(0, 4).map((make) => (
              <span
                key={make}
                className="border border-zinc-800/80 bg-zinc-950 px-2 py-0.5 font-mono text-[10px] text-zinc-400"
              >
                {make}
              </span>
            ))}
            {product.compatibleVehicles.length > 4 && (
              <span className="border border-zinc-800/80 bg-zinc-950 px-2 py-0.5 font-mono text-[10px] text-zinc-500">
                +{product.compatibleVehicles.length - 4}
              </span>
            )}
          </div>
        </div>

        <div className="mt-5 flex items-end justify-between border-t border-red-900/30 pt-4">
          <div>
            {product.originalPriceVnd && (
              <p className="font-mono text-xs text-zinc-500 line-through">
                {formatVnd(product.originalPriceVnd)}
              </p>
            )}
            <p className="font-mono text-lg font-bold text-[#ff4d5e]">
              {formatVnd(product.priceVnd)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSelect(product)}
              className="cursor-pointer border border-red-900/55 bg-[#150a0e] px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:border-red-500 hover:text-white"
            >
              Thông Số
            </button>
            <button
              type="button"
              onClick={() => onQuickAdd(product)}
              className="inline-flex cursor-pointer items-center gap-1 bg-[#e11d2e] px-3 py-2 text-xs font-bold text-white shadow-[0_0_16px_rgba(225,29,46,0.4)] transition hover:bg-[#ff2e43]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Thêm</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
