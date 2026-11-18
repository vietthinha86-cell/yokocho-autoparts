import type { Metadata } from "next";
import { Suspense } from "react";
import { CustomerAuthClient } from "@/components/CustomerAuthClient";

export const metadata: Metadata = {
  title: "Đăng Nhập & Đăng Ký Thành Viên",
  description:
    "Đăng nhập hoặc đăng ký tài khoản AKARI YOKOCHO để lưu Gara xe cá nhân, tự điền thông tin giao hàng và theo dõi lịch sử đơn.",
};

export default function CustomerLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="kumiko-grid flex min-h-screen items-center justify-center font-mono text-xs text-zinc-400">
          Đang tải cổng thành viên AKARI YOKOCHO...
        </div>
      }
    >
      <CustomerAuthClient />
    </Suspense>
  );
}
