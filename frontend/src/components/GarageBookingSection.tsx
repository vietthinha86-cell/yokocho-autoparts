"use client";

import {
  CalendarDays,
  CarFront,
  CheckCircle2,
  Clock3,
  MapPin,
  MoonStar,
  Sparkles,
  UserCheck,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fetchBookingSlots, submitInstallationBooking } from "@/lib/api";
import { useCustomerSession } from "@/lib/useCustomerSession";
import type {
  BookingSlotAvailability,
  GarageBranchId,
  InstallationBookingRecord,
  InstallationServiceType,
} from "@/types/autoparts";
import { ScrollRevealStage } from "./ScrollRevealStage";

interface GarageBookingSectionProps {
  prefillOrderCode?: string;
}

export const GARAGE_BRANCH_OPTIONS: Array<{
  id: GarageBranchId;
  name: string;
  address: string;
  highlight: string;
}> = [
  {
    id: "hcm_q7",
    name: "Xưởng Đêm Quận 7",
    address: "88 Nguyễn Thị Thập, Q.7, TP.HCM",
    highlight: "Buồng canh đường cắt Laser 25m",
  },
  {
    id: "hcm_binhthanh",
    name: "Xưởng Bình Thạnh",
    address: "245 Điện Biên Phủ, Bình Thạnh, TP.HCM",
    highlight: "Lắp nhanh Plug & Play 30–60p",
  },
  {
    id: "hn_caugiay",
    name: "Xưởng Cầu Giấy Hà Nội",
    address: "18 Hoàng Quốc Việt, Cầu Giấy, Hà Nội",
    highlight: "Đủ pat CNC & Canbus Nhật–Hàn",
  },
];

export const INSTALLATION_SERVICE_OPTIONS: Array<{
  id: InstallationServiceType;
  label: string;
  duration: string;
  feeNote: string;
}> = [
  {
    id: "bi_led_retrofit",
    label: "Lên Bi-LED Pha Cốt",
    duration: "90 phút",
    feeNote: "Miễn công khi mua tại xưởng",
  },
  {
    id: "bi_fog_install",
    label: "Lắp Bi-Gầm Phá Sương 3000K",
    duration: "45 phút",
    feeNote: "Pat zin chống nước IP68",
  },
  {
    id: "tail_light_plug",
    label: "Đèn Hậu Khói / Còi Plug & Play",
    duration: "30 phút",
    feeNote: "Không cắt dây zin",
  },
  {
    id: "combo_full_night",
    label: "Combo Full Đêm (Pha + Gầm + Hậu)",
    duration: "120 phút",
    feeNote: "Tặng canh tiêu cự Laser",
  },
  {
    id: "beam_alignment",
    label: "Căn Chỉnh Đường Cắt Chống Chói",
    duration: "30 phút",
    feeNote: "Miễn phí cho khách đã mua",
  },
];

function buildNextSevenDays(): Array<{ iso: string; dayLabel: string; shortDate: string }> {
  const weekdayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const list: Array<{ iso: string; dayLabel: string; shortDate: string }> = [];
  const base = new Date();
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    list.push({
      iso: `${yyyy}-${mm}-${dd}`,
      dayLabel: i === 0 ? "Hôm nay" : weekdayNames[d.getDay()],
      shortDate: `${dd}/${mm}`,
    });
  }
  return list;
}

export function GarageBookingSection({ prefillOrderCode }: GarageBookingSectionProps) {
  const { customer, reloadSession } = useCustomerSession();
  const dateOptions = useMemo(() => buildNextSevenDays(), []);

  const [branch, setBranch] = useState<GarageBranchId>("hcm_q7");
  const [serviceType, setServiceType] = useState<InstallationServiceType>("bi_led_retrofit");
  const [bookingDate, setBookingDate] = useState<string>(dateOptions[1]?.iso ?? dateOptions[0].iso);
  const [timeSlot, setTimeSlot] = useState<string>("19:00");
  const [slots, setSlots] = useState<BookingSlotAvailability[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [draftName, setDraftName] = useState<string | null>(null);
  const [draftPhone, setDraftPhone] = useState<string | null>(null);
  const [draftVehicle, setDraftVehicle] = useState<string | null>(null);
  const [draftOrderCode, setDraftOrderCode] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdBooking, setCreatedBooking] = useState<InstallationBookingRecord | null>(null);

  const defaultVehicle = customer?.garageVehicles?.[0]
    ? `${customer.garageVehicles[0].make} ${customer.garageVehicles[0].model} ${customer.garageVehicles[0].year}`.trim()
    : "";
  const effectiveName = draftName ?? customer?.fullName ?? "";
  const effectivePhone = draftPhone ?? customer?.phone ?? "";
  const effectiveVehicle = draftVehicle ?? defaultVehicle;
  const effectiveOrderCode = draftOrderCode ?? prefillOrderCode ?? "";

  useEffect(() => {
    let cancelled = false;
    setLoadingSlots(true);
    fetchBookingSlots(bookingDate, branch).then((res) => {
      if (cancelled) return;
      setSlots(res.slots);
      setLoadingSlots(false);
      const currentAvailable = res.slots.find((s) => s.timeSlot === timeSlot && s.available);
      if (!currentAvailable) {
        const firstOpen = res.slots.find((s) => s.available);
        if (firstOpen) setTimeSlot(firstOpen.timeSlot);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [bookingDate, branch, timeSlot]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await submitInstallationBooking({
      customerName: effectiveName,
      phone: effectivePhone,
      vehicleInfo: effectiveVehicle,
      garageBranch: branch,
      serviceType,
      bookingDate,
      timeSlot,
      orderCode: effectiveOrderCode.trim() || undefined,
      note: note.trim() || undefined,
    });
    setSubmitting(false);

    if (!res.ok || !res.item) {
      setError(res.error ?? "Đặt lịch lắp đặt thất bại.");
      return;
    }

    setCreatedBooking(res.item);
    setNote("");
    // Refresh live slot availability immediately
    const refreshed = await fetchBookingSlots(bookingDate, branch);
    setSlots(refreshed.slots);
    if (customer) {
      reloadSession();
    }
  }

  const activeBranchMeta =
    GARAGE_BRANCH_OPTIONS.find((b) => b.id === branch) ?? GARAGE_BRANCH_OPTIONS[0];

  return (
    <section
      id="booking"
      className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
    >
      <ScrollRevealStage variant="rise">
        <div className="flex flex-col justify-between gap-4 border-b border-red-800/45 pb-6 md:flex-row md:items-end">
          <div>
            <p className="flex items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.2em] text-[#ff4d5e] uppercase">
              <Wrench className="h-3.5 w-3.5" />
              <span>ĐẶT LỊCH KHOANG LẮP ĐẶT · GARAGE BAY RESERVATION</span>
              <span className="font-jp text-zinc-500">夜間ピット予約</span>
            </p>
            <h2 className="font-display mt-1.5 text-2xl leading-[1.2] font-bold tracking-[-0.02em] text-[#f3ede8] sm:text-3xl">
              Giữ Khoang Lên Đèn &amp; Canh Tiêu Cự Laser Tại Xưởng
            </h2>
          </div>
          <p className="max-w-md text-xs leading-relaxed text-zinc-400">
            Mỗi khung giờ chỉ nhận tối đa <strong className="text-amber-300">2 xe/khoang</strong>{" "}
            để kỹ thuật viên đi dây giắc zin tỉ mỉ và có ca <strong className="text-white">19:00 đêm</strong> test đường cắt trực tiếp ngoài trời.
          </p>
        </div>
      </ScrollRevealStage>

      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        {/* Left: Branch, Service & Live Slot Picker */}
        <div className="space-y-6 lg:col-span-7">
          {/* 1. Branch Selector */}
          <ScrollRevealStage variant="rise">
            <div className="yokocho-panel chamfer-md border border-red-900/50 p-5">
              <p className="mb-3 flex items-center gap-2 font-mono text-[11px] font-bold tracking-wider text-amber-300 uppercase">
                <MapPin className="h-3.5 w-3.5 text-[#ff4d5e]" />
                <span>1. Chọn Cơ Sở Xưởng Đêm</span>
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                {GARAGE_BRANCH_OPTIONS.map((b) => {
                  const selected = branch === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBranch(b.id)}
                      className={`chamfer-sm cursor-pointer border p-3.5 text-left transition ${
                        selected
                          ? "border-red-400 bg-gradient-to-b from-red-950/80 to-[#14070b] shadow-[0_0_20px_rgba(225,29,46,0.35)]"
                          : "border-red-900/45 bg-[#0c0508] hover:border-red-600/70"
                      }`}
                    >
                      <p className="font-display text-xs font-bold text-white">{b.name}</p>
                      <p className="mt-1 text-[11px] leading-snug text-zinc-400">{b.address}</p>
                      <p className="mt-2 font-mono text-[10px] text-amber-300">{b.highlight}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </ScrollRevealStage>

          {/* 2. Service Type */}
          <ScrollRevealStage variant="prism" delayMs={80}>
            <div className="yokocho-panel chamfer-md border border-red-900/50 p-5">
              <p className="mb-3 flex items-center gap-2 font-mono text-[11px] font-bold tracking-wider text-amber-300 uppercase">
                <Sparkles className="h-3.5 w-3.5 text-[#ff4d5e]" />
                <span>2. Chọn Hạng Mục Thi Công</span>
              </p>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {INSTALLATION_SERVICE_OPTIONS.map((svc) => {
                  const selected = serviceType === svc.id;
                  return (
                    <button
                      key={svc.id}
                      type="button"
                      onClick={() => setServiceType(svc.id)}
                      className={`chamfer-sm flex cursor-pointer items-start justify-between gap-2 border p-3 text-left transition ${
                        selected
                          ? "border-amber-400/80 bg-amber-950/35 text-white"
                          : "border-red-900/45 bg-[#0c0508] text-zinc-300 hover:border-red-500/70"
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold text-white">{svc.label}</p>
                        <p className="mt-0.5 text-[11px] text-zinc-400">{svc.feeNote}</p>
                      </div>
                      <span className="shrink-0 border border-red-900/60 bg-black/60 px-2 py-0.5 font-mono text-[10px] text-amber-300">
                        {svc.duration}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </ScrollRevealStage>

          {/* 3. Date & Real-Time Bay Slots */}
          <ScrollRevealStage variant="rise" delayMs={150}>
            <div className="yokocho-panel chamfer-md border border-red-900/50 p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-2 font-mono text-[11px] font-bold tracking-wider text-amber-300 uppercase">
                  <CalendarDays className="h-3.5 w-3.5 text-[#ff4d5e]" />
                  <span>3. Chọn Ngày &amp; Khung Giờ Khoang Trống</span>
                </p>
                {loadingSlots && (
                  <span className="font-mono text-[10px] text-zinc-400">Đang kiểm tra khoang...</span>
                )}
              </div>

              <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                {dateOptions.map((d) => {
                  const active = bookingDate === d.iso;
                  return (
                    <button
                      key={d.iso}
                      type="button"
                      onClick={() => setBookingDate(d.iso)}
                      className={`chamfer-sm cursor-pointer border px-2 py-2 text-center transition ${
                        active
                          ? "border-red-400 bg-[#e11d2e] text-white shadow-[0_0_16px_rgba(225,29,46,0.45)]"
                          : "border-red-900/50 bg-[#0b0407] text-zinc-300 hover:border-red-500"
                      }`}
                    >
                      <span className="block text-[10px] font-semibold opacity-85">{d.dayLabel}</span>
                      <span className="mt-0.5 block font-mono text-xs font-bold">{d.shortDate}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-5">
                {slots.map((slot) => {
                  const isNight = slot.timeSlot === "19:00";
                  const selected = timeSlot === slot.timeSlot && slot.available;
                  return (
                    <button
                      key={slot.timeSlot}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => setTimeSlot(slot.timeSlot)}
                      className={`chamfer-sm cursor-pointer border p-2.5 text-center transition disabled:cursor-not-allowed disabled:opacity-40 ${
                        selected
                          ? "border-amber-400 bg-amber-950/45 text-white shadow-[0_0_18px_rgba(245,158,11,0.3)]"
                          : slot.available
                            ? "border-red-900/50 bg-[#0c0508] text-zinc-200 hover:border-amber-400/70"
                            : "border-zinc-800 bg-black/60 text-zinc-500"
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1 font-mono text-sm font-bold">
                        {isNight ? (
                          <MoonStar className="h-3.5 w-3.5 text-amber-300" />
                        ) : (
                          <Clock3 className="h-3.5 w-3.5 text-[#ff4d5e]" />
                        )}
                        <span>{slot.timeSlot}</span>
                      </div>
                      <p
                        className={`mt-1 font-mono text-[10px] ${
                          slot.available ? "text-emerald-300" : "text-red-400"
                        }`}
                      >
                        {slot.available
                          ? isNight
                            ? `Còn ${slot.remainingBays} · Test Đêm`
                            : `Còn ${slot.remainingBays} khoang`
                          : "Kín khoang"}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </ScrollRevealStage>
        </div>

        {/* Right: Booking Reservation Form */}
        <ScrollRevealStage variant="iris" className="lg:col-span-5">
          <div className="yokocho-panel chamfer-md h-full border border-red-800/60 p-6">
            {createdBooking ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-300">
                  <CheckCircle2 className="h-5 w-5" />
                  <h3 className="font-display text-lg font-bold text-white">
                    Đã Giữ Khoang Lắp Đặt!
                  </h3>
                </div>
                <p className="text-xs leading-relaxed text-zinc-300">
                  Mã lịch hẹn của bạn là{" "}
                  <span className="border border-amber-500/60 bg-black/75 px-2 py-0.5 font-mono font-bold text-amber-300">
                    {createdBooking.bookingCode}
                  </span>
                  . Kỹ thuật viên trưởng sẽ nhắn Zalo xác nhận giắc cắm trước giờ hẹn 2 tiếng.
                </p>

                <div className="space-y-2 border border-red-900/50 bg-[#090407] p-4 text-xs">
                  <div className="flex justify-between gap-2">
                    <span className="text-zinc-400">Cơ sở</span>
                    <span className="font-semibold text-white">{activeBranchMeta.name}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-zinc-400">Thời gian</span>
                    <span className="font-mono font-bold text-amber-300">
                      {createdBooking.timeSlot} · {createdBooking.bookingDate}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-zinc-400">Dòng xe</span>
                    <span className="font-semibold text-white">{createdBooking.vehicleInfo}</span>
                  </div>
                  {createdBooking.orderCode && (
                    <div className="flex justify-between gap-2">
                      <span className="text-zinc-400">Đơn hàng kèm</span>
                      <span className="font-mono text-[#ff4d5e]">{createdBooking.orderCode}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {customer && (
                    <Link
                      href="/tai-khoan"
                      className="chamfer-sm inline-flex flex-1 items-center justify-center border border-amber-500/70 bg-amber-950/35 px-4 py-2.5 text-xs font-bold text-amber-200 hover:bg-amber-950/60"
                    >
                      Xem Trong Tài Khoản →
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => setCreatedBooking(null)}
                    className="chamfer-sm flex-1 cursor-pointer bg-[#e11d2e] px-4 py-2.5 text-xs font-bold text-white"
                  >
                    Đặt Thêm Lịch Khác
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
                <div className="border-b border-red-900/45 pb-3">
                  <p className="font-mono text-[11px] font-bold tracking-widest text-[#ff4d5e] uppercase">
                    RESERVATION TICKET // Phiếu Giữ Khoang
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-amber-300">
                    {activeBranchMeta.name} • {timeSlot} ngày {bookingDate}
                  </p>
                </div>

                {customer && (
                  <div className="border border-emerald-700/60 bg-emerald-950/30 p-2.5 text-[11px] text-emerald-200">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <UserCheck className="h-3.5 w-3.5 text-emerald-300" />
                      <span>Tự điền theo thành viên {customer.fullName}</span>
                    </div>
                    {customer.garageVehicles.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {customer.garageVehicles.map((v) => {
                          const label = `${v.make} ${v.model} ${v.year}`.trim();
                          return (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => setDraftVehicle(label)}
                              className={`inline-flex cursor-pointer items-center gap-1 border px-2 py-0.5 font-mono text-[10px] ${
                                effectiveVehicle === label
                                  ? "border-amber-400 bg-amber-500/20 text-amber-200"
                                  : "border-emerald-800/60 bg-black/50 text-zinc-300 hover:border-amber-400"
                              }`}
                            >
                              <CarFront className="h-3 w-3" />
                              <span>{label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block font-semibold text-zinc-300">
                      Họ tên chủ xe *
                    </label>
                    <input
                      required
                      value={effectiveName}
                      onChange={(e) => setDraftName(e.target.value)}
                      placeholder="VD: Minh Quân"
                      className="w-full border border-red-900/60 bg-[#0b0407] px-3 py-2 text-white placeholder:text-zinc-500 focus:border-[#ff2e43] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-semibold text-zinc-300">
                      Số điện thoại (Zalo) *
                    </label>
                    <input
                      required
                      type="tel"
                      value={effectivePhone}
                      onChange={(e) => setDraftPhone(e.target.value)}
                      placeholder="0909..."
                      className="w-full border border-red-900/60 bg-[#0b0407] px-3 py-2 font-mono text-white placeholder:text-zinc-500 focus:border-[#ff2e43] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-zinc-300">
                    Dòng xe &amp; đời xe *
                  </label>
                  <input
                    required
                    value={effectiveVehicle}
                    onChange={(e) => setDraftVehicle(e.target.value)}
                    placeholder="VD: Honda Civic RS 2023 / Ford Ranger 2024"
                    className="w-full border border-red-900/60 bg-[#0b0407] px-3 py-2 text-white placeholder:text-zinc-500 focus:border-[#ff2e43] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-zinc-300">
                    Mã đơn hàng đã đặt (nếu có — để được miễn công lắp)
                  </label>
                  <input
                    value={effectiveOrderCode}
                    onChange={(e) => setDraftOrderCode(e.target.value)}
                    placeholder="VD: YKC-DEMO-01 (tùy chọn)"
                    className="w-full border border-red-900/60 bg-[#0b0407] px-3 py-2 font-mono text-amber-200 uppercase placeholder:text-zinc-500 focus:border-[#ff2e43] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-zinc-300">
                    Yêu cầu thêm cho kỹ thuật viên
                  </label>
                  <textarea
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="VD: Muốn test thử 4300K và 6000K trước khi chốt, giữ nguyên giắc zin..."
                    className="w-full border border-red-900/60 bg-[#0b0407] px-3 py-2 text-white placeholder:text-zinc-500 focus:border-[#ff2e43] focus:outline-none"
                  />
                </div>

                {error && (
                  <p className="border border-red-700/70 bg-red-950/70 px-3 py-2 text-xs text-red-200">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="chamfer-sm w-full cursor-pointer bg-gradient-to-r from-[#b91c1c] to-[#ff2e43] py-3 text-xs font-bold tracking-wide text-white uppercase shadow-[0_0_24px_rgba(225,29,46,0.5)] transition hover:brightness-115 disabled:opacity-50"
                >
                  {submitting
                    ? "Đang Giữ Khoang Lắp Đặt..."
                    : `Xác Nhận Giữ Khoang ${timeSlot} (${bookingDate.slice(5)})`}
                </button>
              </form>
            )}
          </div>
        </ScrollRevealStage>
      </div>
    </section>
  );
}
