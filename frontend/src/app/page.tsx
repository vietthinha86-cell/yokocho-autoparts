import { StorefrontClient } from "@/components/StorefrontClient";
import { fetchCatalogData, fetchPublicReviews } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [{ products, fitments, combos, apiConnected }, reviewFeed] =
    await Promise.all([fetchCatalogData(), fetchPublicReviews()]);

  return (
    <StorefrontClient
      initialProducts={products}
      initialFitments={fitments}
      initialCombos={combos}
      initialReviews={reviewFeed.items}
      apiConnected={apiConnected}
    />
  );
}

