"use client";

import { ArrowUpDown, SlidersHorizontal, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import {
  addProductsToStoredCart,
  clearStoredCart,
  removeStoredCartItem,
  updateStoredCartQty,
  usePersistentCart,
} from "@/lib/cartStorage";
import { FALLBACK_REVIEWS } from "@/lib/api";
import type {
  AutoPartProduct,
  OrderRecord,
  PartCategory,
  ProductReviewRecord,
  VehicleBuildCombo,
  VehicleFitment,
} from "@/types/autoparts";
import { CartDrawer } from "./CartDrawer";
import { CompareModal } from "./CompareModal";
import { CustomerReviewsSection } from "./CustomerReviewsSection";
import { FitmentBar } from "./FitmentBar";
import { FloatingHudRail } from "./FloatingHudRail";
import { Footer } from "./Footer";
import { HeroAlley } from "./HeroAlley";
import { AkariAiDrawer } from "./AkariAiDrawer";
import { matchesSmartProductQuery } from "@/lib/smartSearch";
import type { RainBeamColorMode } from "./MidnightRainCanvas";
import { Navbar } from "./Navbar";
import { OrderLookup } from "./OrderLookup";
import { ProductCard } from "./ProductCard";
import { ProductModal } from "./ProductModal";
import { RainBeamSimulator } from "./RainBeamSimulator";
import { VehicleBuildsShowcase } from "./VehicleBuildsShowcase";

interface StorefrontClientProps {
  initialProducts: AutoPartProduct[];
  initialFitments: VehicleFitment[];
  initialCombos: VehicleBuildCombo[];
  initialReviews?: ProductReviewRecord[];
  initialMake?: string;
  initialLookupCode?: string;
  apiConnected: boolean;
}

const CATEGORIES: Array<{ id: "all" | PartCategory; label: string; jp: string }> = [
  { id: "all", label: "Tất Cả", jp: "全品" },
  { id: "bi-led", label: "Đèn Bi-LED & Bóng", jp: "ヘッドライト" },
  { id: "bi-fog", label: "Bi Gầm Phá Sương", jp: "フォグ" },
  { id: "tail-light", label: "Đèn Hậu Khói", jp: "テール" },
  { id: "chassis-brake", label: "Phanh, Còi & Gầm", jp: "ブレーキ" },
  { id: "jdm-aero", label: "Đồ Chơi Đêm JDM", jp: "夜光" },
];

const KELVIN_FILTERS = [
  { id: "all", label: "Mọi Nhiệt Màu" },
  { id: "3000K", label: "3000K Phá Sương" },
  { id: "4300K", label: "4300K Nắng Ấm" },
  { id: "5500K", label: "5500K Trắng Sạch" },
  { id: "6000K", label: "6000K Trắng Mát" },
  { id: "Crimson", label: "Đỏ Huyết / Khói" },
];

export function StorefrontClient({
  initialProducts,
  initialFitments,
  initialCombos,
  initialReviews = FALLBACK_REVIEWS,
  initialMake = "",
  initialLookupCode,
  apiConnected,
}: StorefrontClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<"all" | PartCategory>("all");
  const [selectedMake, setSelectedMake] = useState(initialMake);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKelvin, setSelectedKelvin] = useState("all");
  const [priceRange, setPriceRange] = useState<"all" | "under_2m" | "2m_5m" | "over_5m">("all");
  const [stockFilter, setStockFilter] = useState<"all" | "in_stock" | "jdm_preorder">("all");
  const [sortBy, setSortBy] = useState<"default" | "price_asc" | "price_desc">("default");
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [activeProduct, setActiveProduct] = useState<AutoPartProduct | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [beamMode, setBeamMode] = useState<RainBeamColorMode>("combo");
  const [lastOrderCode, setLastOrderCode] = useState<string | undefined>(initialLookupCode);
  const [catalogSweepKey, setCatalogSweepKey] = useState(0);

  function triggerCatalogPrism() {
    setCatalogSweepKey((k) => k + 1);
  }

  const cart = usePersistentCart();

  const filteredProducts = useMemo(() => {
    const list = initialProducts.filter((part) => {
      if (selectedCategory !== "all" && part.category !== selectedCategory) {
        return false;
      }
      if (selectedMake && !part.compatibleVehicles.includes(selectedMake)) {
        return false;
      }
      if (selectedKelvin !== "all") {
        const joinedKelvin = (part.specs.kelvin ?? []).join(" ").toLowerCase();
        if (!joinedKelvin.includes(selectedKelvin.toLowerCase())) {
          return false;
        }
      }
      if (priceRange === "under_2m" && part.priceVnd >= 2_000_000) {
        return false;
      }
      if (priceRange === "2m_5m" && (part.priceVnd < 2_000_000 || part.priceVnd > 5_000_000)) {
        return false;
      }
      if (priceRange === "over_5m" && part.priceVnd <= 5_000_000) {
        return false;
      }
      if (stockFilter === "in_stock" && part.stockStatus !== "in_stock") {
        return false;
      }
      if (stockFilter === "jdm_preorder" && part.stockStatus !== "jdm_preorder") {
        return false;
      }
      if (
        searchQuery.trim() &&
        !matchesSmartProductQuery(part, searchQuery, initialFitments)
      ) {
        return false;
      }
      return true;
    });

    if (sortBy === "price_asc") {
      return [...list].sort((a, b) => a.priceVnd - b.priceVnd);
    }
    if (sortBy === "price_desc") {
      return [...list].sort((a, b) => b.priceVnd - a.priceVnd);
    }
    return list;
  }, [
    initialProducts,
    initialFitments,
    selectedCategory,
    selectedMake,
    searchQuery,
    selectedKelvin,
    priceRange,
    stockFilter,
    sortBy,
  ]);

  const comparedProducts = useMemo(
    () =>
      compareIds
        .map((id) => initialProducts.find((p) => p.id === id))
        .filter((p): p is AutoPartProduct => Boolean(p)),
    [compareIds, initialProducts],
  );

  function addToCart(product: AutoPartProduct, kelvin?: string) {
    addProductsToStoredCart([{ product, selectedKelvin: kelvin }]);
    setCartOpen(true);
  }

  function handleAddCombo(parts: AutoPartProduct[]) {
    addProductsToStoredCart(parts.map((p) => ({ product: p })));
    setCartOpen(true);
  }

  function handleToggleCompare(product: AutoPartProduct) {
    setCompareIds((prev) => {
      if (prev.includes(product.id)) {
        return prev.filter((id) => id !== product.id);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), product.id];
      }
      return [...prev, product.id];
    });
  }

  function handleJumpToLookup(orderCode: string) {
    setLastOrderCode(orderCode);
    if (typeof document !== "undefined") {
      const el = document.getElementById("order-lookup");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="kumiko-grid min-h-screen">
      <Navbar
        cartCount={cartCount}
        apiConnected={apiConnected}
        onOpenCart={() => setCartOpen(true)}
        onOpenAi={() => setAiOpen(true)}
      />

      <main>
        <HeroAlley />

        <FitmentBar
          fitments={initialFitments}
          selectedMake={selectedMake}
          searchQuery={searchQuery}
          onSelectMake={(make) => {
            setSelectedMake(make);
            triggerCatalogPrism();
          }}
          onSearchChange={setSearchQuery}
          onOpenAi={() => setAiOpen(true)}
        />

        {/* Product Catalog Section */}
        <section id="catalog" className="relative mx-auto max-w-7xl px-4 pt-16 pb-14 sm:px-6 lg:px-8">
          <div className="relative flex flex-col justify-between gap-5 overflow-hidden border-b border-red-800/45 pb-6 md:flex-row md:items-end">
            {catalogSweepKey > 0 && (
              <div
                key={catalogSweepKey}
                aria-hidden="true"
                className="animate-prism-sweep pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-[#ff2e43]/22 to-amber-400/20 mix-blend-screen"
              />
            )}
            <div>
              <p className="flex items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.2em] text-[#ff4d5e] uppercase">
                <span>KỆ HÀNG ĐÊM · {filteredProducts.length} SẢN PHẨM</span>
                <span className="font-jp text-zinc-500">夜の陳列棚</span>
              </p>
              <h2 className="font-display mt-1.5 text-2xl leading-[1.2] font-bold tracking-[-0.02em] text-[#f3ede8] sm:text-3xl">
                Phụ Tùng &amp; Đèn Tăng Sáng Tuyển Chọn
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const active = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      triggerCatalogPrism();
                    }}
                    className={`chamfer-sm cursor-pointer border px-3.5 py-1.5 text-xs font-semibold transition ${
                      active
                        ? "border-red-400 bg-[#e11d2e] text-white shadow-[0_0_18px_rgba(225,29,46,0.55)]"
                        : "border-red-900/50 bg-[#12080c] text-zinc-200 hover:border-red-500"
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className="font-jp ml-1.5 text-[10px] opacity-85">{cat.jp}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Advanced Technical Filter & Sort Strip */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border border-red-900/40 bg-[#0b0407]/90 px-4 py-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold text-amber-300">
                <SlidersHorizontal className="h-3.5 w-3.5 text-[#ff4d5e]" />
                Lọc nhanh:
              </span>

              <select
                value={selectedKelvin}
                onChange={(e) => setSelectedKelvin(e.target.value)}
                aria-label="Lọc theo nhiệt màu Kelvin"
                className="cursor-pointer border border-red-900/55 bg-[#12070b] px-2.5 py-1.5 text-xs text-zinc-200 focus:border-red-500 focus:outline-none"
              >
                {KELVIN_FILTERS.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.label}
                  </option>
                ))}
              </select>

              <select
                value={priceRange}
                onChange={(e) =>
                  setPriceRange(e.target.value as "all" | "under_2m" | "2m_5m" | "over_5m")
                }
                aria-label="Lọc theo khoảng giá"
                className="cursor-pointer border border-red-900/55 bg-[#12070b] px-2.5 py-1.5 text-xs text-zinc-200 focus:border-red-500 focus:outline-none"
              >
                <option value="all">Mọi Mức Giá</option>
                <option value="under_2m">Dưới 2.000.000₫</option>
                <option value="2m_5m">2.000.000₫ – 5.000.000₫</option>
                <option value="over_5m">Trên 5.000.000₫</option>
              </select>

              <select
                value={stockFilter}
                onChange={(e) =>
                  setStockFilter(e.target.value as "all" | "in_stock" | "jdm_preorder")
                }
                aria-label="Lọc theo tình trạng kho"
                className="cursor-pointer border border-red-900/55 bg-[#12070b] px-2.5 py-1.5 text-xs text-zinc-200 focus:border-red-500 focus:outline-none"
              >
                <option value="all">Mọi Tình Trạng Kho</option>
                <option value="in_stock">Sẵn Kho Giao Ngay</option>
                <option value="jdm_preorder">Đặt Hàng Nhật</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href="#builds"
                className="inline-flex items-center gap-1.5 border border-amber-500/45 bg-amber-950/30 px-2.5 py-1 text-[11px] font-semibold text-amber-300 transition hover:border-amber-400"
              >
                <Sparkles className="h-3 w-3" />
                <span>Xem Combo Xe Lên Đèn ↓</span>
              </a>

              <div className="flex items-center gap-1.5">
                <ArrowUpDown className="h-3.5 w-3.5 text-zinc-400" />
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as "default" | "price_asc" | "price_desc")
                  }
                  aria-label="Sắp xếp theo giá"
                  className="cursor-pointer border border-red-900/55 bg-[#12070b] px-2.5 py-1.5 text-xs text-zinc-200 focus:border-red-500 focus:outline-none"
                >
                  <option value="default">Mặc Định Tuyển Chọn</option>
                  <option value="price_asc">Giá: Thấp → Cao</option>
                  <option value="price_desc">Giá: Cao → Thấp</option>
                </select>
              </div>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="chamfer-md mt-10 border border-dashed border-red-800/60 bg-[#0d0609] p-12 text-center">
              <p className="text-base font-semibold text-zinc-100">
                Không có phụ tùng khớp bộ lọc hiện tại
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                Thử xóa bộ lọc hãng xe, nhiệt màu hoặc đổi từ khóa tìm kiếm.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("all");
                  setSelectedMake("");
                  setSearchQuery("");
                  setSelectedKelvin("all");
                  setPriceRange("all");
                  setStockFilter("all");
                  setSortBy("default");
                }}
                className="chamfer-sm mt-4 cursor-pointer border border-red-500 px-4 py-2 text-xs font-semibold text-red-300 hover:bg-red-950/60"
              >
                Đặt Lại Bộ Lọc
              </button>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={index}
                  isCompared={compareIds.includes(product.id)}
                  onSelect={(p) => setActiveProduct(p)}
                  onQuickAdd={(p) => addToCart(p)}
                  onToggleCompare={handleToggleCompare}
                />
              ))}
            </div>
          )}
        </section>

        <RainBeamSimulator activeMode={beamMode} onModeChange={setBeamMode} />

        <VehicleBuildsShowcase
          combos={initialCombos}
          products={initialProducts}
          onAddCombo={handleAddCombo}
        />

        <CustomerReviewsSection
          initialReviews={initialReviews}
          products={initialProducts}
          apiConnected={apiConnected}
        />

        <OrderLookup key={lastOrderCode ?? "init"} lastOrderCode={lastOrderCode} />
      </main>

      <Footer />

      <FloatingHudRail />

      <CompareModal
        selectedProducts={comparedProducts}
        onRemove={(id) => setCompareIds((prev) => prev.filter((item) => item !== id))}
        onClear={() => setCompareIds([])}
        onQuickAdd={(p) => addToCart(p)}
      />

      <ProductModal
        product={activeProduct}
        onClose={() => setActiveProduct(null)}
        onAddToCart={(p, k) => addToCart(p, k)}
      />

      <CartDrawer
        open={cartOpen}
        items={cart}
        onClose={() => setCartOpen(false)}
        onUpdateQty={updateStoredCartQty}
        onRemove={removeStoredCartItem}
        onClearCart={clearStoredCart}
        onOrderCreated={(order: OrderRecord) => setLastOrderCode(order.orderCode)}
        onJumpToLookup={handleJumpToLookup}
      />

      <AkariAiDrawer
        open={aiOpen}
        onOpen={() => setAiOpen(true)}
        onClose={() => setAiOpen(false)}
        products={initialProducts}
        fitments={initialFitments}
        selectedVehicleMake={selectedMake}
        onAddProduct={(p) => addToCart(p)}
        onAddCombo={handleAddCombo}
        onApplyBeamMode={(mode) => {
          setBeamMode(mode);
          setAiOpen(false);
          if (typeof document !== "undefined") {
            const el = document.getElementById("simulator");
            el?.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }}
      />
    </div>
  );
}
