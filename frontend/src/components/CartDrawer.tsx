"use client";

import Image from "next/image";
import {
  ArrowDownRight,
  Check,
  CheckCircle2,
  Copy,
  Minus,
  Plus,
  QrCode,
  ShoppingBag,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import QRCode from "qrcode";
import { useMemo, useState } from "react";
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
  onJumpToLookup?: (orderCode: string) => void;
}

const BANK_INFO = {
  bankCode: "MBBANK",
  bankName: "MB Bank (Quân Đội)",
  accountNumber: "0901889900",
  accountHolder: "AKARI YOKOCHO GARAGE",
};

const FREE_SHIP_THRESHOLD = 3_000_000;
const SHIPPING_FEE = 45_000;

function tlv(tag: string, value: string): string {
  return `${tag}${String(value.length).padStart(2, "0")}${value}`;
}

function crc16Ccitt(input: string): string {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i += 1) {
    crc ^= input.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function buildVietQrPayload(accountNumber: string, amountVnd: number, memo: string): string {
  const beneficiary = tlv("00", "970422") + tlv("01", accountNumber);
  const merchantInfo = tlv("00", "A000000727") + tlv("01", beneficiary) + tlv("02", "QRIBFTTA");
  const extraData = tlv("08", memo);
  const body =
    tlv("00", "01") +
    tlv("01", "12") +
    tlv("38", merchantInfo) +
    tlv("53", "704") +
    tlv("54", String(Math.round(amountVnd))) +
    tlv("58", "VN") +
    tlv("62", extraData) +
    "6304";
  return body + crc16Ccitt(body);
}

export function CartDrawer({
  open,
  items,
  onClose,
  onUpdateQty,
  onRemove,
  onClearCart,
  onOrderCreated,
  onJumpToLookup,
}: CartDrawerProps) {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleInfo, setVehicleInfo] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successOrder, setSuccessOrder] = useState<OrderRecord | null>(null);
  const [copiedField, setCopiedField] = useState<"account" | "memo" | null>(null);

  const qrSvg = useMemo(() => {
    if (!successOrder) return null;
    const payload = buildVietQrPayload(
      BANK_INFO.accountNumber,
      successOrder.totalVnd,
      successOrder.orderCode,
    );
    const symbol = QRCode.create(payload, { errorCorrectionLevel: "M" });
    const size = symbol.modules.size;
    let pathData = "";
    for (let r = 0; r < size; r += 1) {
      for (let c = 0; c < size; c += 1) {
        if (symbol.modules.get(r, c)) {
          pathData += `M${c} ${r}h1v1h-1z`;
        }
      }
    }
    return { size, pathData };
  }, [successOrder]);

  function copyValue(field: "account" | "memo", value: string) {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    void navigator.clipboard.writeText(value);
    setCopiedField(field);
    window.setTimeout(() => setCopiedField(null), 1800);
  }

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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-md flex-col border-l border-red-700/60 bg-[#090407] shadow-[-20px_0_60px_rgba(225,29,46,0.34)]">
        <div className="flex items-center justify-between border-b border-red-900/45 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="h-5 w-5 text-[#ff4d5e]" />
            <div>
              <h2 className="font-display text-base font-bold tracking-wide text-white">
                Giỏ Hàng Đêm <span className="font-jp text-xs text-red-400">{"//"} 買物籠</span>
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
            className="chamfer-sm cursor-pointer border border-red-800/60 p-1.5 text-zinc-300 hover:border-red-500 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {successOrder ? (
            <div className="chamfer-md border border-emerald-600/60 bg-emerald-950/25 p-5">
              <div className="flex items-center gap-2 text-emerald-300">
                <CheckCircle2 className="h-5 w-5" />
                <h3 className="font-display text-base font-bold">Đặt Hàng Thành Công!</h3>
              </div>
              <p className="mt-2 text-xs text-zinc-200">
                Mã đơn của bạn là{" "}
                <span className="border border-amber-500/40 bg-black/70 px-2 py-0.5 font-mono font-bold text-amber-300">
                  {successOrder.orderCode}
                </span>
                . Kỹ thuật viên sẽ gọi xác nhận giắc cắm đúng đời xe trước khi xuất kho.
              </p>

              {/* VietQR Bank Transfer Box */}
              <div className="mt-4 border border-red-800/50 bg-[#0b0407] p-3.5">
                <div className="mb-2.5 flex items-center justify-between text-[11px] font-bold tracking-wider text-amber-300 uppercase">
                  <span className="inline-flex items-center gap-1.5">
                    <QrCode className="h-3.5 w-3.5 text-[#ff4d5e]" />
                    VietQR Thanh Toán Nhanh (Hoặc COD)
                  </span>
                  <span className="font-mono text-zinc-400">{BANK_INFO.bankCode}</span>
                </div>

                {qrSvg && (
                  <div className="mx-auto w-fit border-2 border-red-500/70 bg-white p-2.5 shadow-[0_0_24px_rgba(225,29,46,0.35)]">
                    <svg
                      viewBox={`0 0 ${qrSvg.size} ${qrSvg.size}`}
                      className="h-40 w-40"
                      role="img"
                      aria-label={`Mã VietQR thanh toán đơn ${successOrder.orderCode}`}
                    >
                      <rect width={qrSvg.size} height={qrSvg.size} fill="#ffffff" />
                      <path d={qrSvg.pathData} fill="#0c0407" />
                    </svg>
                  </div>
                )}

                <div className="mt-3 space-y-2 border-t border-red-900/40 pt-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-zinc-400">Ngân hàng</span>
                    <span className="font-semibold text-zinc-100">{BANK_INFO.bankName}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-zinc-400">Chủ TK</span>
                    <span className="font-mono text-zinc-100">{BANK_INFO.accountHolder}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-zinc-400">Số TK</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-white">
                        {BANK_INFO.accountNumber}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyValue("account", BANK_INFO.accountNumber)}
                        className="cursor-pointer border border-red-800/60 bg-black/70 px-1.5 py-0.5 font-mono text-[10px] text-amber-300 hover:border-amber-400"
                      >
                        {copiedField === "account" ? (
                          <Check className="inline h-3 w-3 text-emerald-300" />
                        ) : (
                          <Copy className="inline h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-zinc-400">Nội dung CK</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-amber-300">
                        {successOrder.orderCode}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyValue("memo", successOrder.orderCode)}
                        className="cursor-pointer border border-red-800/60 bg-black/70 px-1.5 py-0.5 font-mono text-[10px] text-amber-300 hover:border-amber-400"
                      >
                        {copiedField === "memo" ? (
                          <Check className="inline h-3 w-3 text-emerald-300" />
                        ) : (
                          <Copy className="inline h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-1 border-t border-emerald-800/40 pt-3 text-xs text-zinc-200">
                <p>Khách hàng: {successOrder.customerName}</p>
                <p>Xe: {successOrder.vehicleInfo}</p>
                <p className="font-mono font-bold text-[#ff4d5e]">
                  Tổng thanh toán: {formatVnd(successOrder.totalVnd)}
                </p>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                {onJumpToLookup && (
                  <button
                    type="button"
                    onClick={() => {
                      const code = successOrder.orderCode;
                      setSuccessOrder(null);
                      onClose();
                      onJumpToLookup(code);
                    }}
                    className="chamfer-sm inline-flex w-full cursor-pointer items-center justify-center gap-1.5 border border-amber-400/70 bg-amber-950/35 py-2.5 text-xs font-bold text-amber-300 transition hover:bg-amber-950/60"
                  >
                    <span>Theo Dõi Tiến Độ Đơn Này</span>
                    <ArrowDownRight className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSuccessOrder(null);
                    onClose();
                  }}
                  className="chamfer-sm w-full cursor-pointer bg-[#e11d2e] py-2.5 text-xs font-bold text-white"
                >
                  Tiếp Tục Xem Phụ Tùng
                </button>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="chamfer-md flex h-56 flex-col items-center justify-center border border-dashed border-red-800/50 text-center">
              <ShoppingBag className="h-8 w-8 text-red-900" />
              <p className="mt-3 text-sm font-medium text-zinc-200">Giỏ hàng đang trống</p>
              <p className="mt-1 text-xs text-zinc-500">
                Hãy chọn bộ đèn Bi-LED hoặc phụ tùng JDM từ kệ hàng đêm.
              </p>
            </div>
          ) : (
            <>
              {/* Free ship progress */}
              <div className="mb-4 border border-red-900/45 bg-[#11070b] p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-zinc-200">
                    <Truck className="h-3.5 w-3.5 text-amber-400" />
                    {subtotal >= FREE_SHIP_THRESHOLD
                      ? "Đã đạt Freeship Toàn Quốc!"
                      : `Thêm ${formatVnd(FREE_SHIP_THRESHOLD - subtotal)} để Freeship`}
                  </span>
                  <span className="font-mono text-amber-300">{freeShipProgress}%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden bg-zinc-900">
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
                    className="flex gap-3 border border-red-900/40 bg-[#11070b] p-3"
                  >
                    <Image
                      src={item.product.image}
                      alt={item.product.nameVi}
                      width={64}
                      height={64}
                      className="photo-razor h-16 w-16 border border-red-800/45 object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-[#f3ede8]">
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
                            className="cursor-pointer border border-red-900/60 p-1 text-zinc-200 hover:border-red-500 hover:text-white"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-5 text-center font-mono text-xs">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateQty(item.product.id, item.selectedKelvin, 1)
                            }
                            className="cursor-pointer border border-red-900/60 p-1 text-zinc-200 hover:border-red-500 hover:text-white"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onRemove(item.product.id, item.selectedKelvin)}
                            className="ml-1 cursor-pointer text-zinc-500 hover:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleCheckout} className="mt-6 space-y-3 border-t border-red-900/45 pt-5">
                <p className="font-mono text-xs font-bold tracking-wider text-[#ff4d5e] uppercase">
                  Thông Tin Giao Hàng &amp; Xác Nhận Chân Giắc
                </p>

                <input
                  required
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Họ và tên người nhận *"
                  className="w-full border border-red-900/55 bg-[#14090e] px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:border-[#ff2e43] focus:outline-none"
                />
                <input
                  required
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Số điện thoại (Zalo) *"
                  className="w-full border border-red-900/55 bg-[#14090e] px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:border-[#ff2e43] focus:outline-none"
                />
                <input
                  type="text"
                  value={vehicleInfo}
                  onChange={(e) => setVehicleInfo(e.target.value)}
                  placeholder="Dòng xe & đời xe (VD: Honda Civic 2022)"
                  className="w-full border border-red-900/55 bg-[#14090e] px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:border-[#ff2e43] focus:outline-none"
                />
                <input
                  required
                  type="text"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Địa chỉ nhận hàng *"
                  className="w-full border border-red-900/55 bg-[#14090e] px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:border-[#ff2e43] focus:outline-none"
                />
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ghi chú lắp đặt / chân bóng..."
                  className="w-full border border-red-900/55 bg-[#14090e] px-3.5 py-2 text-xs text-white placeholder:text-zinc-500 focus:border-[#ff2e43] focus:outline-none"
                />

                {error && (
                  <p className="border border-red-700/70 bg-red-950/70 px-3 py-2 text-xs text-red-200">
                    {error}
                  </p>
                )}

                <div className="space-y-1.5 border border-red-900/40 bg-[#11070b] p-3 text-xs">
                  <div className="flex justify-between text-zinc-300">
                    <span>Tạm tính</span>
                    <span className="font-mono">{formatVnd(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-300">
                    <span>Phí vận chuyển</span>
                    <span className="font-mono">
                      {shippingFee === 0 ? "Miễn phí" : formatVnd(shippingFee)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-red-900/35 pt-2 text-sm font-bold text-white">
                    <span>Tổng cộng</span>
                    <span className="font-mono text-[#ff4d5e]">{formatVnd(total)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="chamfer-sm w-full cursor-pointer bg-gradient-to-r from-[#b91c1c] to-[#ff2e43] py-3 text-sm font-bold text-white shadow-[0_0_26px_rgba(225,29,46,0.5)] transition hover:brightness-115 disabled:opacity-60"
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
