"use client";

import { GitBranch, PackageSearch, Server, Workflow } from "lucide-react";
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
        <div className="yokocho-panel relative p-6 lg:col-span-6">
          <span className="pointer-events-none absolute top-0 left-0 h-2.5 w-2.5 border-t border-l border-red-500/80" />
          <span className="pointer-events-none absolute right-0 bottom-0 h-2.5 w-2.5 border-r border-b border-red-500/80" />
          <div className="flex items-center gap-2 font-mono text-xs tracking-widest text-red-400 uppercase">
            <PackageSearch className="h-4 w-4" />
            <span>注文追跡 // Tra Cứu Đơn Hàng Real-time</span>
          </div>
          <h2 className="mt-1.5 font-[family-name:var(--font-serif-jp)] text-xl font-bold text-white">
            Kiểm Tra Trạng Thái Đơn Phụ Tùng
          </h2>
          <p className="mt-1.5 text-xs text-zinc-400">
            Nhập mã đơn <span className="font-mono text-amber-300">YKC-...</span> sau khi đặt hàng để
            kiểm tra dữ liệu trực tiếp từ Backend API.
          </p>

          <form onSubmit={handleSearch} className="mt-4 flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ví dụ: YKC-8492-A1B2"
              className="flex-1 rounded-lg border border-red-900/50 bg-[#150b10] px-3.5 py-2.5 font-mono text-xs text-white placeholder:text-zinc-500 focus:border-red-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-[#e11d2e] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#ff2e43] disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Đang tìm..." : "Tra Cứu"}
            </button>
          </form>

          {error && (
            <p className="mt-3 rounded-lg border border-red-800/60 bg-red-950/50 px-3 py-2 text-xs text-red-200">
              {error}
            </p>
          )}

          {order && (
            <div className="mt-4 rounded-xl border border-emerald-800/50 bg-[#08110c] p-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-amber-300">{order.orderCode}</span>
                <span className="rounded bg-emerald-950 px-2 py-0.5 font-mono text-[11px] text-emerald-300">
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

        {/* Project Roadmap Summary Card */}
        <div className="yokocho-panel relative p-6 lg:col-span-6">
          <span className="pointer-events-none absolute top-0 left-0 h-2.5 w-2.5 border-t border-l border-amber-500/80" />
          <span className="pointer-events-none absolute right-0 bottom-0 h-2.5 w-2.5 border-r border-b border-amber-500/80" />
          <div className="flex items-center gap-2 font-mono text-xs tracking-widest text-amber-400 uppercase">
            <GitBranch className="h-4 w-4" />
            <span>GitHub Roadmap &amp; Daily CI/CD</span>
          </div>
          <h2 className="mt-1.5 font-[family-name:var(--font-serif-jp)] text-xl font-bold text-white">
            Kiến Trúc Dự Án &amp; Lộ Trình Phát Triển
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-red-900/30 bg-[#140a0e] p-3.5">
              <div className="flex items-center gap-2 text-xs font-bold text-red-300">
                <Server className="h-4 w-4" />
                <span>Backend + Database</span>
              </div>
              <p className="mt-1 text-xs text-zinc-400">
                Phase 1: Express REST API + Test. Phase 2: PostgreSQL + Prisma + Admin Auth.
              </p>
            </div>
            <div className="rounded-xl border border-red-900/30 bg-[#140a0e] p-3.5">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <Workflow className="h-4 w-4" />
                <span>Deploy &amp; Daily Git Push</span>
              </div>
              <p className="mt-1 text-xs text-zinc-400">
                GitHub Actions tự test &amp; build mỗi lần push. Vercel (FE) + Render/VPS (BE).
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

