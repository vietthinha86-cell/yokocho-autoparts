"use client";

import { CheckCircle2, Plus, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { formatVnd } from "@/lib/api";
import type { AutoPartProduct } from "@/types/autoparts";
import { AnimatedProductVisual } from "./AnimatedProductVisual";

interface ProductModalProps {
  product: AutoPartProduct | null;
  onClose: () => void;
  onAddToCart: (product: AutoPartProduct, selectedKelvin: string) => void;
}

export function ProductModal({ product, onClose, onAddToCart }: ProductModalProps) {
  const kelvinOptions = product?.specs.kelvin ?? ["Tiêu chuẩn"];
  const [selectedKelvin, setSelectedKelvin] = useState<string>(kelvinOptions[0] ?? "Tiêu chuẩn");

  if (!product) {
    return null;
  }

  const activeKelvin = kelvinOptions.includes(selectedKelvin)
    ? selectedKelvin
    : kelvinOptions[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
    >
      <div className="yokocho-panel chamfer-md relative max-h-[90vh] w-full max-w-3xl overflow-y-auto border-red-500/70 shadow-[0_0_70px_rgba(225,29,46,0.48)]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng thông số sản phẩm"
          className="chamfer-sm absolute top-4 right-4 z-30 cursor-pointer border border-red-700/75 bg-black/85 p-2 text-zinc-200 transition hover:border-[#ff2e43] hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="grid md:grid-cols-12">
          <div className="group relative min-h-72 border-b border-red-800/45 bg-black md:col-span-5 md:border-r md:border-b-0">
            <AnimatedProductVisual
              productId={product.id}
              category={product.category}
              src={product.image}
              alt={product.nameVi}
              kanjiMark={product.kanjiMark}
              sizes="(max-width: 768px) 100vw, 40vw"
              variant="modal"
            />
            <div className="pointer-events-none absolute right-4 bottom-4 left-4 z-20">
              <p className="font-jp text-sm font-bold text-amber-300">
                {product.nameJp}
              </p>
              <p className="font-mono text-xs text-zinc-300">
                SKU: {product.sku} • OEM: {product.oemRef}
              </p>
            </div>
          </div>

          <div className="p-6 md:col-span-7">
            <span className="font-mono text-xs font-bold tracking-widest text-[#ff4d5e] uppercase">
              {product.brand}
            </span>
            <h3 className="font-display mt-1 text-xl font-bold tracking-tight text-[#f3ede8]">
              {product.nameVi}
            </h3>
            <p className="mt-2.5 text-sm leading-relaxed text-zinc-300">{product.summaryVi}</p>

            {/* Highlights */}
            <ul className="mt-4 space-y-1.5">
              {product.highlights.map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs text-zinc-200">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#ff4d5e]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            {/* Spec Table */}
            <div className="mt-5 border border-red-900/45 bg-[#080305] p-3.5 text-xs">
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-red-400 uppercase">
                <span className="font-jp">仕様書</span>
                <span className="font-mono">{"//"} Bảng Thông Số Kỹ Thuật</span>
              </p>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                {product.specs.wattage && (
                  <>
                    <dt className="text-zinc-500">Công suất</dt>
                    <dd className="font-mono text-zinc-100">{product.specs.wattage}</dd>
                  </>
                )}
                {product.specs.lumens && (
                  <>
                    <dt className="text-zinc-500">Quang thông</dt>
                    <dd className="font-mono text-zinc-100">{product.specs.lumens}</dd>
                  </>
                )}
                {product.specs.socket && (
                  <>
                    <dt className="text-zinc-500">Chân lắp</dt>
                    <dd className="font-mono text-zinc-100">{product.specs.socket}</dd>
                  </>
                )}
                <dt className="text-zinc-500">Xuất xứ / Tiêu chuẩn</dt>
                <dd className="text-zinc-100">{product.specs.origin}</dd>
                <dt className="text-zinc-500">Bảo hành</dt>
                <dd className="inline-flex items-center gap-1 font-semibold text-emerald-300">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {product.specs.warrantyMonths} tháng (1 đổi 1)
                </dd>
              </dl>
            </div>

            {/* Kelvin / Variant selector */}
            <div className="mt-4">
              <p className="text-xs font-semibold text-zinc-200">Chọn phiên bản / Nhiệt màu:</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {kelvinOptions.map((k) => {
                  const chosen = activeKelvin === k;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setSelectedKelvin(k)}
                      className={`chamfer-sm cursor-pointer border px-3 py-1.5 font-mono text-xs font-semibold transition ${
                        chosen
                          ? "border-red-400 bg-[#e11d2e] text-white shadow-[0_0_16px_rgba(225,29,46,0.5)]"
                          : "border-red-900/50 bg-[#140a0e] text-zinc-300 hover:border-red-500"
                      }`}
                    >
                      {k}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-red-900/40 pt-4">
              <div>
                <p className="text-xs text-zinc-400">Giá niêm yết</p>
                <p className="font-mono text-2xl font-bold text-[#ff4d5e]">
                  {formatVnd(product.priceVnd)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onAddToCart(product, activeKelvin);
                  onClose();
                }}
                className="chamfer-sm inline-flex cursor-pointer items-center gap-2 bg-gradient-to-r from-[#b91c1c] to-[#ff2e43] px-5 py-3 text-sm font-bold text-white shadow-[0_0_26px_rgba(225,29,46,0.55)] transition hover:brightness-115"
              >
                <Plus className="h-4 w-4" />
                <span>Thêm Vào Giỏ Hàng</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
