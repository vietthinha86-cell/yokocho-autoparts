import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetailClient } from "@/components/ProductDetailClient";
import { fetchProductBySlug, fetchPublicReviews } from "@/lib/api";

export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { product } = await fetchProductBySlug(slug);
  if (!product) {
    return {
      title: "Không tìm thấy phụ tùng",
    };
  }
  return {
    title: `${product.nameVi} (${product.sku})`,
    description: product.summaryVi,
    alternates: {
      canonical: `/san-pham/${product.slug}`,
    },
    openGraph: {
      title: `${product.nameVi} | AKARI YOKOCHO`,
      description: product.summaryVi,
      type: "website",
      images: [
        {
          url: product.image,
          width: 1024,
          height: 1024,
          alt: product.nameVi,
        },
      ],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const { product, related, apiConnected } = await fetchProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const reviewFeed = await fetchPublicReviews(product.id);
  const reviewCount = reviewFeed.items.length;
  const ratingAverage =
    reviewCount > 0
      ? Number(
          (
            reviewFeed.items.reduce((sum, review) => sum + review.rating, 0) /
            reviewCount
          ).toFixed(1)
        )
      : null;

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.nameVi,
    sku: product.sku,
    description: product.summaryVi,
    image: product.image,
    brand: {
      "@type": "Brand",
      name: product.brand,
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "VND",
      price: product.priceVnd,
      availability:
        product.stockStatus === "jdm_preorder"
          ? "https://schema.org/PreOrder"
          : product.stockQty > 0
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
    },
    ...(ratingAverage !== null
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: ratingAverage,
            reviewCount,
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <ProductDetailClient
        product={product}
        related={related}
        reviews={reviewFeed.items}
        apiConnected={apiConnected}
      />
    </>
  );
}

