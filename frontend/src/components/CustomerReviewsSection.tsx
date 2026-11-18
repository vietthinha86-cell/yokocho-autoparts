"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Camera,
  CheckCircle2,
  ImagePlus,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { submitCustomerReview } from "@/lib/api";
import { compressImageFileToDataUrl } from "@/lib/imageUtils";
import { useCustomerSession } from "@/lib/useCustomerSession";
import type {
  AutoPartProduct,
  BeamModeChoice,
  ProductReviewRecord,
} from "@/types/autoparts";

interface CustomerReviewsSectionProps {
  initialReviews: ProductReviewRecord[];
  products: AutoPartProduct[];
  fixedProduct?: AutoPartProduct;
  apiConnected: boolean;
}

const BEAM_OPTIONS: Array<{ value: BeamModeChoice; label: string }> = [
  { value: "3000k", label: "3000K Phá Sương" },
  { value: "4300k", label: "4300K Nắng Ấm" },
  { value: "6000k", label: "6000K Trắng Mát" },
  { value: "combo", label: "Combo Đa Tầng" },
];

function RatingStars({ value, size = "sm" }: { value: number; size?: "sm" | "md" }) {
  const iconCls = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-400" aria-label={`${value} sao`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${iconCls} ${
            star <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-zinc-600"
          }`}
        />
      ))}
    </span>
  );
}

export function CustomerReviewsSection({
  initialReviews,
  products,
  fixedProduct,
  apiConnected,
}: CustomerReviewsSectionProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [reviews] = useState<ProductReviewRecord[]>(initialReviews);
  const [onlyWithPhoto, setOnlyWithPhoto] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [lightboxReview, setLightboxReview] = useState<ProductReviewRecord | null>(null);

  const { customer, orders } = useCustomerSession();
  const [selectedProductId, setSelectedProductId] = useState(
    fixedProduct?.id ?? products[0]?.id ?? "",
  );
  const [draftCustomerName, setDraftCustomerName] = useState<string | null>(null);
  const [draftVehicleInfo, setDraftVehicleInfo] = useState<string | null>(null);
  const [draftOrderCode, setDraftOrderCode] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [beamMode, setBeamMode] = useState<BeamModeChoice>("4300k");
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const defaultGarageCar = customer?.garageVehicles?.[0]
    ? `${customer.garageVehicles[0].make} ${customer.garageVehicles[0].model} ${customer.garageVehicles[0].year}`.trim()
    : "";
  const effectiveCustomerName = draftCustomerName ?? customer?.fullName ?? "";
  const effectiveVehicleInfo = draftVehicleInfo ?? defaultGarageCar;
  const effectiveOrderCode = draftOrderCode ?? orders[0]?.orderCode ?? "";

  const productLookup = useMemo(() => {
    const map = new Map<string, AutoPartProduct>();
    for (const p of products) {
      map.set(p.id, p);
    }
    return map;
  }, [products]);

  const displayedReviews = useMemo(() => {
    return onlyWithPhoto ? reviews.filter((r) => Boolean(r.photoUrl)) : reviews;
  }, [onlyWithPhoto, reviews]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 5.0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return Number((sum / reviews.length).toFixed(1));
  }, [reviews]);

  const verifiedCount = useMemo(
    () => reviews.filter((r) => r.verifiedPurchase).length,
    [reviews],
  );

  async function handlePhotoPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFileToDataUrl(file, 900, 0.8);
      setPhotoPreview(compressed.dataUrl);
    } finally {
      e.target.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitMessage(null);

    const targetProductId = fixedProduct?.id ?? selectedProductId;
    const res = await submitCustomerReview({
      productId: targetProductId,
      customerName: effectiveCustomerName.trim(),
      vehicleInfo: effectiveVehicleInfo.trim(),
      rating,
      title: title.trim() || undefined,
      comment: comment.trim(),
      beamMode,
      orderCode: effectiveOrderCode.trim() || undefined,
      photoUrl: photoPreview,
    });

    setSubmitting(false);

    if (!res.ok) {
      setSubmitMessage({
        type: "error",
        text: res.error ?? "Không gửi được đánh giá, vui lòng kiểm tra lại.",
      });
      return;
    }

    setDraftCustomerName(null);
    setDraftVehicleInfo(null);
    setDraftOrderCode(null);
    setTitle("");
    setComment("");
    setPhotoPreview(undefined);
    setRating(5);
    setSubmitMessage({
      type: "success",
      text: "Đã nhận đánh giá & ảnh xe của bạn! Nội dung sẽ hiển thị công khai ngay sau khi chủ xưởng AKARI kiểm duyệt.",
    });
  }

  return (
    <section
      id="reviews"
      className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
    >
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-red-800/45 pb-6 md:flex-row md:items-end">
        <div>
          <p className="flex items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.2em] text-[#ff4d5e] uppercase">
            <span>ẢNH XE LẮP THỰC TẾ &amp; ĐÁNH GIÁ</span>
            <span className="font-jp text-zinc-500">実車レビュー</span>
          </p>
          <h2 className="font-display mt-1.5 text-2xl leading-[1.2] font-bold tracking-[-0.02em] text-[#f3ede8] sm:text-3xl">
            {fixedProduct
              ? `Khách Đã Lắp ${fixedProduct.nameVi}`
              : "Khách Hàng Đã Lên Đèn Tại Xưởng"}
          </h2>
          <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 border border-amber-500/60 bg-amber-950/50 px-2.5 py-1 font-mono font-bold text-amber-300">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span>{averageRating.toFixed(1)} / 5.0</span>
            </span>
            <span className="text-zinc-300">
              {reviews.length} đánh giá đã duyệt •{" "}
              <strong className="text-emerald-300">{verifiedCount} xác thực đơn hàng</strong>
            </span>
            {!apiConnected && (
              <span className="border border-zinc-700 bg-zinc-900/70 px-2 py-0.5 font-mono text-[10px] text-zinc-400">
                PREVIEW DATA
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setOnlyWithPhoto((prev) => !prev)}
            className={`chamfer-sm inline-flex cursor-pointer items-center gap-1.5 border px-3.5 py-2 text-xs font-semibold transition ${
              onlyWithPhoto
                ? "border-amber-400 bg-amber-500/20 text-amber-200"
                : "border-red-900/55 bg-[#12070b] text-zinc-300 hover:border-red-500"
            }`}
          >
            <Camera className="h-3.5 w-3.5 text-amber-300" />
            <span>Chỉ Xem Có Ảnh Xe</span>
          </button>

          <button
            type="button"
            onClick={() => setFormOpen((prev) => !prev)}
            className="chamfer-sm inline-flex cursor-pointer items-center gap-1.5 bg-gradient-to-r from-[#b91c1c] to-[#ff2e43] px-4 py-2 text-xs font-bold text-white shadow-[0_0_20px_rgba(225,29,46,0.45)] transition hover:brightness-115"
          >
            <ImagePlus className="h-3.5 w-3.5" />
            <span>{formOpen ? "Đóng Form Gửi Ảnh" : "Gửi Ảnh Xe & Đánh Giá"}</span>
          </button>
        </div>
      </div>

      {/* Customer Submission Form */}
      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="yokocho-panel chamfer-md mb-8 grid gap-4 border border-red-600/55 p-5 text-xs sm:grid-cols-2 lg:p-6"
        >
          <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-2 border-b border-red-900/45 pb-3">
            <div>
              <h3 className="font-display text-base font-bold text-white">
                Chia Sẻ Ảnh Xe Sau Khi Lên Đèn
              </h3>
              <p className="mt-0.5 text-[11px] text-zinc-400">
                Nhập mã đơn <span className="font-mono text-amber-300">YKC-...</span> (nếu có) để tự gắn nhãn{" "}
                <strong className="text-emerald-300">Đã Mua Hàng</strong>. Bài gửi sẽ qua kiểm duyệt tại xưởng trước khi lên web.
              </p>
            </div>
            <span className="font-mono text-[10px] text-red-300">MODERATED BY GARAGE</span>
          </div>

          {!fixedProduct && (
            <div className="sm:col-span-2">
              <label className="mb-1 block font-bold text-zinc-300">
                Sản phẩm đã lắp *
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                required
                className="w-full border border-red-900/60 bg-[#050204] px-3 py-2 text-white focus:border-red-500 focus:outline-none"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nameVi} ({p.sku})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1 block font-bold text-zinc-300">Tên của bạn *</label>
            <input
              value={effectiveCustomerName}
              onChange={(e) => setDraftCustomerName(e.target.value)}
              placeholder="VD: Minh Quân"
              required
              className="w-full border border-red-900/60 bg-[#050204] px-3 py-2 text-white placeholder:text-zinc-500 focus:border-red-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block font-bold text-zinc-300">Dòng xe &amp; Đời xe *</label>
            <input
              value={effectiveVehicleInfo}
              onChange={(e) => setDraftVehicleInfo(e.target.value)}
              placeholder="VD: Honda City RS 2022"
              required
              className="w-full border border-red-900/60 bg-[#050204] px-3 py-2 text-white placeholder:text-zinc-500 focus:border-red-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block font-bold text-zinc-300">
              Mã đơn hàng (tuỳ chọn để xác thực)
            </label>
            <input
              value={effectiveOrderCode}
              onChange={(e) => setDraftOrderCode(e.target.value)}
              placeholder="VD: YKC-8421-X9A2"
              className="w-full border border-red-900/60 bg-[#050204] px-3 py-2 font-mono text-white placeholder:text-zinc-500 focus:border-red-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block font-bold text-zinc-300">Chế độ nhiệt màu / Combo</label>
            <div className="flex flex-wrap gap-1.5">
              {BEAM_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setBeamMode(opt.value)}
                  className={`cursor-pointer border px-2.5 py-1.5 font-mono text-[11px] font-semibold transition ${
                    beamMode === opt.value
                      ? "border-amber-400 bg-amber-500/20 text-amber-200"
                      : "border-red-900/50 bg-[#0d0508] text-zinc-400 hover:border-red-500"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block font-bold text-zinc-300">Chấm điểm sao *</label>
            <div className="flex items-center gap-1.5 py-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="cursor-pointer p-0.5 transition hover:scale-110"
                  aria-label={`Chọn ${star} sao`}
                >
                  <Star
                    className={`h-5 w-5 ${
                      star <= rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-zinc-600"
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 font-mono text-xs font-bold text-amber-300">
                {rating}/5 sao
              </span>
            </div>
          </div>

          <div>
            <label className="mb-1 block font-bold text-zinc-300">
              Tiêu đề ngắn đánh giá
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Cắt Z-Step sắc nét, đi mưa yên tâm hẳn"
              className="w-full border border-red-900/60 bg-[#050204] px-3 py-2 text-white placeholder:text-zinc-500 focus:border-red-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block font-bold text-zinc-300">
              Cảm nhận thực tế (tối thiểu 8 ký tự) *
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              required
              minLength={8}
              placeholder="Chia sẻ độ sáng ban đêm, khả năng bám đường khi mưa, giắc cắm hoặc góc cắt chống chói..."
              className="w-full border border-red-900/60 bg-[#050204] px-3 py-2 text-white placeholder:text-zinc-500 focus:border-red-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-4 border border-red-900/40 bg-[#080305] p-3">
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoPick}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="chamfer-sm inline-flex cursor-pointer items-center gap-1.5 border border-amber-500/60 bg-amber-950/35 px-3 py-2 font-semibold text-amber-200 hover:border-amber-400"
              >
                <Camera className="h-3.5 w-3.5" />
                <span>{photoPreview ? "Đổi Ảnh Xe Thực Tế" : "Tải Ảnh Xe Lắp Đèn"}</span>
              </button>
              {photoPreview ? (
                <div className="flex items-center gap-2">
                  <Image
                    src={photoPreview}
                    alt="Xem trước ảnh xe đánh giá"
                    width={48}
                    height={36}
                    unoptimized
                    className="h-9 w-12 border border-red-700/60 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setPhotoPreview(undefined)}
                    className="cursor-pointer text-[11px] text-red-400 hover:underline"
                  >
                    Gỡ ảnh
                  </button>
                </div>
              ) : (
                <span className="text-[11px] text-zinc-500">
                  Ảnh sẽ tự nén nhẹ (JPEG) trước khi gửi.
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="chamfer-sm inline-flex cursor-pointer items-center gap-1.5 bg-[#e11d2e] px-5 py-2.5 text-xs font-bold text-white shadow-[0_0_20px_rgba(225,29,46,0.45)] transition hover:bg-[#ff2e43] disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{submitting ? "Đang gửi..." : "Gửi Đánh Giá Lên Xưởng"}</span>
            </button>
          </div>

          {submitMessage && (
            <div
              className={`sm:col-span-2 border p-3 text-xs ${
                submitMessage.type === "success"
                  ? "border-emerald-600/70 bg-emerald-950/60 text-emerald-200"
                  : "border-red-600/70 bg-red-950/60 text-red-200"
              }`}
            >
              {submitMessage.text}
            </div>
          )}
        </form>
      )}

      {/* Approved Reviews Grid */}
      {displayedReviews.length === 0 ? (
        <div className="yokocho-panel chamfer-md p-10 text-center text-xs text-zinc-400">
          Chưa có đánh giá công khai phù hợp cho mục này — hãy là chủ xe đầu tiên gửi ảnh lên đèn nhé!
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {displayedReviews.map((review) => {
            const linkedProduct = productLookup.get(review.productId);
            return (
              <article
                key={review.id}
                className="lantern-card chamfer-card flex flex-col overflow-hidden"
              >
                {review.photoUrl && (
                  <button
                    type="button"
                    onClick={() => setLightboxReview(review)}
                    className="group relative aspect-[16/10] w-full cursor-pointer overflow-hidden border-b border-red-900/45 bg-black text-left"
                  >
                    <Image
                      src={review.photoUrl}
                      alt={`${review.vehicleInfo} — ${review.title}`}
                      fill
                      unoptimized={!review.photoUrl.startsWith("/")}
                      sizes="(max-width: 768px) 100vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#080305] via-transparent to-black/35" />
                    <div className="absolute top-2.5 right-2.5 left-2.5 flex items-center justify-between gap-2">
                      {review.beamMode && (
                        <span className="border border-amber-400/70 bg-black/80 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300 uppercase">
                          {review.beamMode}
                        </span>
                      )}
                      <span className="border border-white/15 bg-black/75 px-2 py-0.5 font-mono text-[10px] text-zinc-200">
                        Phóng to ảnh
                      </span>
                    </div>
                  </button>
                )}

                <div className="flex flex-1 flex-col justify-between p-4 text-xs">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <RatingStars value={review.rating} />
                      {review.verifiedPurchase && (
                        <span className="inline-flex items-center gap-1 border border-emerald-600/65 bg-emerald-950/60 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>ĐÃ MUA</span>
                        </span>
                      )}
                    </div>

                    <h3 className="font-display mt-2.5 text-sm leading-snug font-bold text-white">
                      {review.title}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-zinc-300">
                      {review.comment}
                    </p>
                  </div>

                  <div className="mt-4 space-y-2 border-t border-red-900/40 pt-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-zinc-100">{review.customerName}</span>
                      <span className="font-mono text-[10px] text-zinc-500">
                        {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                    <p className="flex items-center gap-1.5 font-mono text-[11px] text-amber-300">
                      <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#ff4d5e]" />
                      <span className="truncate">{review.vehicleInfo}</span>
                    </p>
                    {!fixedProduct && linkedProduct && (
                      <Link
                        href={`/san-pham/${linkedProduct.slug}`}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-300 hover:text-white hover:underline"
                      >
                        <Sparkles className="h-3 w-3 text-amber-400" />
                        <span className="truncate">{linkedProduct.nameVi}</span>
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Photo Lightbox Modal */}
      {lightboxReview && lightboxReview.photoUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setLightboxReview(null)}
        >
          <div
            className="yokocho-panel chamfer-md relative w-full max-w-2xl overflow-hidden border border-red-600/70"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxReview(null)}
              className="absolute top-3 right-3 z-20 cursor-pointer border border-red-600/70 bg-black/85 p-1.5 text-white hover:bg-[#e11d2e]"
              aria-label="Đóng ảnh"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative aspect-[16/10] w-full bg-black">
              <Image
                src={lightboxReview.photoUrl}
                alt={lightboxReview.title}
                fill
                unoptimized={!lightboxReview.photoUrl.startsWith("/")}
                sizes="(max-width: 768px) 100vw, 672px"
                className="object-cover"
              />
            </div>

            <div className="space-y-2 p-5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <RatingStars value={lightboxReview.rating} size="md" />
                <span className="font-mono text-amber-300">
                  {lightboxReview.customerName} • {lightboxReview.vehicleInfo}
                </span>
              </div>
              <h4 className="font-display text-base font-bold text-white">
                {lightboxReview.title}
              </h4>
              <p className="leading-relaxed text-zinc-300">{lightboxReview.comment}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

