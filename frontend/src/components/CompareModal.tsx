"use client";

import Image from "next/image";
import { GitCompareArrows, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { formatVnd } from "@/lib/api";
import type { AutoPartProduct } from "@/types/autoparts";

interface CompareModalProps {
  selectedProducts: AutoPartProduct[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onQuickAdd: (product: AutoPartProduct) => void;
}

export function CompareModal({
  selectedProducts,
  onRemove,
  onClear,
  onQuickAdd,
}: CompareModalProps) {
  const [open, setOpen] = useState(false);

  if (selectedProducts.length === 0) {
    return null;
  }

  return (
    <>
      {/* Floating bottom comparison dock */}
      <div className="fixed right-4 bottom-4 left-4 z-40 mx-auto max-w-4xl">
        <div className="yokocho-panel chamfer-sm flex flex-wrap items-center justify-between gap-3 border-red-500/80 bg-[#0d0408]/96 px-4 py-3 shadow-[0_0_40px_rgba(225,29,46,0.45)] backdrop-blur-xl">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-amber-300">
              <GitCompareArrows className="h-4 w-4 text-[#ff4d5e]" />
              <span>SO SÁNH ({selectedProducts.length}/3):</span>
            </div>

            {selectedProducts.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2 border border-red-800/60 bg-[#17090e] py-1 pr-1.5 pl-1.5 text-xs text-zinc-100"
              >
                <Image
                  src={p.image}
                  alt={p.nameVi}
                  width={24}
                  height={24}
                  unoptimized={!p.image.startsWith("/")}
                  className="h-6 w-6 object-cover"
                />
                <span className="max-w-32 truncate font-medium">{p.nameVi}</span>
                <button
                  type="button"
                  onClick={() => onRemove(p.id)}
                  aria-label={`Bỏ so sánh ${p.nameVi}`}
                  className="cursor-pointer text-zinc-400 hover:text-red-400"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClear}
              className="inline-flex cursor-pointer items-center gap-1 border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-300 hover:border-red-500 hover:text-white"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Xóa</span>
            </button>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="chamfer-sm cursor-pointer bg-[#e11d2e] px-4 py-1.5 font-mono text-xs font-bold text-white shadow-[0_0_16px_rgba(225,29,46,0.5)] hover:bg-[#ff2e43]"
            >
              Mở Bảng So Sánh
            </button>
          </div>
        </div>
      </div>

      {/* Full Spec Comparison Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
        >
          <div className="yokocho-panel chamfer-md relative max-h-[90vh] w-full max-w-5xl overflow-y-auto border-red-500/75 p-6 shadow-[0_0_70px_rgba(225,29,46,0.48)]">
            <div className="flex items-center justify-between border-b border-red-900/45 pb-4">
              <div>
                <p className="font-mono text-xs font-bold tracking-widest text-[#ff4d5e] uppercase">
                  SPECIFICATION MATRIX // Bảng Đối Chiếu Thông Số
                </p>
                <h3 className="font-display mt-1 text-xl font-bold text-white">
                  So Sánh Chi Tiết {selectedProducts.length} Phụ Tùng
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Đóng bảng so sánh"
                className="chamfer-sm cursor-pointer border border-red-700/70 bg-black/80 p-2 text-zinc-300 hover:border-red-500 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-red-900/45">
                    <th className="w-40 py-3 pr-4 font-mono text-zinc-400 uppercase">Hạng Mục</th>
                    {selectedProducts.map((p) => (
                      <th key={p.id} className="w-60 px-3 py-3 align-top">
                        <div className="relative mb-2.5 aspect-[16/10] w-full overflow-hidden border border-red-800/45 bg-black">
                          <Image
                            src={p.image}
                            alt={p.nameVi}
                            fill
                            sizes="240px"
                            unoptimized={!p.image.startsWith("/")}
                            className="photo-razor object-cover"
                          />
                        </div>
                        <p className="font-mono text-[10px] text-[#ff4d5e]">{p.brand}</p>
                        <p className="font-display mt-0.5 text-sm font-bold text-white">
                          {p.nameVi}
                        </p>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-950/60">
                  <tr>
                    <td className="py-3 pr-4 font-mono text-zinc-400">Giá bán</td>
                    {selectedProducts.map((p) => (
                      <td key={p.id} className="px-3 py-3 font-mono text-base font-bold text-[#ff4d5e]">
                        {formatVnd(p.priceVnd)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-mono text-zinc-400">Công suất</td>
                    {selectedProducts.map((p) => (
                      <td key={p.id} className="px-3 py-3 font-mono text-zinc-200">
                        {p.specs.wattage ?? p.specs.voltage ?? "Tiêu chuẩn"}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-mono text-zinc-400">Quang thông</td>
                    {selectedProducts.map((p) => (
                      <td key={p.id} className="px-3 py-3 font-mono text-amber-300">
                        {p.specs.lumens ?? "—"}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-mono text-zinc-400">Nhiệt màu / Spec</td>
                    {selectedProducts.map((p) => (
                      <td key={p.id} className="px-3 py-3 text-zinc-200">
                        {p.specs.kelvin ? p.specs.kelvin.join(" • ") : "Chuẩn OEM"}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-mono text-zinc-400">Chân lắp</td>
                    {selectedProducts.map((p) => (
                      <td key={p.id} className="px-3 py-3 text-zinc-200">
                        {p.specs.socket ?? "Theo moay-ơ xe"}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-mono text-zinc-400">Bảo hành</td>
                    {selectedProducts.map((p) => (
                      <td key={p.id} className="px-3 py-3 font-semibold text-emerald-300">
                        {p.specs.warrantyMonths} tháng (1 đổi 1)
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-mono text-zinc-400">Xe phù hợp</td>
                    {selectedProducts.map((p) => (
                      <td key={p.id} className="px-3 py-3 text-zinc-300">
                        {p.compatibleVehicles.join(", ")}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-mono text-zinc-400">Thao tác</td>
                    {selectedProducts.map((p) => (
                      <td key={p.id} className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => {
                            onQuickAdd(p);
                            setOpen(false);
                          }}
                          className="chamfer-sm inline-flex cursor-pointer items-center gap-1 bg-[#e11d2e] px-3 py-2 font-bold text-white hover:bg-[#ff2e43]"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Thêm Vào Giỏ</span>
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

