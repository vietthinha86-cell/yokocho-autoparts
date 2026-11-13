import type { Metadata } from "next";
import { AdminDashboardClient } from "@/components/AdminDashboardClient";

export const metadata: Metadata = {
  title: "Quản Trị Xưởng Đêm (/admin) | AKARI YOKOCHO",
  description: "Dashboard quản lý tồn kho, bảng giá, đơn hàng và webhook thanh toán VietQR.",
};

export default function AdminPage() {
  return <AdminDashboardClient />;
}

