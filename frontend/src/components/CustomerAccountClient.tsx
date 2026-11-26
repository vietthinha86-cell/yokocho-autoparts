"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CarFront,
  CheckCircle2,
  ClipboardList,
  Clock3,
  LogOut,
  MapPin,
  Package,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tag,
  Trash2,
  UserCheck,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatVnd } from "@/lib/api";
import { addProductsToStoredCart } from "@/lib/cartStorage";
import {
  addCustomerGarageVehicle,
  removeCustomerGarageVehicle,
  updateCustomerProfile,
} from "@/lib/customerApi";
import { useCustomerSession } from "@/lib/useCustomerSession";
import type {
  AutoPartProduct,
  BookingStatus,
  GarageBranchId,
  InstallationServiceType,
  OrderRecord,
  VehicleFitment,
} from "@/types/autoparts";

interface CustomerAccountClientProps {
  products: AutoPartProduct[];
  fitments: VehicleFitment[];
}

type AccountTab = "orders" | "bookings" | "garage" | "profile";

const BOOKING_STATUS_META: Record<BookingStatus, { label: string; cls: string }> = {
  pending: {
    label: "Chờ xưởng xác nhận",
    cls: "border-amber-600/70 bg-amber-950/60 text-amber-300",
  },
  confirmed: {
    label: "Đã giữ khoang",
    cls: "border-sky-600/70 bg-sky-950/60 text-sky-300",
  },
  in_bay: {
    label: "Đang lên đèn trong khoang",
    cls: "border-red-500/70 bg-red-950/60 text-red-200",
  },
  completed: {
    label: "Hoàn tất lắp đặt",
    cls: "border-emerald-600/70 bg-emerald-950/60 text-emerald-300",
  },
  cancelled: {
    label: "Đã hủy",
    cls: "border-zinc-700 bg-zinc-900 text-zinc-400",
  },
};

const BRANCH_LABELS: Record<GarageBranchId, string> = {
  hcm_q7: "Xưởng Đêm Quận 7 (TP.HCM)",
  hcm_binhthanh: "Xưởng Bình Thạnh (TP.HCM)",
  hn_caugiay: "Xưởng Cầu Giấy (Hà Nội)",
};

const SERVICE_LABELS: Record<InstallationServiceType, string> = {
  bi_led_retrofit: "Lên Bi-LED Pha Cốt",
  bi_fog_install: "Lắp Bi-Gầm Phá Sương 3000K",
  tail_light_plug: "Đèn Hậu Khói / Còi Plug & Play",
  combo_full_night: "Combo Full Đêm (Pha + Gầm + Hậu)",
  beam_alignment: "Căn Chỉnh Đường Cắt Chống Chói",
};

const ORDER_STATUS_META: Record<
  OrderRecord["status"],
  { label: string; cls: string }
> = {
  pending_confirm: {
    label: "Chờ xác nhận giắc",
    cls: "border-amber-600/70 bg-amber-950/60 text-amber-300",
  },
  packed: {
    label: "Đã test & đóng gói",
    cls: "border-sky-600/70 bg-sky-950/60 text-sky-300",
  },
  shipping: {
    label: "Đang vận chuyển",
    cls: "border-red-500/70 bg-red-950/60 text-red-200",
  },
  completed: {
    label: "Hoàn tất",
    cls: "border-emerald-600/70 bg-emerald-950/60 text-emerald-300",
  },
};

export function CustomerAccountClient({
  products,
  fitments,
}: CustomerAccountClientProps) {
  const router = useRouter();
  const { token, customer, orders, bookings, loading, reloadSession, logout } =
    useCustomerSession();

  const [activeTab, setActiveTab] = useState<AccountTab>("orders");
  const [toast, setToast] = useState<string | null>(null);

  // Add vehicle form state
  const makeOptions = useMemo(
    () => Array.from(new Set(fitments.map((f) => f.make))),
    [fitments],
  );
  const [carMake, setCarMake] = useState(makeOptions[0] ?? "Honda");
  const [carModel, setCarModel] = useState("");
  const [carYear, setCarYear] = useState("2023");
  const [carNickname, setCarNickname] = useState("");
  const [carNote, setCarNote] = useState("");
  const [addingCar, setAddingCar] = useState(false);

  // Profile draft overrides (avoids synchronous setState inside useEffect)
  const [draftName, setDraftName] = useState<string | null>(null);
  const [draftPhone, setDraftPhone] = useState<string | null>(null);
  const [draftEmail, setDraftEmail] = useState<string | null>(null);
  const [draftAddress, setDraftAddress] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  }

  useEffect(() => {
    if (!token && !loading) {
      router.replace("/dang-nhap?next=/tai-khoan");
    }
  }, [loading, router, token]);

  useEffect(() => {
    if (token && !loading && !customer) {
      router.replace("/dang-nhap?next=/tai-khoan");
    }
  }, [customer, loading, router, token]);

  if (!token || loading || !customer) {
    return (
      <div className="kumiko-grid flex min-h-screen items-center justify-center font-mono text-xs text-zinc-300">
        Đang xác thực tài khoản thành viên AKARI YOKOCHO...
      </div>
    );
  }

  const totalSpentVnd = orders.reduce((sum, o) => sum + o.totalVnd, 0);
  const effectiveName = draftName ?? customer.fullName;
  const effectivePhone = draftPhone ?? customer.phone ?? "";
  const effectiveEmail = draftEmail ?? customer.email ?? "";
  const effectiveAddress = draftAddress ?? customer.shippingAddress ?? "";

  function handleReorder(order: OrderRecord) {
    const matched: Array<{
      product: AutoPartProduct;
      quantity: number;
      selectedKelvin?: string;
    }> = [];
    for (const item of order.items) {
      const product = products.find((p) => p.id === item.productId);
      if (product) {
        matched.push({
          product,
          quantity: item.quantity,
          selectedKelvin: item.selectedKelvin,
        });
      }
    }

    if (matched.length === 0) {
      showToast("Các sản phẩm trong đơn này hiện không còn trên kệ.");
      return;
    }

    addProductsToStoredCart(matched);
    showToast(`Đã thêm lại ${matched.length} mặt hàng từ đơn ${order.orderCode} vào Giỏ hàng!`);
  }

  async function handleAddVehicle(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !carMake.trim() || !carModel.trim()) return;
    setAddingCar(true);
    const res = await addCustomerGarageVehicle(token, {
      make: carMake.trim(),
      model: carModel.trim(),
      year: carYear.trim() || "Mọi đời",
      nickname: carNickname.trim() || undefined,
      note: carNote.trim() || undefined,
    });
    setAddingCar(false);
    if (!res.ok) {
      showToast(res.error ?? "Không thêm được xe.");
      return;
    }
    setCarModel("");
    setCarNickname("");
    setCarNote("");
    reloadSession();
    showToast("Đã lưu xe vào Gara cá nhân!");
  }

  async function handleRemoveVehicle(vehicleId: string) {
    if (!token) return;
    const res = await removeCustomerGarageVehicle(token, vehicleId);
    if (!res.ok) {
      showToast(res.error ?? "Không xóa được xe.");
      return;
    }
    reloadSession();
    showToast("Đã xóa xe khỏi Gara.");
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSavingProfile(true);
    const res = await updateCustomerProfile(token, {
      fullName: effectiveName.trim(),
      phone: effectivePhone.trim() || null,
      email: effectiveEmail.trim() || null,
      shippingAddress: effectiveAddress.trim() || null,
      ...(newPassword.trim()
        ? { currentPassword, newPassword: newPassword.trim() }
        : {}),
    });
    setSavingProfile(false);
    if (!res.ok) {
      showToast(res.error ?? "Lưu hồ sơ thất bại.");
      return;
    }
    setDraftName(null);
    setDraftPhone(null);
    setDraftEmail(null);
    setDraftAddress(null);
    setCurrentPassword("");
    setNewPassword("");
    reloadSession();
    showToast("Đã cập nhật hồ sơ thành viên!");
  }

  return (
    <div className="kumiko-grid min-h-screen pb-16">
      <header className="sticky top-0 z-40 border-b border-red-800/50 bg-[#070306]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="chamfer-sm inline-flex items-center gap-1.5 border border-red-900/60 bg-[#14070b] px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:border-red-500"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-amber-300" />
              <span>Về Storefront</span>
            </Link>
            <div>
              <p className="font-mono text-[10px] font-bold tracking-[0.18em] text-[#ff4d5e] uppercase">
                <span className="font-jp">会員ページ</span> {"//"} Member Garage
              </p>
              <h1 className="font-display text-base font-bold text-white sm:text-lg">
                Xin chào, {customer.fullName}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={reloadSession}
              className="chamfer-sm inline-flex cursor-pointer items-center gap-1 border border-red-900/60 bg-[#14070b] px-3 py-1.5 font-semibold text-zinc-200 hover:border-amber-400"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Làm Mới</span>
            </button>
            <button
              type="button"
              onClick={() => {
                logout();
                router.push("/");
              }}
              className="chamfer-sm inline-flex cursor-pointer items-center gap-1 border border-red-700/70 bg-red-950/50 px-3 py-1.5 font-semibold text-red-200 hover:bg-[#e11d2e] hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Đăng Xuất</span>
            </button>
          </div>
        </div>
      </header>

      {toast && (
        <div className="fixed right-5 bottom-5 z-50 border border-amber-400/80 bg-[#16080b]/95 px-4 py-2.5 font-mono text-xs font-bold text-amber-200 shadow-[0_0_24px_rgba(245,158,11,0.35)]">
          {toast}
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 lg:px-8">
        {/* Account Overview Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="yokocho-panel chamfer-sm p-4">
            <p className="font-mono text-[10px] tracking-wider text-zinc-400 uppercase">
              Đơn Hàng Của Bạn
            </p>
            <p className="mt-1.5 font-mono text-2xl font-bold text-white">
              {orders.length}
            </p>
            <p className="mt-1 text-[11px] text-zinc-400">
              Gồm đơn theo tài khoản &amp; SĐT {customer.phone ?? "—"}
            </p>
          </div>

          <div className="yokocho-panel chamfer-sm p-4">
            <p className="font-mono text-[10px] tracking-wider text-zinc-400 uppercase">
              Tổng Chi Tiêu Tích Lũy
            </p>
            <p className="mt-1.5 font-mono text-2xl font-bold text-[#ff4d5e]">
              {formatVnd(totalSpentVnd)}
            </p>
            <p className="mt-1 text-[11px] text-emerald-300">
              Bảo hành điện tử 1 đổi 1 theo SĐT
            </p>
          </div>

          <div className="yokocho-panel chamfer-sm p-4">
            <p className="font-mono text-[10px] tracking-wider text-zinc-400 uppercase">
              Xe Trong Gara Cá Nhân
            </p>
            <p className="mt-1.5 font-mono text-2xl font-bold text-amber-300">
              {customer.garageVehicles.length}
            </p>
            <p className="mt-1 text-[11px] text-zinc-400">
              Tự điền khi đặt hàng &amp; lọc đèn hợp xe
            </p>
          </div>

          <div className="yokocho-panel chamfer-sm p-4">
            <p className="font-mono text-[10px] tracking-wider text-zinc-400 uppercase">
              Địa Chỉ Giao Mặc Định
            </p>
            <p className="mt-1.5 line-clamp-2 text-xs font-semibold text-zinc-100">
              {customer.shippingAddress ?? "Chưa lưu địa chỉ giao hàng"}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-6 flex flex-wrap gap-2 border-b border-red-900/45 pb-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`chamfer-sm inline-flex cursor-pointer items-center gap-1.5 border px-4 py-2 transition ${
              activeTab === "orders"
                ? "border-red-400 bg-[#e11d2e] text-white"
                : "border-red-900/50 bg-[#12070b] text-zinc-300 hover:border-red-500"
            }`}
          >
            <ClipboardList className="h-3.5 w-3.5" />
            <span>Lịch Sử Đơn Hàng ({orders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("bookings")}
            className={`chamfer-sm inline-flex cursor-pointer items-center gap-1.5 border px-4 py-2 transition ${
              activeTab === "bookings"
                ? "border-red-400 bg-[#e11d2e] text-white"
                : "border-red-900/50 bg-[#12070b] text-zinc-300 hover:border-red-500"
            }`}
          >
            <Wrench className="h-3.5 w-3.5" />
            <span>Lịch Lắp Đặt ({bookings.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("garage")}
            className={`chamfer-sm inline-flex cursor-pointer items-center gap-1.5 border px-4 py-2 transition ${
              activeTab === "garage"
                ? "border-red-400 bg-[#e11d2e] text-white"
                : "border-red-900/50 bg-[#12070b] text-zinc-300 hover:border-red-500"
            }`}
          >
            <CarFront className="h-3.5 w-3.5" />
            <span>Gara Xe Của Tôi ({customer.garageVehicles.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`chamfer-sm inline-flex cursor-pointer items-center gap-1.5 border px-4 py-2 transition ${
              activeTab === "profile"
                ? "border-red-400 bg-[#e11d2e] text-white"
                : "border-red-900/50 bg-[#12070b] text-zinc-300 hover:border-red-500"
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>Hồ Sơ &amp; Bảo Mật</span>
          </button>
        </div>

        {/* Tab 1: Order History */}
        {activeTab === "orders" && (
          <div className="mt-6 space-y-4">
            {orders.length === 0 ? (
              <div className="yokocho-panel chamfer-md p-8 text-center text-xs text-zinc-300">
                <Package className="mx-auto mb-3 h-8 w-8 text-[#ff4d5e]" />
                <p className="text-sm font-bold text-white">
                  Bạn chưa có đơn hàng nào được liên kết.
                </p>
                <p className="mt-1 text-zinc-400">
                  Mọi đơn đặt khi đã đăng nhập hoặc đặt bằng SĐT {customer.phone ?? "của bạn"} sẽ tự hiển thị tại đây.
                </p>
                <Link
                  href="/#catalog"
                  className="chamfer-sm mt-4 inline-flex items-center gap-1.5 bg-[#e11d2e] px-4 py-2 font-bold text-white"
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  <span>Khám Phá Kệ Hàng Đêm</span>
                </Link>
              </div>
            ) : (
              orders.map((order) => {
                const statusMeta = ORDER_STATUS_META[order.status];
                return (
                  <div
                    key={order.orderCode}
                    className="yokocho-panel chamfer-md border border-red-900/55 p-5 text-xs"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-red-900/40 pb-3.5">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-sm font-bold text-amber-300">
                            {order.orderCode}
                          </span>
                          <span className={`border px-2 py-0.5 font-mono text-[10px] font-bold ${statusMeta.cls}`}>
                            {statusMeta.label}
                          </span>
                          <span
                            className={`border px-2 py-0.5 font-mono text-[10px] font-bold ${
                              order.paymentStatus === "paid"
                                ? "border-emerald-600/70 bg-emerald-950/60 text-emerald-300"
                                : "border-zinc-700 bg-black/50 text-zinc-300"
                            }`}
                          >
                            {order.paymentStatus === "paid" ? "ĐÃ THANH TOÁN" : "COD / CHỜ CK"}
                          </span>
                        </div>
                        <p className="mt-1.5 text-zinc-300">
                          Xe: <strong className="text-white">{order.vehicleInfo}</strong> • Đặt lúc:{" "}
                          {new Date(order.createdAt).toLocaleString("vi-VN")}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-zinc-400">
                          <MapPin className="h-3 w-3 text-[#ff4d5e]" />
                          <span>{order.shippingAddress}</span>
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-mono text-lg font-bold text-[#ff4d5e]">
                          {formatVnd(order.totalVnd)}
                        </p>
                        {order.voucherCode && (order.discountVnd ?? 0) > 0 && (
                          <p className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-300">
                            <Tag className="h-3 w-3" />
                            <span>
                              {order.voucherCode} (-{formatVnd(order.discountVnd ?? 0)})
                            </span>
                          </p>
                        )}
                        <p className="font-mono text-[10px] text-zinc-400">
                          {order.shippingFeeVnd === 0
                            ? "Miễn phí vận chuyển"
                            : `Gồm phí ship ${formatVnd(order.shippingFeeVnd)}`}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 space-y-1.5">
                      {order.items.map((item, idx) => (
                        <div
                          key={`${order.orderCode}-${item.productId}-${idx}`}
                          className="flex flex-wrap items-center justify-between gap-2 bg-[#090407] px-3 py-2"
                        >
                          <span className="text-zinc-200">
                            <strong className="text-white">{item.nameVi}</strong>{" "}
                            <span className="font-mono text-[11px] text-amber-300">
                              × {item.quantity}
                              {item.selectedKelvin ? ` (${item.selectedKelvin})` : ""}
                            </span>
                          </span>
                          <span className="font-mono text-zinc-200">
                            {formatVnd(item.lineTotalVnd)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                      <Link
                        href={`/?lookup=${encodeURIComponent(order.orderCode)}#order-lookup`}
                        className="chamfer-sm border border-red-900/60 bg-[#14070b] px-3 py-1.5 font-semibold text-zinc-200 hover:border-red-400"
                      >
                        Xem Tiến Độ 4 Bước
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleReorder(order)}
                        className="chamfer-sm inline-flex cursor-pointer items-center gap-1.5 bg-gradient-to-r from-[#c81628] to-[#ff2e43] px-3.5 py-1.5 font-bold text-white shadow-[0_0_16px_rgba(225,29,46,0.4)] hover:brightness-115"
                      >
                        <ShoppingBag className="h-3.5 w-3.5" />
                        <span>Mua Lại Vào Giỏ</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 1.5: Garage Installation Bookings */}
        {activeTab === "bookings" && (
          <div className="mt-6 space-y-4">
            {bookings.length === 0 ? (
              <div className="yokocho-panel chamfer-md p-8 text-center text-xs text-zinc-300">
                <Wrench className="mx-auto mb-3 h-8 w-8 text-amber-300" />
                <p className="text-sm font-bold text-white">
                  Bạn chưa có lịch hẹn lắp đặt nào tại xưởng.
                </p>
                <p className="mt-1 text-zinc-400">
                  Giữ khoang trước để được ưu tiên lắp giắc zin &amp; canh đường cắt Laser không phải chờ đợi.
                </p>
                <Link
                  href="/#booking"
                  className="chamfer-sm mt-4 inline-flex items-center gap-1.5 bg-[#e11d2e] px-4 py-2 font-bold text-white"
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span>Đặt Lịch Lắp Đặt Ngay</span>
                </Link>
              </div>
            ) : (
              bookings.map((bk) => {
                const statusMeta = BOOKING_STATUS_META[bk.status];
                return (
                  <div
                    key={bk.bookingCode}
                    className="yokocho-panel chamfer-md flex flex-wrap items-start justify-between gap-4 border border-red-900/55 p-5 text-xs"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-bold text-amber-300">
                          {bk.bookingCode}
                        </span>
                        <span
                          className={`border px-2 py-0.5 font-mono text-[10px] font-bold ${statusMeta.cls}`}
                        >
                          {statusMeta.label}
                        </span>
                        {bk.orderCode && (
                          <span className="border border-red-800/60 bg-red-950/40 px-2 py-0.5 font-mono text-[10px] text-red-200">
                            Đơn {bk.orderCode}
                          </span>
                        )}
                      </div>
                      <h3 className="font-display text-base font-bold text-white">
                        {SERVICE_LABELS[bk.serviceType]}
                      </h3>
                      <p className="text-zinc-300">
                        Xe: <strong className="text-white">{bk.vehicleInfo}</strong> • Cơ sở:{" "}
                        <span className="text-amber-200">{BRANCH_LABELS[bk.garageBranch]}</span>
                      </p>
                      {bk.note && <p className="text-zinc-400">Ghi chú: {bk.note}</p>}
                    </div>

                    <div className="text-right font-mono">
                      <p className="inline-flex items-center gap-1.5 text-sm font-bold text-[#ff4d5e]">
                        <Clock3 className="h-4 w-4" />
                        <span>{bk.timeSlot}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-300">{bk.bookingDate}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 2: My Garage */}
        {activeTab === "garage" && (
          <div className="mt-6 grid gap-6 lg:grid-cols-12">
            <div className="space-y-3 lg:col-span-7">
              {customer.garageVehicles.length === 0 ? (
                <div className="yokocho-panel chamfer-md p-6 text-xs text-zinc-400">
                  Gara chưa có xe nào. Hãy thêm chiếc xe của bạn ở khung bên cạnh để tự điền khi đặt hàng và lọc đúng chân đèn.
                </div>
              ) : (
                customer.garageVehicles.map((v) => (
                  <div
                    key={v.id}
                    className="yokocho-panel chamfer-md flex flex-wrap items-start justify-between gap-3 border border-red-900/55 p-5 text-xs"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="border border-amber-500/60 bg-amber-950/50 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300">
                          {v.make}
                        </span>
                        <span className="font-mono text-[11px] text-zinc-400">
                          Đời {v.year}
                        </span>
                        {v.nickname && (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[#ff4d5e]">
                            <Sparkles className="h-3 w-3" />
                            {v.nickname}
                          </span>
                        )}
                      </div>
                      <h3 className="font-display mt-1.5 text-base font-bold text-white">
                        {v.make} {v.model}
                      </h3>
                      {v.note && <p className="mt-1 text-zinc-300">{v.note}</p>}
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/?make=${encodeURIComponent(v.make)}#catalog`}
                        className="chamfer-sm border border-amber-500/60 bg-amber-950/40 px-3 py-1.5 font-semibold text-amber-200 hover:border-amber-400"
                      >
                        Tìm Đèn Hợp Xe →
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleRemoveVehicle(v.id)}
                        aria-label={`Xóa xe ${v.make} ${v.model}`}
                        className="chamfer-sm cursor-pointer border border-red-800/70 bg-red-950/60 p-2 text-red-300 hover:bg-red-800/70 hover:text-white"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form
              onSubmit={handleAddVehicle}
              className="yokocho-panel chamfer-md space-y-3.5 border border-red-800/60 p-5 text-xs lg:col-span-5"
            >
              <p className="font-mono text-[11px] font-bold tracking-widest text-[#ff4d5e] uppercase">
                ADD TO GARAGE // Thêm Xe Của Bạn
              </p>

              <div>
                <label className="mb-1 block font-semibold text-zinc-300">
                  Hãng xe *
                </label>
                <select
                  value={carMake}
                  onChange={(e) => setCarMake(e.target.value)}
                  className="w-full border border-red-900/60 bg-[#050204] px-3 py-2 text-white focus:border-red-500 focus:outline-none"
                >
                  {makeOptions.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                  <option value="VinFast">VinFast</option>
                  <option value="Hyundai">Hyundai</option>
                  <option value="Xe Khác">Xe Khác</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="mb-1 block font-semibold text-zinc-300">
                    Dòng xe / Phiên bản *
                  </label>
                  <input
                    required
                    value={carModel}
                    onChange={(e) => setCarModel(e.target.value)}
                    placeholder="VD: Civic RS / Vios G"
                    className="w-full border border-red-900/60 bg-[#050204] px-3 py-2 text-white placeholder:text-zinc-500 focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-zinc-300">
                    Đời xe
                  </label>
                  <input
                    value={carYear}
                    onChange={(e) => setCarYear(e.target.value)}
                    placeholder="2023"
                    className="w-full border border-red-900/60 bg-[#050204] px-3 py-2 font-mono text-white focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-zinc-300">
                  Tên gọi riêng (tùy chọn)
                </label>
                <input
                  value={carNickname}
                  onChange={(e) => setCarNickname(e.target.value)}
                  placeholder="VD: Xế Đêm đi làm"
                  className="w-full border border-red-900/60 bg-[#050204] px-3 py-2 text-white placeholder:text-zinc-500 focus:border-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-zinc-300">
                  Ghi chú chân đèn / cấu hình
                </label>
                <input
                  value={carNote}
                  onChange={(e) => setCarNote(e.target.value)}
                  placeholder="VD: Đang đi bi gầm 3000K, muốn lên thêm Bi-LED"
                  className="w-full border border-red-900/60 bg-[#050204] px-3 py-2 text-white placeholder:text-zinc-500 focus:border-red-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={addingCar}
                className="chamfer-sm inline-flex w-full cursor-pointer items-center justify-center gap-1.5 bg-gradient-to-r from-[#c81628] to-[#ff2e43] py-2.5 font-bold text-white shadow-[0_0_20px_rgba(225,29,46,0.45)] disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{addingCar ? "Đang lưu..." : "Lưu Xe Vào Gara"}</span>
              </button>
            </form>
          </div>
        )}

        {/* Tab 3: Profile & Password */}
        {activeTab === "profile" && (
          <form
            onSubmit={handleSaveProfile}
            className="yokocho-panel chamfer-md mt-6 max-w-2xl space-y-4 border border-red-800/55 p-6 text-xs"
          >
            <div className="flex items-center justify-between border-b border-red-900/45 pb-3">
              <div>
                <p className="font-mono text-[11px] font-bold tracking-widest text-[#ff4d5e] uppercase">
                  PROFILE SETTINGS // Hồ Sơ Giao Hàng &amp; Bảo Mật
                </p>
                <p className="mt-1 text-zinc-400">
                  Thông tin này tự động điền vào Giỏ hàng để đặt đơn chỉ với 1 bấm.
                </p>
              </div>
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block font-semibold text-zinc-300">
                  Họ và tên *
                </label>
                <input
                  required
                  value={effectiveName}
                  onChange={(e) => setDraftName(e.target.value)}
                  className="w-full border border-red-900/60 bg-[#050204] px-3 py-2 text-white focus:border-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-zinc-300">
                  Số điện thoại (Zalo)
                </label>
                <input
                  type="tel"
                  value={effectivePhone}
                  onChange={(e) => setDraftPhone(e.target.value)}
                  className="w-full border border-red-900/60 bg-[#050204] px-3 py-2 font-mono text-white focus:border-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-zinc-300">
                  Email
                </label>
                <input
                  type="email"
                  value={effectiveEmail}
                  onChange={(e) => setDraftEmail(e.target.value)}
                  className="w-full border border-red-900/60 bg-[#050204] px-3 py-2 text-white focus:border-red-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block font-semibold text-zinc-300">
                  Địa chỉ giao hàng mặc định
                </label>
                <input
                  value={effectiveAddress}
                  onChange={(e) => setDraftAddress(e.target.value)}
                  placeholder="Số nhà, đường, quận/huyện, tỉnh/thành..."
                  className="w-full border border-red-900/60 bg-[#050204] px-3 py-2 text-white focus:border-red-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid gap-4 border-t border-red-900/45 pt-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block font-semibold text-zinc-300">
                  Mật khẩu hiện tại (nếu muốn đổi)
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Bỏ trống nếu không đổi"
                  className="w-full border border-red-900/60 bg-[#050204] px-3 py-2 text-white placeholder:text-zinc-500 focus:border-red-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold text-zinc-300">
                  Mật khẩu mới (tối thiểu 6 ký tự)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới"
                  className="w-full border border-red-900/60 bg-[#050204] px-3 py-2 text-white placeholder:text-zinc-500 focus:border-red-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Dữ liệu được mã hóa JWT &amp; bcrypt an toàn</span>
              </span>
              <button
                type="submit"
                disabled={savingProfile}
                className="chamfer-sm inline-flex cursor-pointer items-center gap-1.5 bg-gradient-to-r from-[#c81628] to-[#ff2e43] px-5 py-2.5 font-bold text-white shadow-[0_0_20px_rgba(225,29,46,0.45)] disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{savingProfile ? "Đang lưu..." : "Lưu Thay Đổi Hồ Sơ"}</span>
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
