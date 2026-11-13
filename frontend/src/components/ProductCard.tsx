"use client";

import Image from "next/image";
import { Plus, Shield, Zap } from "lucide-react";
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
    classes: "border-emerald-700/60 bg-emerald-950/60 text-emerald-300",
  },
  low_stock: {
    text: "SẮP HẾT",
    classes: "border-amber-700/60 bg-amber-950/60 text-amber-300",
  },
  jdm_preorder: {
    text: "ĐẶT NHẬT",
    classes: "border-red-700/60 bg-red-950/70 text-red-300",
  },
};

export function ProductCard({ product, onSelect, onQuickAdd }: ProductCardProps) {
  const stock = STOCK_LABELS[product.stockStatus];

  return (
    <article className="lantern-card group flex flex-col overflow-hidden rounded-2xl">
      <div
        onClick={() => onSelect(product)}
        className="relative aspect-[4/3] w-full cursor-pointer overflow-hidden border-b border-red-900/30 bg-[#070406]"
      >
        <Image
          src={product.image}
          alt={product.nameVi}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition duration-500 group-hover:scale-105 group-hover:brightness-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0608] via-transparent to-black/40" />

        {/* Top badges */}
        <div className="absolute top-3 right-3 left-3 flex items-center justify-between gap-2">
          <span className="rounded border border-red-600/60 bg-[#1a070b]/90 px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-red-300 backdrop-blur-sm">
            {product.badgeText}
          </span>
          <span
            className={`rounded border px-2 py-0.5 font-mono text-[10px] font-semibold ${stock.classes}`}
          >
            {stock.text} ({product.stockQty})
          </span>
        </div>

        {/* Bottom Japanese nameplate */}
        <div className="absolute right-3 bottom-2.5 left-3 flex items-end justify-between gap-2">
          <span className="font-[family-name:var(--font-serif-jp)] text-xs text-amber-300/90 drop-shadow">
            {product.nameJp}
          </span>
          <span className="rounded bg-black/75 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
            {product.sku}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
            <span className="text-red-400">{product.brand}</span>
            <span>OEM: {product.oemRef}</span>
          </div>

          <h3
            onClick={() => onSelect(product)}
            className="mt-1.5 cursor-pointer text-base leading-snug font-bold text-[#ede6e1] group-hover:text-[#ff4d5e] transition-colors"
          >
            {product.nameVi}
          </h3>

          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-400">
            {product.summaryVi}
          </p>

          {/* Compact Japanese technical spec strip */}
          <div className="mt-3.5 grid grid-cols-2 gap-2 rounded-xl border border-red-900/25 bg-[#090507] p-2.5 text-[11px]">
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
                className="rounded border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-[10px] text-zinc-400"
              >
                {make}
              </span>
            ))}
            {product.compatibleVehicles.length > 4 && (
              <span className="rounded border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-[10px] text-zinc-500">
                +{product.compatibleVehicles.length - 4}
              </span>
            )}
          </div>
        </div>

        <div className="mt-5 flex items-end justify-between border-t border-red-900/25 pt-4">
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
              className="rounded-lg border border-red-900/50 bg-[#150b0f] px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:border-red-500 hover:text-white cursor-pointer"
            >
              Thông Số
            </button>
            <button
              type="button"
              onClick={() => onQuickAdd(product)}
              className="inline-flex items-center gap-1 rounded-lg bg-[#e11d2e] px-3 py-2 text-xs font-bold text-white shadow-[0_0_16px_rgba(225,29,46,0.35)] transition hover:bg-[#ff2e43] cursor-pointer"
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
