"use client";

import { useMemo, useState } from "react";
import type { AutoPartProduct, CartItem, OrderRecord, PartCategory, VehicleFitment } from "@/types/autoparts";
import { CartDrawer } from "./CartDrawer";
import { FitmentBar } from "./FitmentBar";
import { Footer } from "./Footer";
import { HeroAlley } from "./HeroAlley";
import { Navbar } from "./Navbar";
import { OrderLookup } from "./OrderLookup";
import { ProductCard } from "./ProductCard";
import { ProductModal } from "./ProductModal";
import { RainBeamSimulator } from "./RainBeamSimulator";

interface StorefrontClientProps {
  initialProducts: AutoPartProduct[];
  initialFitments: VehicleFitment[];
  apiConnected: boolean;
}

const CATEGORIES: Array<{ id: "all" | PartCategory; label: string; jp: string }> = [
  { id: "all", label: "Tất Cả", jp: "全品" },
  { id: "bi-led", label: "Đèn Bi-LED & Bóng", jp: "ヘッドライト" },
  { id: "bi-fog", label: "Bi Gầm Phá Sương", jp: "フォグ" },
  { id: "tail-light", label: "Đèn Hậu Khói", jp: "テール" },
  { id: "chassis-brake", label: "Phanh & Gầm", jp: "ブレーキ" },
  { id: "jdm-aero", label: "Đồ Chơi Đêm JDM", jp: "夜光" },
];

export function StorefrontClient({
  initialProducts,
  initialFitments,
  apiConnected,
}: StorefrontClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<"all" | PartCategory>("all");
  const [selectedMake, setSelectedMake] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeProduct, setActiveProduct] = useState<AutoPartProduct | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [lastOrderCode, setLastOrderCode] = useState<string | undefined>(undefined);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return initialProducts.filter((part) => {
      if (selectedCategory !== "all" && part.category !== selectedCategory) {
        return false;
      }
      if (selectedMake && !part.compatibleVehicles.includes(selectedMake)) {
        return false;
      }
      if (q) {
        const hay = [
          part.nameVi,
          part.nameJp,
          part.sku,
          part.oemRef,
          part.brand,
          part.specs.socket ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [initialProducts, selectedCategory, selectedMake, searchQuery]);

  function addToCart(product: AutoPartProduct, selectedKelvin?: string) {
    const kelvin = selectedKelvin ?? product.specs.kelvin?.[0] ?? "Tiêu chuẩn";
    setCart((prev) => {
      const idx = prev.findIndex(
        (i) => i.product.id === product.id && i.selectedKelvin === kelvin,
      );
      if (idx >= 0) {
        return prev.map((item, i) =>
          i === idx ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [...prev, { product, quantity: 1, selectedKelvin: kelvin }];
    });
    setCartOpen(true);
  }

  function updateQty(productId: string, selectedKelvin: string, delta: number) {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product.id === productId && item.selectedKelvin === selectedKelvin
            ? { ...item, quantity: item.quantity + delta }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function removeItem(productId: string, selectedKelvin: string) {
    setCart((prev) =>
      prev.filter(
        (item) =>
          !(item.product.id === productId && item.selectedKelvin === selectedKelvin),
      ),
    );
  }

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="kumiko-grid min-h-screen">
      <Navbar
        cartCount={cartCount}
        apiConnected={apiConnected}
        onOpenCart={() => setCartOpen(true)}
      />

      <main>
        <HeroAlley />

        <FitmentBar
          fitments={initialFitments}
          selectedMake={selectedMake}
          searchQuery={searchQuery}
          onSelectMake={setSelectedMake}
          onSearchChange={setSearchQuery}
        />

        {/* Product Catalog Section */}
        <section id="catalog" className="mx-auto max-w-7xl px-4 pt-16 pb-8 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="font-mono text-xs tracking-[0.22em] text-red-400 uppercase">
                夜の陳列棚 // Kệ Hàng Đêm ({filteredProducts.length} sản phẩm)
              </p>
              <h2 className="mt-1.5 font-[family-name:var(--font-serif-jp)] text-2xl font-bold text-[#ede6e1] sm:text-3xl">
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
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                      active
                        ? "border-red-500 bg-[#e11d2e] text-white shadow-[0_0_16px_rgba(225,29,46,0.4)]"
                        : "border-red-900/40 bg-[#12090d] text-zinc-300 hover:border-red-600/60"
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className="ml-1.5 font-[family-name:var(--font-serif-jp)] text-[10px] opacity-75">
                      {cat.jp}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-dashed border-red-900/50 bg-[#0d070a] p-12 text-center">
              <p className="text-base font-semibold text-zinc-200">
                Không có phụ tùng khớp bộ lọc hiện tại
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                Thử xóa bộ lọc hãng xe hoặc đổi từ khóa tìm kiếm.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("all");
                  setSelectedMake("");
                  setSearchQuery("");
                }}
                className="mt-4 rounded-lg border border-red-600 px-4 py-2 text-xs font-semibold text-red-300 hover:bg-red-950/60 cursor-pointer"
              >
                Đặt Lại Bộ Lọc
              </button>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={(p) => setActiveProduct(p)}
                  onQuickAdd={(p) => addToCart(p)}
                />
              ))}
            </div>
          )}
        </section>

        <RainBeamSimulator />
        <OrderLookup lastOrderCode={lastOrderCode} />
      </main>

      <Footer />

      <ProductModal
        product={activeProduct}
        onClose={() => setActiveProduct(null)}
        onAddToCart={(p, k) => addToCart(p, k)}
      />

      <CartDrawer
        open={cartOpen}
        items={cart}
        onClose={() => setCartOpen(false)}
        onUpdateQty={updateQty}
        onRemove={removeItem}
        onClearCart={() => setCart([])}
        onOrderCreated={(order: OrderRecord) => setLastOrderCode(order.orderCode)}
      />
    </div>
  );
}

