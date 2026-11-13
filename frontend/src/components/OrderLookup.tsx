"use client";

import { PackageSearch, ShieldCheck, Wrench } from "lucide-react";
import { useState } from "react";
import { formatVnd, lookupOrder } from "@/lib/api";
import type { OrderRecord } from "@/types/autoparts";

interface OrderLookupProps {
  lastOrderCode?: string;
}

export function OrderLookup({ lastOrderCode }: OrderLookupProps) {
  const [code, setCode] = useState(lastOrderCode ?? "");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    const res = await lookupOrder(code);
    setLoading(false);
    if (!res.ok || !res.order) {
      setOrder(null);
      setError(res.error ?? "Không tìm thấy đơn hàng.");
      return;
    }
    setOrder(res.order);
  }

  return (
    <section id="order-lookup" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Order Lookup Card */}
        <div className="yokocho-panel chamfer-md relative p-6 lg:col-span-6">
          <span className="pointer-events-none absolute top-0 left-0 h-2.5 w-2.5 border-t border-l border-[#ff2e43]" />
          <span className="pointer-events-none absolute right-0 bottom-0 h-2.5 w-2.5 border-r border-b border-[#ff2e43]" />
          <div className="flex items-center gap-2 font-mono text-xs tracking-widest text-red-400 uppercase">
            <PackageSearch className="h-4 w-4" />
            <span>注文追跡 // Tra Cứu Đơn Hàng Nhanh</span>
          </div>
          <h2 className="mt-1.5 font-[family-name:var(--font-serif-jp)] text-xl font-bold text-white">
            Kiểm Tra Trạng Thái Đơn Phụ Tùng
          </h2>
          <p className="mt-1.5 text-xs text-zinc-400">
            Nhập mã đơn <span className="font-mono text-amber-300">YKC-...</span> sau khi đặt hàng
            để theo dõi tiến độ đóng gói, kiểm giắc và giao nhận.
          </p>

          <form onSubmit={handleSearch} className="mt-4 flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ví dụ: YKC-8492-A1B2"
              className="flex-1 border border-red-900/55 bg-[#090406] px-3.5 py-2.5 font-mono text-xs text-white placeholder:text-zinc-500 focus:border-red-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="chamfer-sm cursor-pointer bg-gradient-to-r from-[#c81628] to-[#ff2e43] px-4 py-2.5 text-xs font-bold text-white shadow-[0_0_16px_rgba(225,29,46,0.45)] transition hover:brightness-115 disabled:opacity-50"
            >
              {loading ? "Đang tìm..." : "Tra Cứu"}
            </button>
          </form>

          {error && (
            <p className="mt-3 border border-red-800/60 bg-red-950/50 px-3 py-2 text-xs text-red-200">
              {error}
            </p>
          )}

          {order && (
            <div className="mt-4 border border-emerald-800/50 bg-[#08110c] p-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-amber-300">{order.orderCode}</span>
                <span className="border border-emerald-700/50 bg-emerald-950 px-2 py-0.5 font-mono text-[11px] text-emerald-300">
                  {order.status}
                </span>
              </div>
              <p className="mt-2 text-zinc-300">
                Khách: {order.customerName} • Xe: {order.vehicleInfo}
              </p>
              <p className="mt-1 font-mono font-bold text-[#ff4d5e]">
                Tổng: {formatVnd(order.totalVnd)} ({order.items.length} sản phẩm)
              </p>
            </div>
          )}
        </div>

        {/* Customer Night Garage Support & Warranty Card */}
        <div className="yokocho-panel chamfer-md relative p-6 lg:col-span-6">
          <span className="pointer-events-none absolute top-0 left-0 h-2.5 w-2.5 border-t border-l border-amber-400/90" />
          <span className="pointer-events-none absolute right-0 bottom-0 h-2.5 w-2.5 border-r border-b border-amber-400/90" />
          <div className="flex items-center gap-2 font-mono text-xs tracking-widest text-amber-400 uppercase">
            <ShieldCheck className="h-4 w-4" />
            <span>夜間保証・取付案内 // Hậu Mãi Xưởng Đêm</span>
          </div>
          <h2 className="mt-1.5 font-[family-name:var(--font-serif-jp)] text-xl font-bold text-white">
            Cam Kết Lắp Đặt &amp; Bảo Hành Độc Quyền
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="border border-red-900/35 bg-[#0c0609] p-3.5">
              <div className="flex items-center gap-2 text-xs font-bold text-red-300">
                <Wrench className="h-4 w-4" />
                <span>Kiểm Giắc Theo Đời Xe</span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
                Xác nhận đúng chân H4/H7/H11/Bi-Gầm trước khi giao. Hỗ trợ lắp đêm hoặc ship COD kiểm hàng.
              </p>
            </div>
            <div className="border border-red-900/35 bg-[#0c0609] p-3.5">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <ShieldCheck className="h-4 w-4" />
                <span>Bảo Hành 1 Đổi 1 (36 Tháng)</span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
                Đổi mới ngay nếu lỗi chip LED, quạt tản nhiệt hoặc hấp hơi nước. Freeship từ 3.000.000₫.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
