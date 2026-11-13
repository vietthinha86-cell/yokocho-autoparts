"use client";

import Image from "next/image";
import { CheckCircle2, Plus, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { formatVnd } from "@/lib/api";
import type { AutoPartProduct } from "@/types/autoparts";

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
    >
      <div className="yokocho-panel relative max-h-[90vh] w-full max-w-3xl overflow-y-auto border-red-600/60 shadow-[0_0_60px_rgba(225,29,46,0.4)]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng thông số sản phẩm"
          className="absolute top-4 right-4 z-10 rounded-full border border-red-900/60 bg-black/70 p-2 text-zinc-300 hover:border-red-500 hover:text-white cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="grid md:grid-cols-12">
          <div className="relative min-h-64 border-b border-red-900/35 bg-black md:col-span-5 md:border-r md:border-b-0">
            <Image
              src={product.image}
              alt={product.nameVi}
              fill
              sizes="(max-width: 768px) 100vw, 40vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d070a] via-transparent to-transparent" />
            <div className="absolute right-4 bottom-4 left-4">
              <p className="font-[family-name:var(--font-serif-jp)] text-sm text-amber-300">
                {product.nameJp}
              </p>
              <p className="font-mono text-xs text-zinc-400">
                SKU: {product.sku} • OEM: {product.oemRef}
              </p>
            </div>
          </div>

          <div className="p-6 md:col-span-7">
            <span className="font-mono text-xs tracking-widest text-red-400 uppercase">
              {product.brand}
            </span>
            <h3 className="mt-1 text-xl font-bold text-[#ede6e1]">{product.nameVi}</h3>
            <p className="mt-2.5 text-sm leading-relaxed text-zinc-300">{product.summaryVi}</p>

            {/* Highlights */}
            <ul className="mt-4 space-y-1.5">
              {product.highlights.map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs text-zinc-300">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            {/* Spec Table */}
            <div className="mt-5 rounded-xl border border-red-900/35 bg-[#080406] p-3.5 text-xs">
              <p className="mb-2 font-mono text-[11px] tracking-wider text-red-400 uppercase">
                仕様書 // Bảng Thông Số Kỹ Thuật
              </p>
              <dl className="grid grid-cols-2 gap-y-2 gap-x-4">
                {product.specs.wattage && (
                  <>
                    <dt className="text-zinc-500">Công suất</dt>
                    <dd className="font-mono text-zinc-200">{product.specs.wattage}</dd>
                  </>
                )}
                {product.specs.lumens && (
                  <>
                    <dt className="text-zinc-500">Quang thông</dt>
                    <dd className="font-mono text-zinc-200">{product.specs.lumens}</dd>
                  </>
                )}
                {product.specs.socket && (
                  <>
                    <dt className="text-zinc-500">Chân lắp</dt>
                    <dd className="font-mono text-zinc-200">{product.specs.socket}</dd>
                  </>
                )}
                <dt className="text-zinc-500">Xuất xứ / Tiêu chuẩn</dt>
                <dd className="text-zinc-200">{product.specs.origin}</dd>
                <dt className="text-zinc-500">Bảo hành</dt>
                <dd className="inline-flex items-center gap-1 text-emerald-300">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {product.specs.warrantyMonths} tháng (1 đổi 1)
                </dd>
              </dl>
            </div>

            {/* Kelvin / Variant selector */}
            <div className="mt-4">
              <p className="text-xs font-semibold text-zinc-300">Chọn phiên bản / Nhiệt màu:</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {kelvinOptions.map((k) => {
                  const chosen = activeKelvin === k;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setSelectedKelvin(k)}
                      className={`rounded-md border px-3 py-1.5 font-mono text-xs transition cursor-pointer ${
                        chosen
                          ? "border-red-500 bg-[#e11d2e] text-white"
                          : "border-red-900/40 bg-[#140a0e] text-zinc-300 hover:border-red-500/60"
                      }`}
                    >
                      {k}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-red-900/35 pt-4">
              <div>
                <p className="text-xs text-zinc-500">Giá niêm yết</p>
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
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#b91c1c] to-[#e11d2e] px-5 py-3 text-sm font-bold text-white shadow-[0_0_24px_rgba(225,29,46,0.45)] hover:brightness-110 cursor-pointer"
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
