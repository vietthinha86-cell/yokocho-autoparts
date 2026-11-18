"use client";

import {
  CheckCircle2,
  ClipboardCheck,
  Package,
  PackageSearch,
  ShieldCheck,
  Truck,
  Wrench,
} from "lucide-react";
import { useEffect, useState } from "react";
import { formatVnd, lookupOrder } from "@/lib/api";
import type { OrderRecord } from "@/types/autoparts";

interface OrderLookupProps {
  lastOrderCode?: string;
}

const ORDER_STEPS: Array<{
  key: OrderRecord["status"];
  label: string;
  sub: string;
  Icon: typeof ClipboardCheck;
}> = [
  { key: "pending_confirm", label: "Xác nhận giắc", sub: "Kiểm chân đèn & OEM", Icon: ClipboardCheck },
  { key: "packed", label: "Test & Đóng gói", sub: "Soi tia trước khi xuất", Icon: Package },
  { key: "shipping", label: "Đang giao", sub: "Ship COD / Chuyển phát", Icon: Truck },
  { key: "completed", label: "Hoàn tất", sub: "Kích hoạt BH điện tử", Icon: CheckCircle2 },
];

const STATUS_BADGE: Record<OrderRecord["status"], { label: string; cls: string }> = {
  pending_confirm: {
    label: "CHỜ XÁC NHẬN GIẮC",
    cls: "border-amber-600/60 bg-amber-950/70 text-amber-300",
  },
  packed: {
    label: "ĐÃ ĐÓNG GÓI",
    cls: "border-sky-600/60 bg-sky-950/70 text-sky-300",
  },
  shipping: {
    label: "ĐANG VẬN CHUYỂN",
    cls: "border-red-500/60 bg-red-950/70 text-red-200",
  },
  completed: {
    label: "HOÀN TẤT ĐƠN",
    cls: "border-emerald-600/60 bg-emerald-950/70 text-emerald-300",
  },
};

export function OrderLookup({ lastOrderCode }: OrderLookupProps) {
  const [code, setCode] = useState(lastOrderCode ?? "");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lastOrderCode?.trim()) return;
    let cancelled = false;
    lookupOrder(lastOrderCode).then((res) => {
      if (cancelled) return;
      if (res.ok && res.order) {
        setOrder(res.order);
        setError(null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [lastOrderCode]);

  async function performLookup(targetCode: string) {
    if (!targetCode.trim()) return;
    setLoading(true);
    setError(null);
    const res = await lookupOrder(targetCode);
    setLoading(false);
    if (!res.ok || !res.order) {
      setOrder(null);
      setError(res.error ?? "Không tìm thấy đơn hàng.");
      return;
    }
    setOrder(res.order);
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    await performLookup(code);
  }

  return (
    <section id="order-lookup" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Order Lookup Card */}
        <div className="yokocho-panel chamfer-md relative p-6 lg:col-span-6">
          <span className="pointer-events-none absolute top-0 left-0 h-2.5 w-2.5 border-t border-l border-[#ff2e43]" />
          <span className="pointer-events-none absolute right-0 bottom-0 h-2.5 w-2.5 border-r border-b border-[#ff2e43]" />
          <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-red-400 uppercase">
            <PackageSearch className="h-4 w-4" />
            <span className="font-jp">注文追跡</span>
            <span className="font-mono">{"//"} Tra Cứu Đơn Hàng Nhanh</span>
          </div>
          <h2 className="font-display mt-1.5 text-xl font-bold tracking-tight text-white">
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

          {lastOrderCode && !order && (
            <button
              type="button"
              onClick={() => {
                setCode(lastOrderCode);
                void performLookup(lastOrderCode);
              }}
              className="mt-2.5 inline-flex cursor-pointer items-center gap-2 border border-amber-500/45 bg-amber-950/35 px-3 py-1 font-mono text-[11px] font-semibold text-amber-300 transition hover:border-amber-400 hover:bg-amber-950/60"
            >
              <span>Tra nhanh đơn vừa đặt:</span>
              <span className="font-bold text-white">{lastOrderCode}</span>
            </button>
          )}

          {error && (
            <p className="mt-3 border border-red-800/60 bg-red-950/50 px-3 py-2 text-xs text-red-200">
              {error}
            </p>
          )}

          {order && (() => {
            const currentStepIdx = ORDER_STEPS.findIndex((s) => s.key === order.status);
            const badge = STATUS_BADGE[order.status];
            return (
              <div className="mt-4 space-y-4 border border-emerald-800/50 bg-[#08110c] p-4 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-mono text-sm font-bold text-amber-300">
                      {order.orderCode}
                    </span>
                    <p className="mt-0.5 text-[11px] text-zinc-400">
                      {new Date(order.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {order.paymentStatus === "paid" && (
                      <span className="border border-emerald-500/70 bg-emerald-950/80 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
                        ĐÃ THANH TOÁN QR
                      </span>
                    )}
                    <span className={`border px-2.5 py-0.5 font-mono text-[10px] font-bold ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>
                </div>

                {/* 4-step fulfillment timeline */}
                <div className="grid grid-cols-4 gap-1.5 border-y border-emerald-900/40 py-3">
                  {ORDER_STEPS.map((step, idx) => {
                    const reached = idx <= (currentStepIdx === -1 ? 0 : currentStepIdx);
                    const StepIcon = step.Icon;
                    return (
                      <div key={step.key} className="flex flex-col items-center text-center">
                        <div
                          className={`flex h-7 w-7 items-center justify-center border ${
                            reached
                              ? "border-emerald-400 bg-emerald-500/20 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.28)]"
                              : "border-zinc-800 bg-black/50 text-zinc-600"
                          }`}
                        >
                          <StepIcon className="h-3.5 w-3.5" />
                        </div>
                        <span
                          className={`mt-1.5 text-[10px] font-bold ${
                            reached ? "text-emerald-200" : "text-zinc-500"
                          }`}
                        >
                          {step.label}
                        </span>
                        <span className="hidden text-[9px] text-zinc-500 sm:block">{step.sub}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-1 text-zinc-300">
                  <p>
                    Khách hàng: <strong className="text-white">{order.customerName}</strong> ({order.phone})
                  </p>
                  <p>
                    Dòng xe: <span className="text-amber-200">{order.vehicleInfo}</span>
                  </p>
                </div>

                {/* Item breakdown */}
                <div className="space-y-1.5 border border-emerald-900/40 bg-black/40 p-2.5">
                  {order.items.map((item) => (
                    <div
                      key={`${item.productId}-${item.selectedKelvin ?? "std"}`}
                      className="flex items-center justify-between gap-2 text-[11px]"
                    >
                      <span className="truncate text-zinc-200">
                        {item.nameVi}{" "}
                        {item.selectedKelvin ? `(${item.selectedKelvin})` : ""} × {item.quantity}
                      </span>
                      <span className="shrink-0 font-mono text-zinc-300">
                        {formatVnd(item.lineTotalVnd)}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between border-t border-emerald-900/40 pt-1.5 text-[11px] text-zinc-400">
                    <span>Phí giao hàng</span>
                    <span className="font-mono text-emerald-300">
                      {order.shippingFeeVnd === 0 ? "Miễn phí" : formatVnd(order.shippingFeeVnd)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-xs font-bold text-[#ff4d5e]">
                    <span>Tổng thanh toán</span>
                    <span>{formatVnd(order.totalVnd)}</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Customer Night Garage Support & Warranty Card */}
        <div className="yokocho-panel chamfer-md relative p-6 lg:col-span-6">
          <span className="pointer-events-none absolute top-0 left-0 h-2.5 w-2.5 border-t border-l border-amber-400/90" />
          <span className="pointer-events-none absolute right-0 bottom-0 h-2.5 w-2.5 border-r border-b border-amber-400/90" />
          <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-amber-400 uppercase">
            <ShieldCheck className="h-4 w-4" />
            <span className="font-jp">夜間保証・取付案内</span>
            <span className="font-mono">{"//"} Hậu Mãi Xưởng Đêm</span>
          </div>
          <h2 className="font-display mt-1.5 text-xl font-bold tracking-tight text-white">
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
