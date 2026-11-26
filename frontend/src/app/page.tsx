import { StorefrontClient } from "@/components/StorefrontClient";
import { fetchCatalogData, fetchPublicReviews, fetchPublicVouchers } from "@/lib/api";

export const dynamic = "force-dynamic";

interface HomePageProps {
  searchParams?: Promise<{ make?: string; lookup?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const [{ products, fitments, combos, apiConnected }, reviewFeed, vouchers] =
    await Promise.all([
      fetchCatalogData(),
      fetchPublicReviews(),
      fetchPublicVouchers(),
    ]);

  return (
    <StorefrontClient
      initialProducts={products}
      initialFitments={fitments}
      initialCombos={combos}
      initialReviews={reviewFeed.items}
      initialVouchers={vouchers}
      initialMake={resolvedParams.make ?? ""}
      initialLookupCode={resolvedParams.lookup}
      apiConnected={apiConnected}
    />
  );
}

