"use client";

import Image from "next/image";
import { CheckCircle2, Minus, Plus, ShoppingBag, Trash2, Truck, X } from "lucide-react";
import { useState } from "react";
import { formatVnd, submitOrder } from "@/lib/api";
import type { CartItem, OrderRecord } from "@/types/autoparts";

interface CartDrawerProps {
  open: boolean;
  items: CartItem[];
  onClose: () => void;
  onUpdateQty: (productId: string, selectedKelvin: string, delta: number) => void;
  onRemove: (productId: string, selectedKelvin: string) => void;
  onClearCart: () => void;
  onOrderCreated: (order: OrderRecord) => void;
}

const FREE_SHIP_THRESHOLD = 3_000_000;
const SHIPPING_FEE = 45_000;

export function CartDrawer({
  open,
  items,
  onClose,
  onUpdateQty,
  onRemove,
  onClearCart,
  onOrderCreated,
}: CartDrawerProps) {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleInfo, setVehicleInfo] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successOrder, setSuccessOrder] = useState<OrderRecord | null>(null);

  if (!open) {
    return null;
  }

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.priceVnd * item.quantity,
    0,
  );
  const shippingFee = subtotal === 0 || subtotal >= FREE_SHIP_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = subtotal + shippingFee;
  const freeShipProgress = Math.min(100, Math.round((subtotal / FREE_SHIP_THRESHOLD) * 100));

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await submitOrder({
      customerName,
      phone,
      vehicleInfo,
      shippingAddress,
      note: note || undefined,
      items: items.map((i) => ({
        productId: i.product.id,
        quantity: i.quantity,
        selectedKelvin: i.selectedKelvin,
      })),
    });
    setSubmitting(false);

    if (!result.ok || !result.order) {
      setError(result.error ?? "Đặt hàng thất bại.");
      return;
    }

    setSuccessOrder(result.order);
    onOrderCreated(result.order);
    onClearCart();
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-md flex-col border-l border-red-900/50 bg-[#0a0508] shadow-[-20px_0_60px_rgba(225,29,46,0.28)]">
        <div className="flex items-center justify-between border-b border-red-900/35 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="h-5 w-5 text-red-400" />
            <div>
              <h2 className="font-[family-name:var(--font-serif-jp)] text-base font-bold text-white">
                Giỏ Hàng Đêm // 買物籠
              </h2>
              <p className="text-[11px] text-zinc-400">
                Miễn phí vận chuyển cho đơn từ {formatVnd(FREE_SHIP_THRESHOLD)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setSuccessOrder(null);
              onClose();
            }}
            aria-label="Đóng giỏ hàng"
            className="rounded-lg border border-red-900/50 p-1.5 text-zinc-400 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {successOrder ? (
            <div className="rounded-2xl border border-emerald-700/50 bg-emerald-950/25 p-5">
              <div className="flex items-center gap-2 text-emerald-300">
                <CheckCircle2 className="h-5 w-5" />
                <h3 className="font-bold">Đặt Hàng Thành Công!</h3>
              </div>
              <p className="mt-2 text-xs text-zinc-300">
                Mã đơn của bạn là{" "}
                <span className="rounded bg-black/60 px-2 py-0.5 font-mono font-bold text-amber-300">
                  {successOrder.orderCode}
                </span>
                . Kỹ thuật viên sẽ gọi xác nhận giắc cắm đúng đời xe trước khi xuất kho.
              </p>
              <div className="mt-4 space-y-1 border-t border-emerald-800/40 pt-3 text-xs text-zinc-300">
                <p>Khách hàng: {successOrder.customerName}</p>
                <p>Xe: {successOrder.vehicleInfo}</p>
                <p>Tổng thanh toán: {formatVnd(successOrder.totalVnd)}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSuccessOrder(null);
                  onClose();
                }}
                className="mt-5 w-full rounded-lg bg-[#e11d2e] py-2.5 text-xs font-bold text-white cursor-pointer"
              >
                Tiếp Tục Xem Phụ Tùng
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-red-900/40 text-center">
              <ShoppingBag className="h-8 w-8 text-red-900" />
              <p className="mt-3 text-sm font-medium text-zinc-300">Giỏ hàng đang trống</p>
              <p className="mt-1 text-xs text-zinc-500">
                Hãy chọn bộ đèn Bi-LED hoặc phụ tùng JDM từ kệ hàng đêm.
              </p>
            </div>
          ) : (
            <>
              {/* Free ship progress */}
              <div className="mb-4 rounded-xl border border-red-900/35 bg-[#12090d] p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-zinc-300">
                    <Truck className="h-3.5 w-3.5 text-amber-400" />
                    {subtotal >= FREE_SHIP_THRESHOLD
                      ? "Đã đạt Freeship Toàn Quốc!"
                      : `Thêm ${formatVnd(FREE_SHIP_THRESHOLD - subtotal)} để Freeship`}
                  </span>
                  <span className="font-mono text-amber-300">{freeShipProgress}%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-900">
                  <div
                    className="h-full bg-gradient-to-r from-[#e11d2e] to-amber-400 transition-all duration-300"
                    style={{ width: `${freeShipProgress}%` }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={`${item.product.id}-${item.selectedKelvin}`}
                    className="flex gap-3 rounded-xl border border-red-900/30 bg-[#12090d] p-3"
                  >
                    <Image
                      src={item.product.image}
                      alt={item.product.nameVi}
                      width={64}
                      height={64}
                      className="h-16 w-16 rounded-lg object-cover border border-red-900/30"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs font-bold text-[#ede6e1]">
                        {item.product.nameVi}
                      </p>
                      <p className="mt-0.5 font-mono text-[11px] text-amber-300">
                        Nhiệt màu / Spec: {item.selectedKelvin}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-[#ff4d5e]">
                          {formatVnd(item.product.priceVnd * item.quantity)}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateQty(item.product.id, item.selectedKelvin, -1)
                            }
                            className="rounded border border-red-900/50 p-1 text-zinc-300 hover:text-white cursor-pointer"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-5 text-center font-mono text-xs">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateQty(item.product.id, item.selectedKelvin, 1)
                            }
                            className="rounded border border-red-900/50 p-1 text-zinc-300 hover:text-white cursor-pointer"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onRemove(item.product.id, item.selectedKelvin)}
                            className="ml-1 text-zinc-500 hover:text-red-400 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleCheckout} className="mt-6 space-y-3 border-t border-red-900/35 pt-5">
                <p className="font-mono text-xs tracking-wider text-red-400 uppercase">
                  Thông Tin Giao Hàng &amp; Xác Nhận Chân Giắc
                </p>

                <input
                  required
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Họ và tên người nhận *"
                  className="w-full rounded-lg border border-red-900/45 bg-[#150b10] px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:border-red-500 focus:outline-none"
                />
                <input
                  required
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Số điện thoại (Zalo) *"
                  className="w-full rounded-lg border border-red-900/45 bg-[#150b10] px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:border-red-500 focus:outline-none"
                />
                <input
                  type="text"
                  value={vehicleInfo}
                  onChange={(e) => setVehicleInfo(e.target.value)}
                  placeholder="Dòng xe & đời xe (VD: Honda Civic 2022)"
                  className="w-full rounded-lg border border-red-900/45 bg-[#150b10] px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:border-red-500 focus:outline-none"
                />
                <input
                  required
                  type="text"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Địa chỉ nhận hàng *"
                  className="w-full rounded-lg border border-red-900/45 bg-[#150b10] px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:border-red-500 focus:outline-none"
                />
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ghi chú lắp đặt / chân bóng..."
                  className="w-full rounded-lg border border-red-900/45 bg-[#150b10] px-3.5 py-2 text-xs text-white placeholder:text-zinc-500 focus:border-red-500 focus:outline-none"
                />

                {error && (
                  <p className="rounded-lg border border-red-700/60 bg-red-950/60 px-3 py-2 text-xs text-red-200">
                    {error}
                  </p>
                )}

                <div className="space-y-1.5 rounded-xl border border-red-900/30 bg-[#12090d] p-3 text-xs">
                  <div className="flex justify-between text-zinc-400">
                    <span>Tạm tính</span>
                    <span className="font-mono">{formatVnd(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Phí vận chuyển</span>
                    <span className="font-mono">
                      {shippingFee === 0 ? "Miễn phí" : formatVnd(shippingFee)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-red-900/30 pt-2 text-sm font-bold text-white">
                    <span>Tổng cộng</span>
                    <span className="font-mono text-[#ff4d5e]">{formatVnd(total)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-lg bg-gradient-to-r from-[#b91c1c] to-[#e11d2e] py-3 text-sm font-bold text-white shadow-[0_0_24px_rgba(225,29,46,0.45)] transition hover:brightness-110 disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? "Đang Gửi Đơn..." : "Xác Nhận Đặt Hàng (COD / CK)"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
