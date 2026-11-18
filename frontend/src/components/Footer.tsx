import Link from "next/link";
import { ChochinLantern } from "./ChochinLantern";

export function Footer() {
  return (
    <footer className="border-t border-red-900/40 bg-[#050304] py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-4 sm:px-6 md:flex-row md:items-center lg:px-8">
        <div className="flex items-center gap-4">
          <ChochinLantern kanji="灯" size="sm" sway={false} />
          <div>
            <p className="font-display text-base font-bold tracking-[0.14em] text-white">
              AKARI YOKOCHO <span className="font-jp ml-1 text-xs text-red-400">赤灯横丁</span>
            </p>
            <p className="mt-1 text-[13px] text-zinc-400">
              Phụ tùng ô tô &amp; quang học tăng sáng JDM chuẩn giắc zin theo xe.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-5 text-[13px] text-zinc-400">
          <Link href="/#fitment" className="transition-colors hover:text-red-400">
            Tra cứu xe
          </Link>
          <Link href="/#catalog" className="transition-colors hover:text-red-400">
            Kệ hàng
          </Link>
          <Link href="/#simulator" className="transition-colors hover:text-red-400">
            Thử ánh sáng
          </Link>
          <Link href="/#reviews" className="transition-colors hover:text-red-400">
            Đánh giá
          </Link>
          <Link href="/#order-lookup" className="transition-colors hover:text-red-400">
            Tra cứu đơn
          </Link>
          <Link href="/tai-khoan" className="font-medium text-zinc-200 transition-colors hover:text-amber-300">
            Tài khoản
          </Link>
          <Link href="/admin/login" className="text-xs text-zinc-600 transition-colors hover:text-zinc-400">
            Nội bộ
          </Link>
        </div>
      </div>
    </footer>
  );
}

