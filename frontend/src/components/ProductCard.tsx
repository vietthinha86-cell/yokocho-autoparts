"use client";

import { GitCompareArrows, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { formatVnd } from "@/lib/api";
import type { AutoPartProduct } from "@/types/autoparts";
import { AnimatedProductVisual } from "./AnimatedProductVisual";

interface ProductCardProps {
  product: AutoPartProduct;
  index?: number;
  isCompared?: boolean;
  onSelect: (product: AutoPartProduct) => void;
  onQuickAdd: (product: AutoPartProduct) => void;
  onToggleCompare?: (product: AutoPartProduct) => void;
}

const STOCK_LABELS: Record<
  AutoPartProduct["stockStatus"],
  { text: string; classes: string }
> = {
  in_stock: {
    text: "SẴN KHO",
    classes: "border-emerald-600/75 bg-emerald-950/85 text-emerald-300",
  },
  low_stock: {
    text: "SẮP HẾT",
    classes: "border-amber-500/80 bg-amber-950/85 text-amber-300",
  },
  jdm_preorder: {
    text: "ĐẶT NHẬT",
    classes: "border-red-500/80 bg-red-950/90 text-red-300",
  },
};

export function ProductCard({
  product,
  index = 0,
  isCompared = false,
  onSelect,
  onQuickAdd,
  onToggleCompare,
}: ProductCardProps) {
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
      className="lantern-card chamfer-card group flex flex-col overflow-hidden"
    >
      {/* Dynamic cursor-follow red lantern glow */}
      <div
        className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300"
        style={{
          opacity: spot.active ? 1 : 0,
          background: `radial-gradient(280px circle at ${spot.x}% ${spot.y}%, rgba(255, 46, 67, 0.24), transparent 65%)`,
        }}
      />

      {/* Sharp animated optical product stage */}
      <div
        onClick={() => onSelect(product)}
        className="relative aspect-[4/3] w-full cursor-pointer overflow-hidden border-b border-red-700/45 bg-[#050204]"
      >
        <AnimatedProductVisual
          productId={product.id}
          category={product.category}
          src={product.image}
          alt={product.nameVi}
          kanjiMark={product.kanjiMark}
          sizes="(max-width: 768px) 100vw, 33vw"
          index={index}
          variant="card"
        />

        {/* Top badges */}
        <div className="absolute top-3 right-3 left-3 z-20 flex items-center justify-between gap-2">
          <span className="chamfer-sm border border-red-500/75 bg-[#1b0509]/92 px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-red-200 backdrop-blur-sm">
            {product.badgeText}
          </span>
          <span
            className={`border px-2 py-0.5 font-mono text-[10px] font-bold ${stock.classes}`}
          >
            {stock.text}
          </span>
        </div>

        {/* Bottom Japanese nameplate */}
        <div className="absolute right-3 bottom-2.5 left-3 z-20 flex items-end justify-between gap-2">
          <span className="font-jp text-xs font-bold text-amber-300 drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
            {product.nameJp}
          </span>
        </div>

        {/* Bottom razor crimson laser line on hover */}
        <div className="pointer-events-none absolute bottom-0 left-0 z-20 h-[2px] w-0 bg-gradient-to-r from-[#ff2e43] via-amber-400 to-[#ff2e43] shadow-[0_0_12px_#ff2e43] transition-all duration-500 group-hover:w-full" />
      </div>

      <div className="relative z-20 flex flex-1 flex-col justify-between p-4 sm:p-5">
        <div>
          <div className="flex items-center justify-between gap-2 font-mono text-[11px] text-zinc-400">
            <span className="truncate font-bold tracking-wider text-[#ff4d5e]">{product.brand}</span>
            <span className="shrink-0 text-amber-300/90">
              {product.specs.wattage ?? product.specs.voltage ?? `BH ${product.specs.warrantyMonths}T`}
            </span>
          </div>

          <h3 className="font-display mt-1.5 line-clamp-2 text-[17px] leading-snug font-bold tracking-tight text-[#f3ede8] transition-colors group-hover:text-[#ff4d5e]">
            <Link href={`/san-pham/${product.slug}`} className="hover:underline">
              {product.nameVi}
            </Link>
          </h3>
        </div>

        <div className="mt-4 flex items-end justify-between gap-2 border-t border-red-900/40 pt-3.5">
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

          <div className="flex items-center gap-1.5">
            {onToggleCompare && (
              <button
                type="button"
                onClick={() => onToggleCompare(product)}
                title={isCompared ? "Bỏ so sánh" : "So sánh thông số sản phẩm"}
                aria-label={`So sánh ${product.nameVi}`}
                className={`chamfer-sm inline-flex cursor-pointer items-center justify-center border p-2 text-xs font-semibold transition ${isCompared
                    ? "border-amber-400 bg-amber-500/20 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                    : "border-zinc-700 bg-[#12070b] text-zinc-300 hover:border-amber-400/70 hover:text-amber-200"
                  }`}
              >
                <GitCompareArrows className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => onSelect(product)}
              className="chamfer-sm cursor-pointer border border-red-800/65 bg-[#16090d] px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:border-red-400 hover:text-white"
            >
              Chi Tiết
            </button>
            <button
              type="button"
              onClick={() => onQuickAdd(product)}
              className="chamfer-sm inline-flex cursor-pointer items-center gap-1 bg-gradient-to-r from-[#c81628] to-[#ff2e43] px-3 py-2 text-xs font-bold text-white shadow-[0_0_20px_rgba(225,29,46,0.5)] transition hover:brightness-115"
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
