import { StorefrontClient } from "@/components/StorefrontClient";
import { fetchCatalogData } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { products, fitments, apiConnected } = await fetchCatalogData();

  return (
    <StorefrontClient
      initialProducts={products}
      initialFitments={fitments}
      apiConnected={apiConnected}
    />
  );
}

