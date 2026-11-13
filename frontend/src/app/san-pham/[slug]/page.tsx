import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetailClient } from "@/components/ProductDetailClient";
import { fetchProductBySlug } from "@/lib/api";

export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { product } = await fetchProductBySlug(slug);
  if (!product) {
    return {
      title: "Không tìm thấy phụ tùng | AKARI YOKOCHO",
    };
  }
  return {
    title: `${product.nameVi} (${product.sku}) | AKARI YOKOCHO`,
    description: product.summaryVi,
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const { product, related, apiConnected } = await fetchProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <ProductDetailClient
      product={product}
      related={related}
      apiConnected={apiConnected}
    />
  );
}

