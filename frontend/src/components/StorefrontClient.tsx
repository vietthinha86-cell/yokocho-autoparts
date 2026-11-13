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

const TICKER_ITEMS = [
  "赤灯横丁 // KHO QUANG HỌC JDM ĐÊM",
  "KIỂM GIẮC ZIN PLUG & PLAY 100%",
  "MẶT CẮT Z-STEP NHẬT KHÔNG CHÓI XE ĐỐI DIỆN",
  "BI-GẦM 3000K PHÁ SƯƠNG XUYÊN MƯA BÃO",
  "BẢO HÀNH ĐIỆN TỬ 1 ĐỔI 1 TỚI 36 THÁNG",
  "FREESHIP TOÀN QUỐC TỪ 3.000.000₫",
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

      {/* Razor-sharp animated Midnight Garage Spec Ticker */}
      <div className="overflow-hidden border-b border-red-800/45 bg-[#0b0306] py-1.5 font-sans text-[11px] font-semibold tracking-[0.06em] text-zinc-300">
        <div className="animate-ticker">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((text, idx) => (
            <span key={`${text}-${idx}`} className="mx-5 inline-flex items-center gap-2.5 whitespace-nowrap">
              <span className="text-[10px] text-[#ff2e43]">◆</span>
              <span className={idx % 2 === 0 ? "text-amber-300" : "text-zinc-200"}>{text}</span>
            </span>
          ))}
        </div>
      </div>

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
        <section id="catalog" className="relative mx-auto max-w-7xl px-4 pt-16 pb-14 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-5 border-b border-red-800/45 pb-6 md:flex-row md:items-end">
            <div>
              <p className="flex items-center gap-2 text-xs font-bold tracking-[0.16em] text-[#ff4d5e] uppercase">
                <span className="font-jp">夜の陳列棚</span>
                <span className="font-mono">{"//"} Kệ Hàng Đêm ({filteredProducts.length} sản phẩm)</span>
              </p>
              <h2 className="font-display mt-1.5 text-2xl font-bold tracking-tight text-[#f3ede8] sm:text-3xl">
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
                    className={`chamfer-sm cursor-pointer border px-3.5 py-1.5 text-xs font-semibold transition ${
                      active
                        ? "border-red-400 bg-[#e11d2e] text-white shadow-[0_0_18px_rgba(225,29,46,0.55)]"
                        : "border-red-900/50 bg-[#12080c] text-zinc-200 hover:border-red-500"
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className="font-jp ml-1.5 text-[10px] opacity-85">
                      {cat.jp}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="chamfer-md mt-10 border border-dashed border-red-800/60 bg-[#0d0609] p-12 text-center">
              <p className="text-base font-semibold text-zinc-100">
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
