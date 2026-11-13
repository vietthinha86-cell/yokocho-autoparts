"use client";

import { ShoppingBag, Sparkles, Wifi, WifiOff } from "lucide-react";
import { ChochinLantern } from "./ChochinLantern";

interface NavbarProps {
  cartCount: number;
  apiConnected: boolean;
  onOpenCart: () => void;
}

export function Navbar({ cartCount, apiConnected, onOpenCart }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-red-900/35 bg-[#070406]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <a href="#top" className="group flex items-center gap-3">
          <ChochinLantern kanji="灯" size="sm" sway={false} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-[family-name:var(--font-serif-jp)] text-lg font-bold tracking-[0.14em] text-[#ede6e1] group-hover:text-[#ff4d5e] transition-colors">
                AKARI YOKOCHO
              </span>
              <span className="hidden rounded border border-red-800/60 bg-red-950/60 px-1.5 py-0.5 font-[family-name:var(--font-serif-jp)] text-[11px] text-red-300 sm:inline-block">
                赤灯横丁
              </span>
            </div>
            <p className="text-[11px] tracking-widest text-[#9a8d92] uppercase">
              Phụ Tùng &amp; Quang Học Đêm Nhật Bản
            </p>
          </div>
        </a>

        <nav className="hidden items-center gap-7 text-sm font-medium text-zinc-300 md:flex">
          <a href="#fitment" className="hover:text-[#ff4d5e] transition-colors">
            Tra Cứu Xe
          </a>
          <a href="#catalog" className="hover:text-[#ff4d5e] transition-colors">
            Kệ Hàng Đêm
          </a>
          <a href="#simulator" className="flex items-center gap-1.5 hover:text-amber-400 transition-colors">
            <Sparkles className="h-3.5 w-3.5 text-red-500" />
            Thử Ánh Sáng
          </a>
          <a href="#order-lookup" className="hover:text-[#ff4d5e] transition-colors">
            Tra Đơn Hàng
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <div
            title={
              apiConnected
                ? "Backend API (localhost:4000) đang hoạt động"
                : "Đang chạy chế độ dữ liệu dự phòng (khởi động backend tại port 4000 để lưu đơn thật)"
            }
            className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-mono sm:flex ${
              apiConnected
                ? "border-emerald-800/50 bg-emerald-950/40 text-emerald-300"
                : "border-amber-800/50 bg-amber-950/40 text-amber-300"
            }`}
          >
            {apiConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            <span>{apiConnected ? "API LIVE" : "PREVIEW"}</span>
          </div>

          <button
            type="button"
            onClick={onOpenCart}
            className="relative inline-flex items-center gap-2 border border-red-600/60 bg-gradient-to-b from-red-950/85 to-[#14070b] px-3.5 py-2 text-sm font-semibold text-[#ede6e1] shadow-[0_0_18px_rgba(225,29,46,0.3)] transition hover:border-red-400 hover:shadow-[0_0_24px_rgba(225,29,46,0.55)] cursor-pointer"
          >
            <ShoppingBag className="h-4 w-4 text-red-400" />
            <span>Giỏ Hàng</span>
            <span className="inline-flex h-5 min-w-5 items-center justify-center bg-[#e11d2e] px-1.5 font-mono text-xs font-bold text-white">
              {cartCount}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}

