"use client";

import { Bot, ShoppingBag, Sparkles, User, UserCheck, Wifi, WifiOff } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useCustomerSession } from "@/lib/useCustomerSession";
import { ChochinLantern } from "./ChochinLantern";

interface NavbarProps {
  cartCount: number;
  apiConnected: boolean;
  onOpenCart: () => void;
  onOpenAi?: () => void;
}

export function Navbar({ cartCount, apiConnected, onOpenCart, onOpenAi }: NavbarProps) {
  const { customer } = useCustomerSession();
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let rafId = 0;
    const updateProgress = () => {
      rafId = 0;
      const bar = progressBarRef.current;
      if (!bar) return;
      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      const ratio = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      bar.style.transform = `scaleX(${ratio.toFixed(4)})`;
    };

    const onScroll = () => {
      if (!rafId) {
        rafId = window.requestAnimationFrame(updateProgress);
      }
    };

    updateProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-red-800/45 bg-[#060305]/88 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <a href="#top" className="group flex items-center gap-3">
          <ChochinLantern kanji="灯" size="sm" sway={false} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-base font-bold tracking-[0.14em] text-[#f3ede8] transition-colors group-hover:text-[#ff4d5e] sm:text-lg">
                AKARI YOKOCHO
              </span>
              <span className="font-jp hidden border border-red-700/60 bg-red-950/70 px-1.5 py-0.5 text-[10px] font-bold text-red-300 sm:inline-block">
                赤灯
              </span>
            </div>
            <p className="font-sans text-[11px] font-medium tracking-[0.06em] text-zinc-400">
              Quang học &amp; Phụ tùng ô tô JDM
            </p>
          </div>
        </a>

        <nav className="hidden items-center gap-6 text-[13px] font-medium text-zinc-200 md:flex">
          <a href="#fitment" className="transition-colors hover:text-[#ff4d5e]">
            Tra Cứu Xe
          </a>
          <a href="#catalog" className="transition-colors hover:text-[#ff4d5e]">
            Kệ Hàng Đêm
          </a>
          <a href="#simulator" className="flex items-center gap-1.5 transition-colors hover:text-amber-300">
            <Sparkles className="h-3.5 w-3.5 text-[#ff2e43]" />
            Thử Ánh Sáng
          </a>
          <a href="#reviews" className="transition-colors hover:text-[#ff4d5e]">
            Đánh Giá Xe
          </a>
          <a href="#booking" className="transition-colors hover:text-amber-300">
            Đặt Lịch Xưởng
          </a>
          <a href="#order-lookup" className="transition-colors hover:text-[#ff4d5e]">
            Tra Đơn Hàng
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <div
            title={
              apiConnected
                ? "Hệ thống kho đơn đang trực tuyến"
                : "Đang chạy chế độ xem trước"
            }
            className={`chamfer-sm hidden items-center gap-1.5 border px-2.5 py-1 font-mono text-[11px] font-semibold sm:flex ${
              apiConnected
                ? "border-emerald-700/65 bg-emerald-950/50 text-emerald-300"
                : "border-amber-700/65 bg-amber-950/50 text-amber-300"
            }`}
          >
            {apiConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            <span>{apiConnected ? "ONLINE" : "PREVIEW"}</span>
          </div>

          {onOpenAi && (
            <button
              type="button"
              onClick={onOpenAi}
              className="chamfer-sm hidden cursor-pointer items-center gap-1.5 border border-amber-500/70 bg-amber-950/35 px-3 py-2 text-xs font-bold text-amber-200 transition hover:border-amber-400 hover:bg-amber-950/65 lg:inline-flex"
            >
              <Bot className="h-3.5 w-3.5 text-amber-300" />
              <span>AI Thợ Đêm</span>
            </button>
          )}

          {customer ? (
            <Link
              href="/tai-khoan"
              className="chamfer-sm inline-flex items-center gap-1.5 border border-emerald-600/60 bg-emerald-950/35 px-3 py-2 text-xs font-bold text-emerald-200 transition hover:border-emerald-400 hover:text-white"
              title={`Tài khoản ${customer.fullName}`}
            >
              <UserCheck className="h-3.5 w-3.5 text-emerald-300" />
              <span className="max-w-24 truncate">{customer.fullName}</span>
            </Link>
          ) : (
            <Link
              href="/dang-nhap"
              className="chamfer-sm inline-flex items-center gap-1.5 border border-red-900/60 bg-[#14070b] px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:border-red-400 hover:text-white"
            >
              <User className="h-3.5 w-3.5 text-[#ff4d5e]" />
              <span className="hidden sm:inline">Đăng Nhập</span>
            </Link>
          )}

          <button
            type="button"
            onClick={onOpenCart}
            className="chamfer-sm relative inline-flex cursor-pointer items-center gap-2 border border-red-500/75 bg-gradient-to-b from-red-950/90 to-[#14060a] px-3.5 py-2 text-sm font-semibold text-[#f3ede8] shadow-[0_0_20px_rgba(225,29,46,0.35)] transition hover:border-red-400 hover:shadow-[0_0_28px_rgba(255,46,67,0.6)]"
          >
            <ShoppingBag className="h-4 w-4 text-[#ff4d5e]" />
            <span>Giỏ Hàng</span>
            <span className="inline-flex h-5 min-w-5 items-center justify-center bg-[#e11d2e] px-1.5 font-mono text-xs font-bold text-white">
              {cartCount}
            </span>
          </button>
        </div>
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] overflow-hidden bg-transparent"
      >
        <div
          ref={progressBarRef}
          className="h-full w-full origin-left scale-x-0 bg-gradient-to-r from-[#ff2e43] via-amber-400 to-[#ff2e43] shadow-[0_0_12px_#ff2e43]"
        />
      </div>
    </header>
  );
}
