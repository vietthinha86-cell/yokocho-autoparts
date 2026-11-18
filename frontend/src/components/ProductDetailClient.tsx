"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CarFront,
  CheckCircle2,
  Eye,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  User,
  UserCheck,
  Wrench,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { formatVnd } from "@/lib/api";
import { useCustomerSession } from "@/lib/useCustomerSession";
import {
  addProductsToStoredCart,
  clearStoredCart,
  removeStoredCartItem,
  updateStoredCartQty,
  usePersistentCart,
} from "@/lib/cartStorage";
import type { AutoPartProduct, ProductReviewRecord } from "@/types/autoparts";
import { AnimatedProductVisual } from "./AnimatedProductVisual";
import { CartDrawer } from "./CartDrawer";
import { CustomerReviewsSection } from "./CustomerReviewsSection";
import { Footer } from "./Footer";
import { MidnightRainCanvas, type RainBeamColorMode } from "./MidnightRainCanvas";
import { ProductCard } from "./ProductCard";
import { ProductModal } from "./ProductModal";

function inferBeamMode(kelvin: string): RainBeamColorMode {
  const lower = kelvin.toLowerCase();
  if (lower.includes("3000")) return "3000k";
  if (lower.includes("4300")) return "4300k";
  if (lower.includes("5500") || lower.includes("6000")) return "6000k";
  return "combo";
}

interface ProductDetailClientProps {
  product: AutoPartProduct;
  related: AutoPartProduct[];
  reviews?: ProductReviewRecord[];
  apiConnected: boolean;
}

const STOCK_BADGE: Record<AutoPartProduct["stockStatus"], { label: string; cls: string }> = {
  in_stock: {
    label: "SẴN KHO GIAO NGAY",
    cls: "border-emerald-600/75 bg-emerald-950/85 text-emerald-300",
  },
  low_stock: {
    label: "SẮP HẾT HÀNG",
    cls: "border-amber-500/80 bg-amber-950/85 text-amber-300",
  },
  jdm_preorder: {
    label: "ĐẶT NHẬT 5–7 NGÀY",
    cls: "border-red-500/80 bg-red-950/90 text-red-300",
  },
};

export function ProductDetailClient({
  product,
  related,
  reviews = [],
  apiConnected,
}: ProductDetailClientProps) {
  const router = useRouter();
  const cart = usePersistentCart();
  const { customer } = useCustomerSession();
  const kelvinOptions = product.specs.kelvin ?? ["Tiêu chuẩn"];
  const [selectedKelvin, setSelectedKelvin] = useState(kelvinOptions[0] ?? "Tiêu chuẩn");
  const [quantity, setQuantity] = useState(1);
  const [beamPreviewMode, setBeamPreviewMode] = useState<"low" | "high">("low");
  const [cartOpen, setCartOpen] = useState(false);
  const [modalProduct, setModalProduct] = useState<AutoPartProduct | null>(null);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const stock = STOCK_BADGE[product.stockStatus];

  function handleAddCurrent(openDrawer = true) {
    addProductsToStoredCart([
      { product, selectedKelvin, quantity },
    ]);
    if (openDrawer) {
      setCartOpen(true);
    }
  }

  return (
    <div className="kumiko-grid min-h-screen">
      {/* Sticky header synced to home anchors */}
      <header className="sticky top-0 z-40 border-b border-red-800/45 bg-[#060305]/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="group flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-sm border border-[#ff2e43]/70 bg-gradient-to-b from-[#e11d2e] to-[#7f0a17] shadow-[0_0_24px_rgba(225,29,46,0.65)]">
              <span className="font-jp text-lg font-black tracking-tight text-white">灯</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-sm font-bold tracking-[0.12em] text-white sm:text-base">
                  AKARI YOKOCHO
                </span>
                <span className="font-jp hidden border border-red-500/40 bg-red-950/70 px-1.5 py-0.5 text-[10px] font-bold text-red-300 sm:inline">
                  赤灯横丁
                </span>
              </div>
              <p className="font-mono text-[10px] tracking-[0.16em] text-red-300/80 uppercase">
                Chi Tiết Kỹ Thuật Phụ Tùng
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-xs font-semibold tracking-wide text-zinc-200 md:flex">
            <Link href="/#fitment" className="transition hover:text-[#ff4d5e]">
              Tra Cứu Xe
            </Link>
            <Link href="/#catalog" className="transition hover:text-[#ff4d5e]">
              Kệ Hàng Đêm
            </Link>
            <Link href="/#simulator" className="inline-flex items-center gap-1 transition hover:text-[#ff4d5e]">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              Thử Ánh Sáng
            </Link>
            <Link href="/#builds" className="transition hover:text-[#ff4d5e]">
              Xe Lên Đèn
            </Link>
          </nav>

          <div className="flex items-center gap-2.5">
            <span
              className={`hidden items-center gap-1.5 border px-2.5 py-1 font-mono text-[10px] font-bold sm:inline-flex ${
                apiConnected
                  ? "border-emerald-700/70 bg-emerald-950/60 text-emerald-300"
                  : "border-amber-700/70 bg-amber-950/60 text-amber-300"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {apiConnected ? "API LIVE" : "OFFLINE CACHE"}
            </span>
            {customer ? (
              <Link
                href="/tai-khoan"
                className="chamfer-sm inline-flex items-center gap-1.5 border border-emerald-600/60 bg-emerald-950/35 px-3 py-2 text-xs font-bold text-emerald-200 hover:border-emerald-400"
              >
                <UserCheck className="h-3.5 w-3.5 text-emerald-300" />
                <span className="max-w-24 truncate">{customer.fullName}</span>
              </Link>
            ) : (
              <Link
                href={`/dang-nhap?next=${encodeURIComponent(`/san-pham/${product.slug}`)}`}
                className="chamfer-sm inline-flex items-center gap-1.5 border border-red-900/60 bg-[#14070b] px-3 py-2 text-xs font-semibold text-zinc-200 hover:border-red-400 hover:text-white"
              >
                <User className="h-3.5 w-3.5 text-[#ff4d5e]" />
                <span className="hidden sm:inline">Đăng Nhập</span>
              </Link>
            )}
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="chamfer-sm relative flex cursor-pointer items-center gap-2 border border-red-500/70 bg-gradient-to-r from-[#24060c] to-[#140508] px-3.5 py-2 text-xs font-bold text-white shadow-[0_0_20px_rgba(225,29,46,0.35)] transition hover:border-[#ff4d5e]"
            >
              <ShoppingBag className="h-4 w-4 text-[#ff4d5e]" />
              <span>Giỏ Hàng</span>
              <span className="inline-flex h-5 min-w-5 items-center justify-center bg-[#e11d2e] px-1.5 font-mono text-[11px] font-black text-white">
                {cartCount}
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-red-900/40 pb-4 text-xs">
          <div className="flex items-center gap-2 text-zinc-400">
            <Link
              href="/#catalog"
              className="inline-flex items-center gap-1.5 font-semibold text-red-300 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Quay lại Kệ Hàng Đêm</span>
            </Link>
            <span>/</span>
            <span className="font-mono text-zinc-300">{product.sku}</span>
          </div>
          <span className={`border px-2.5 py-0.5 font-mono text-[10px] font-bold ${stock.cls}`}>
            {stock.label} ({product.stockQty})
          </span>
        </div>

        {/* Main 2-column detail stage */}
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Left optical stage */}
          <div className="lg:col-span-5">
            <div className="lantern-card chamfer-md group relative aspect-square overflow-hidden border border-red-600/55 bg-[#050204]">
              <AnimatedProductVisual
                productId={product.id}
                category={product.category}
                src={product.image}
                alt={product.nameVi}
                kanjiMark={product.kanjiMark}
                sizes="(max-width: 1024px) 100vw, 42vw"
                variant="modal"
              />
              <div className="absolute top-3.5 left-3.5 z-20">
                <span className="chamfer-sm border border-red-500/75 bg-[#1b0509]/92 px-3 py-1 font-mono text-[11px] font-bold tracking-wider text-red-200">
                  {product.badgeText}
                </span>
              </div>
              <div className="pointer-events-none absolute right-4 bottom-4 left-4 z-20 flex items-end justify-between gap-2">
                <div>
                  <p className="font-jp text-base font-bold text-amber-300">{product.nameJp}</p>
                  <p className="font-mono text-xs text-zinc-300">OEM: {product.oemRef}</p>
                </div>
                <span className="border border-white/15 bg-black/85 px-2 py-0.5 font-mono text-[11px] text-zinc-200">
                  {product.sku}
                </span>
              </div>
            </div>

            {/* Service Commitments */}
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div className="border border-red-900/45 bg-[#0d0508] p-3">
                <p className="flex items-center gap-1.5 font-bold text-emerald-300">
                  <ShieldCheck className="h-4 w-4" />
                  <span>BH {product.specs.warrantyMonths} tháng</span>
                </p>
                <p className="mt-1 text-[11px] text-zinc-400">Lỗi 1 đổi 1 điện tử toàn quốc.</p>
              </div>
              <div className="border border-red-900/45 bg-[#0d0508] p-3">
                <p className="flex items-center gap-1.5 font-bold text-amber-300">
                  <Wrench className="h-4 w-4" />
                  <span>Kiểm giắc zin</span>
                </p>
                <p className="mt-1 text-[11px] text-zinc-400">Ship kèm pat / giắc đúng đời xe.</p>
              </div>
            </div>
          </div>

          {/* Right spec & buy box */}
          <div className="lg:col-span-7">
            <div className="yokocho-panel chamfer-md p-6 sm:p-8">
              <span className="font-mono text-xs font-bold tracking-[0.18em] text-[#ff4d5e] uppercase">
                {product.brand} {"//"} {product.category}
              </span>
              <h1 className="font-display mt-1.5 text-2xl leading-tight font-bold tracking-tight text-white sm:text-3xl">
                {product.nameVi}
              </h1>

              <div className="mt-4 flex flex-wrap items-baseline gap-3 border-b border-red-900/45 pb-5">
                <span className="font-mono text-3xl font-bold text-[#ff4d5e]">
                  {formatVnd(product.priceVnd)}
                </span>
                {product.originalPriceVnd && (
                  <span className="font-mono text-base text-zinc-500 line-through">
                    {formatVnd(product.originalPriceVnd)}
                  </span>
                )}
                {product.priceVnd >= 3_000_000 && (
                  <span className="border border-emerald-600/60 bg-emerald-950/60 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
                    FREESHIP TOÀN QUỐC
                  </span>
                )}
              </div>

              <p className="mt-4 text-sm leading-relaxed text-zinc-200">{product.summaryVi}</p>

              {/* Highlights */}
              <ul className="mt-5 space-y-2">
                {product.highlights.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-xs text-zinc-200 sm:text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#ff4d5e]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {/* Variant & Quantity */}
              <div className="mt-6 grid gap-4 border-t border-red-900/45 pt-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-bold text-zinc-300">Chọn phiên bản / Nhiệt màu:</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {kelvinOptions.map((k) => {
                      const active = selectedKelvin === k;
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setSelectedKelvin(k)}
                          className={`chamfer-sm cursor-pointer border px-3 py-1.5 font-mono text-xs font-semibold transition ${
                            active
                              ? "border-red-400 bg-[#e11d2e] text-white shadow-[0_0_16px_rgba(225,29,46,0.5)]"
                              : "border-red-900/50 bg-[#140a0e] text-zinc-300 hover:border-red-500"
                          }`}
                        >
                          {k}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-zinc-300">Số lượng (bộ / chiếc):</p>
                  <div className="mt-2 inline-flex items-center border border-red-900/60 bg-[#0d0508]">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="cursor-pointer px-3 py-2 text-zinc-300 hover:bg-red-950/60 hover:text-white"
                      aria-label="Giảm số lượng"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="min-w-10 text-center font-mono text-sm font-bold text-white">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                      className="cursor-pointer px-3 py-2 text-zinc-300 hover:bg-red-950/60 hover:text-white"
                      aria-label="Tăng số lượng"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleAddCurrent(true)}
                  className="chamfer-sm inline-flex flex-1 cursor-pointer items-center justify-center gap-2 bg-gradient-to-r from-[#b91c1c] to-[#ff2e43] px-6 py-3.5 text-sm font-bold text-white shadow-[0_0_28px_rgba(225,29,46,0.55)] transition hover:brightness-115"
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span>Thêm Vào Giỏ &amp; Thanh Toán ({formatVnd(product.priceVnd * quantity)})</span>
                </button>
              </div>

              {/* Technical Spec Table */}
              <div className="mt-7 border border-red-900/45 bg-[#080305] p-4 text-xs">
                <p className="mb-3 flex items-center gap-2 text-[11px] font-bold tracking-wider text-red-400 uppercase">
                  <Zap className="h-3.5 w-3.5 text-amber-400" />
                  <span className="font-jp">仕様明細</span>
                  <span className="font-mono">{"//"} Thông Số Kỹ Thuật Chi Tiết</span>
                </p>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-2.5 sm:grid-cols-4">
                  <div>
                    <dt className="text-zinc-500">Công suất</dt>
                    <dd className="mt-0.5 font-mono font-bold text-white">
                      {product.specs.wattage ?? product.specs.voltage ?? "Tiêu chuẩn"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Quang thông</dt>
                    <dd className="mt-0.5 font-mono font-bold text-amber-300">
                      {product.specs.lumens ?? "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Chân / Tiêu chuẩn</dt>
                    <dd className="mt-0.5 font-mono text-zinc-100">
                      {product.specs.socket ?? product.specs.origin}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Bảo hành</dt>
                    <dd className="mt-0.5 font-mono font-bold text-emerald-300">
                      {product.specs.warrantyMonths} tháng
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Vehicle Compatibility */}
              <div className="mt-5">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-zinc-300">
                  <CarFront className="h-4 w-4 text-amber-400" />
                  <span>Các hãng xe tương thích chuẩn giắc:</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.compatibleVehicles.map((v) => (
                    <span
                      key={v}
                      className="border border-zinc-800 bg-[#0d070a] px-2.5 py-1 font-mono text-xs text-zinc-200"
                    >
                      {v}
                    </span>
                  ))}
                </div>
              </div>

              {/* Simulated Night Rain Beam Preview */}
              <div className="mt-6 border border-red-800/50 bg-[#080305] p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                    <Eye className="h-4 w-4 text-[#ff4d5e]" />
                    <span>Mô Phỏng Tia Sáng Ban Đêm ({selectedKelvin})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setBeamPreviewMode("low")}
                      className={`cursor-pointer border px-2.5 py-1 font-mono text-[10px] font-bold transition ${
                        beamPreviewMode === "low"
                          ? "border-amber-400 bg-amber-500/20 text-amber-200"
                          : "border-zinc-800 bg-black text-zinc-400 hover:border-red-500"
                      }`}
                    >
                      CỐT Z-CUTOFF
                    </button>
                    <button
                      type="button"
                      onClick={() => setBeamPreviewMode("high")}
                      className={`cursor-pointer border px-2.5 py-1 font-mono text-[10px] font-bold transition ${
                        beamPreviewMode === "high"
                          ? "border-red-400 bg-[#e11d2e] text-white"
                          : "border-zinc-800 bg-black text-zinc-400 hover:border-red-500"
                      }`}
                    >
                      ĐÁ PHA LASER
                    </button>
                  </div>
                </div>
                <div className="relative h-44 w-full overflow-hidden border border-red-900/45 bg-black">
                  <Image
                    src="/images/alley-beam-stage.jpg"
                    alt="Con hẻm đêm mưa thử tia đèn"
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover object-center opacity-70"
                  />
                  <MidnightRainCanvas
                    intensity="simulator"
                    beamMode={inferBeamMode(selectedKelvin)}
                    highBeam={beamPreviewMode === "high"}
                  />
                  <div className="pointer-events-none absolute right-3 bottom-2.5 left-3 z-20 flex items-center justify-between font-mono text-[10px] text-zinc-200">
                    <span className="border border-white/15 bg-black/75 px-2 py-0.5">
                      {beamPreviewMode === "high" ? "HIGH BEAM // LASER BOOST" : "LOW BEAM // Z-STEP"}
                    </span>
                    <span className="border border-red-500/40 bg-black/75 px-2 py-0.5 text-amber-300">
                      {selectedKelvin}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Verified Customer Reviews & Real Car Photos */}
        <div className="-mx-4 mt-14 border-t border-red-900/45 sm:-mx-6 lg:-mx-8">
          <CustomerReviewsSection
            initialReviews={reviews}
            products={[product]}
            fixedProduct={product}
            apiConnected={apiConnected}
          />
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <section className="mt-16 border-t border-red-900/45 pt-10">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <p className="font-mono text-xs font-bold tracking-[0.16em] text-[#ff4d5e] uppercase">
                  関連部品 {"//"} Phối Ghép Đề Xuất
                </p>
                <h2 className="font-display mt-1 text-2xl font-bold text-white">
                  Phụ Tùng Thường Đi Kèm
                </h2>
              </div>
              <Link href="/#catalog" className="text-xs font-bold text-amber-300 hover:underline">
                Xem tất cả sản phẩm →
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item, idx) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  index={idx}
                  onSelect={(p) => setModalProduct(p)}
                  onQuickAdd={(p) => {
                    addProductsToStoredCart([{ product: p }]);
                    setCartOpen(true);
                  }}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />

      <ProductModal
        product={modalProduct}
        onClose={() => setModalProduct(null)}
        onAddToCart={(p, k) => {
          addProductsToStoredCart([{ product: p, selectedKelvin: k }]);
          setCartOpen(true);
        }}
      />

      <CartDrawer
        open={cartOpen}
        items={cart}
        onClose={() => setCartOpen(false)}
        onUpdateQty={updateStoredCartQty}
        onRemove={removeStoredCartItem}
        onClearCart={clearStoredCart}
        onOrderCreated={() => undefined}
        onJumpToLookup={() => {
          router.push("/#order-lookup");
        }}
      />
    </div>
  );
}

