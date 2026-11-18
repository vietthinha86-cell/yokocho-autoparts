import type { Metadata } from "next";
import { CustomerAccountClient } from "@/components/CustomerAccountClient";
import { fetchCatalogData } from "@/lib/api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tài Khoản Thành Viên & Gara Xe",
  description:
    "Quản lý hồ sơ khách hàng, Gara xe cá nhân và lịch sử đơn hàng tại AKARI YOKOCHO.",
};

export default async function CustomerAccountPage() {
  const { products, fitments } = await fetchCatalogData();
  return <CustomerAccountClient products={products} fitments={fitments} />;
}
