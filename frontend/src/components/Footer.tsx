import Link from "next/link";
import { ChochinLantern } from "./ChochinLantern";

export function Footer() {
  return (
    <footer className="border-t border-red-900/40 bg-[#050304] py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-4 sm:px-6 md:flex-row md:items-center lg:px-8">
        <div className="flex items-center gap-4">
          <ChochinLantern kanji="灯" size="sm" sway={false} />
          <div>
            <p className="font-display text-base font-bold tracking-widest text-white">
              AKARI YOKOCHO <span className="font-jp text-sm text-red-400">{"//"} 赤灯横丁</span>
            </p>
            <p className="mt-0.5 text-xs text-zinc-400">
              Phụ tùng ô tô &amp; Quang học JDM phong cách Phố Đèn Đỏ Đêm Nhật Bản.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-6 text-xs text-zinc-400">
          <Link href="/#fitment" className="hover:text-red-400">
            Tra cứu theo xe
          </Link>
          <Link href="/#catalog" className="hover:text-red-400">
            Kệ hàng đêm
          </Link>
          <Link href="/#simulator" className="hover:text-red-400">
            Thử ánh sáng
          </Link>
          <Link href="/#builds" className="hover:text-red-400">
            Xe lên đèn
          </Link>
          <Link href="/#order-lookup" className="hover:text-red-400">
            Tra cứu đơn
          </Link>
          <Link href="/admin" className="font-semibold text-amber-300 hover:text-white">
            Quản trị (/admin)
          </Link>
        </div>
      </div>
    </footer>
  );
}

