"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  BellRing,
  Bot,
  Box,
  Camera,
  CheckCircle2,
  ClipboardList,
  Cpu,
  Database,
  EyeOff,
  LogOut,
  MessageSquareQuote,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { formatVnd } from "@/lib/api";
import {
  clearStoredAdminToken,
  createAdminProduct,
  deleteAdminProduct,
  deleteAdminReview,
  fetchAdminAiConfig,
  fetchAdminReviews,
  fetchAdminSession,
  getStoredAdminToken,
  requestAdminAiDraft,
  saveAdminAiConfig,
  signAdminMediaUpload,
  testAdminAiConnection,
  updateAdminOrderStatus,
  updateAdminProduct,
  updateAdminReviewStatus,
} from "@/lib/adminApi";
import type {
  AdminAiConfigResponse,
  AdminOverviewResponse,
  AdminProfile,
  AdminReviewsResponse,
  AiModePreference,
  AiProviderId,
  AutoPartProduct,
  OrderRecord,
  PartCategory,
  ProductReviewRecord,
  ReviewStatus,
  StockStatus,
} from "@/types/autoparts";

type AdminTab = "orders" | "inventory" | "create" | "logs" | "reviews" | "ai";

const ORDER_STATUS_LABELS: Array<{ value: OrderRecord["status"]; label: string }> = [
  { value: "pending_confirm", label: "Chờ xác nhận giắc" },
  { value: "packed", label: "Đã đóng gói" },
  { value: "shipping", label: "Đang vận chuyển" },
  { value: "completed", label: "Hoàn tất" },
];

export function AdminDashboardClient() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [products, setProducts] = useState<AutoPartProduct[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [reviews, setReviews] = useState<ProductReviewRecord[]>([]);
  const [reviewCounts, setReviewCounts] = useState<AdminReviewsResponse["counts"]>({
    all: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [reviewFilter, setReviewFilter] = useState<ReviewStatus | "all">("all");
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [reviewZoomUrl, setReviewZoomUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>("orders");
  const [toast, setToast] = useState<string | null>(null);

  // Per-row quick draft edits for inventory table
  const [draftPrices, setDraftPrices] = useState<Record<string, number>>({});
  const [draftQty, setDraftQty] = useState<Record<string, number>>({});
  const [draftStockStatus, setDraftStockStatus] = useState<Record<string, StockStatus>>({});

  // Create Product + Signed Upload state
  const [newNameVi, setNewNameVi] = useState("");
  const [newNameJp, setNewNameJp] = useState("赤灯特製");
  const [newKanji, setNewKanji] = useState("光");
  const [newSku, setNewSku] = useState("");
  const [newBrand, setNewBrand] = useState("Akari Yokocho");
  const [newCategory, setNewCategory] = useState<PartCategory>("bi-led");
  const [newPriceVnd, setNewPriceVnd] = useState(2850000);
  const [newStockQty, setNewStockQty] = useState(8);
  const [newOemRef, setNewOemRef] = useState("JDM-PRO-01");
  const [newKelvin, setNewKelvin] = useState("4300K, 6000K");
  const [newWattage, setNewWattage] = useState("65W Cos / 80W Pha");
  const [newSummaryVi, setNewSummaryVi] = useState("");
  const [newHighlights, setNewHighlights] = useState<string[]>([]);
  const [newCompatVehicles, setNewCompatVehicles] = useState<string[]>([
    "Toyota",
    "Honda",
    "Mazda",
  ]);
  const [newImage, setNewImage] = useState("/images/biled-projector.jpg");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [mediaFileName, setMediaFileName] = useState("new-biled-lens.webp");
  const [mediaSignResult, setMediaSignResult] = useState<string | null>(null);

  // Real AI Engine Configuration state
  const [aiConfig, setAiConfig] = useState<AdminAiConfigResponse | null>(null);
  const [aiProviderMode, setAiProviderMode] = useState<AiModePreference>("auto");
  const [aiGeminiKeyInput, setAiGeminiKeyInput] = useState("");
  const [aiGeminiModelInput, setAiGeminiModelInput] = useState("gemini-2.5-flash");
  const [aiOpenaiKeyInput, setAiOpenaiKeyInput] = useState("");
  const [aiOpenaiBaseUrlInput, setAiOpenaiBaseUrlInput] = useState("https://api.openai.com/v1");
  const [aiOpenaiModelInput, setAiOpenaiModelInput] = useState("gpt-4o-mini");
  const [aiOllamaUrlInput, setAiOllamaUrlInput] = useState("http://127.0.0.1:11434");
  const [aiOllamaModelInput, setAiOllamaModelInput] = useState("");
  const [aiOllamaVisionModelInput, setAiOllamaVisionModelInput] = useState("");
  const [aiSavingConfig, setAiSavingConfig] = useState(false);
  const [aiTesting, setAiTesting] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{
    ok: boolean;
    provider?: AiProviderId;
    model?: string;
    latencyMs?: number;
    reply?: string;
    error?: string;
  } | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  const applyAiConfigState = useCallback((cfg: AdminAiConfigResponse) => {
    setAiConfig(cfg);
    setAiProviderMode(cfg.modePreference);
    setAiGeminiModelInput(cfg.geminiModel);
    setAiOpenaiBaseUrlInput(cfg.openaiBaseUrl);
    setAiOpenaiModelInput(cfg.openaiModel);
    setAiOllamaUrlInput(cfg.ollamaBaseUrl);
    setAiOllamaModelInput(cfg.ollamaModel);
    setAiOllamaVisionModelInput(cfg.ollamaVisionModel);
  }, []);

  const refreshData = useCallback(
    async (activeToken: string) => {
      const [res, aiRes, revRes] = await Promise.all([
        fetchAdminSession(activeToken),
        fetchAdminAiConfig(activeToken),
        fetchAdminReviews(activeToken, "all"),
      ]);
      if (res.unauthorized) {
        clearStoredAdminToken();
        router.replace("/admin/login");
        return;
      }
      if (res.ok && res.admin && res.overview && res.products && res.orders) {
        setToken(activeToken);
        setAdmin(res.admin);
        setOverview(res.overview);
        setProducts(res.products);
        setOrders(res.orders);
      }
      if (aiRes.ok && aiRes.item) {
        applyAiConfigState(aiRes.item);
      }
      if (revRes.ok && revRes.data) {
        setReviews(revRes.data.items);
        setReviewCounts(revRes.data.counts);
      }
      setLoading(false);
    },
    [applyAiConfigState, router],
  );

  useEffect(() => {
    const stored = getStoredAdminToken();
    if (!stored) {
      router.replace("/admin/login");
      return;
    }
    let cancelled = false;
    Promise.all([
      fetchAdminSession(stored),
      fetchAdminAiConfig(stored),
      fetchAdminReviews(stored, "all"),
    ]).then(([res, aiRes, revRes]) => {
      if (cancelled) return;
      if (res.unauthorized || !res.ok) {
        clearStoredAdminToken();
        router.replace("/admin/login");
        return;
      }
      if (res.admin && res.overview && res.products && res.orders) {
        setToken(stored);
        setAdmin(res.admin);
        setOverview(res.overview);
        setProducts(res.products);
        setOrders(res.orders);
      }
      if (aiRes.ok && aiRes.item) {
        applyAiConfigState(aiRes.item);
      }
      if (revRes.ok && revRes.data) {
        setReviews(revRes.data.items);
        setReviewCounts(revRes.data.counts);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [applyAiConfigState, router]);

  async function handleSaveAiSettings(e: React.FormEvent, clearKey?: "gemini" | "openai") {
    e.preventDefault();
    if (!token) return;
    setAiSavingConfig(true);
    const res = await saveAdminAiConfig(token, {
      aiProvider: aiProviderMode,
      geminiApiKey: aiGeminiKeyInput.trim() || undefined,
      clearGeminiKey: clearKey === "gemini",
      geminiModel: aiGeminiModelInput.trim() || "gemini-2.5-flash",
      openaiApiKey: aiOpenaiKeyInput.trim() || undefined,
      clearOpenaiKey: clearKey === "openai",
      openaiBaseUrl: aiOpenaiBaseUrlInput.trim() || undefined,
      openaiModel: aiOpenaiModelInput.trim() || undefined,
      ollamaBaseUrl: aiOllamaUrlInput.trim() || undefined,
      ollamaModel: aiOllamaModelInput.trim(),
      ollamaVisionModel: aiOllamaVisionModelInput.trim(),
    });
    setAiSavingConfig(false);
    if (!res.ok || !res.item) {
      showToast(res.error ?? "Không lưu được cấu hình AI.");
      return;
    }
    applyAiConfigState(res.item);
    setAiGeminiKeyInput("");
    setAiOpenaiKeyInput("");
    showToast("Đã lưu cấu hình AI vào backend/.env và kích hoạt ngay!");
  }

  async function handleTestAiNow() {
    if (!token) return;
    setAiTesting(true);
    const result = await testAdminAiConnection(token);
    setAiTesting(false);
    setAiTestResult(result);
    const cfgRes = await fetchAdminAiConfig(token);
    if (cfgRes.ok && cfgRes.item) {
      applyAiConfigState(cfgRes.item);
    }
    showToast(
      result.ok
        ? `AI thật phản hồi thành công (${result.provider} • ${result.latencyMs}ms)!`
        : "Kết nối AI chưa thành công — kiểm tra chi tiết bên dưới.",
    );
  }

  async function handleOrderStatusChange(orderCode: string, nextStatus: OrderRecord["status"]) {
    if (!token) return;
    const res = await updateAdminOrderStatus(token, orderCode, nextStatus);
    if (!res.ok) {
      showToast(res.error ?? "Cập nhật thất bại.");
      return;
    }
    await refreshData(token);
    showToast(`Đã cập nhật ${orderCode} → ${nextStatus}`);
  }

  async function handleUpdateReviewStatus(reviewId: string, nextStatus: ReviewStatus) {
    if (!token) return;
    const adminNote = reviewNotes[reviewId]?.trim() || undefined;
    const res = await updateAdminReviewStatus(token, reviewId, nextStatus, adminNote);
    if (!res.ok) {
      showToast(res.error ?? "Cập nhật kiểm duyệt đánh giá thất bại.");
      return;
    }
    await refreshData(token);
    showToast(
      nextStatus === "approved"
        ? "Đã duyệt đánh giá & ảnh xe lên trang công khai!"
        : "Đã ẩn / từ chối đánh giá khỏi trang công khai.",
    );
  }

  async function handleDeleteReview(reviewId: string) {
    if (!token) return;
    const res = await deleteAdminReview(token, reviewId);
    if (!res.ok) {
      showToast(res.error ?? "Xóa đánh giá thất bại.");
      return;
    }
    await refreshData(token);
    showToast("Đã xóa đánh giá khỏi hệ thống.");
  }

  async function handleSaveProduct(product: AutoPartProduct) {
    if (!token) return;
    const nextPrice = draftPrices[product.id] ?? product.priceVnd;
    const nextQty = draftQty[product.id] ?? product.stockQty;
    const nextStatus = draftStockStatus[product.id] ?? product.stockStatus;

    const res = await updateAdminProduct(token, product.id, {
      priceVnd: nextPrice,
      stockQty: nextQty,
      stockStatus: nextStatus,
      reason: "Điều chỉnh trực tiếp trên Admin Dashboard",
    });

    if (!res.ok) {
      showToast(res.error ?? "Không thể lưu thay đổi.");
      return;
    }
    await refreshData(token);
    showToast(`Đã lưu ${product.sku}`);
  }

  async function handleDeleteProduct(product: AutoPartProduct) {
    if (!token) return;
    const res = await deleteAdminProduct(token, product.id);
    if (!res.ok) {
      showToast(res.error ?? "Xóa thất bại.");
      return;
    }
    await refreshData(token);
    showToast(`Đã xóa ${product.sku}`);
  }

  async function handleAiGenerateDraft() {
    if (!token) return;
    if (!newNameVi.trim()) {
      showToast("Nhập tên phụ tùng tiếng Việt trước để AI tạo thông số!");
      return;
    }
    setAiGenerating(true);
    const res = await requestAdminAiDraft(token, {
      nameVi: newNameVi.trim(),
      category: newCategory,
      wattage: newWattage.trim() || undefined,
      priceVnd: Number(newPriceVnd) || undefined,
    });
    setAiGenerating(false);
    if (!res.ok || !res.item) {
      showToast(res.error ?? "Không thể tạo dữ liệu AI.");
      return;
    }
    const draft = res.item;
    setNewSku(draft.skuSuggestion);
    setNewNameJp(draft.nameJp);
    setNewKanji(draft.kanjiMark);
    setNewOemRef(draft.oemRef);
    if (draft.specs.wattage) {
      setNewWattage(draft.specs.wattage);
    }
    if (draft.specs.kelvin?.length) {
      setNewKelvin(draft.specs.kelvin.join(", "));
    }
    setNewSummaryVi(draft.summaryVi);
    setNewHighlights(draft.highlights);
    setNewCompatVehicles(draft.compatibleVehicles);
    showToast("AI đã tự điền SKU, tên tiếng Nhật, mô tả & xe tương thích!");
  }

  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    const res = await createAdminProduct(token, {
      nameVi: newNameVi,
      nameJp: newNameJp.trim() || "赤灯特製",
      kanjiMark: newKanji.trim() || "光",
      sku: newSku,
      brand: newBrand,
      category: newCategory,
      priceVnd: Number(newPriceVnd),
      stockQty: Number(newStockQty),
      oemRef: newOemRef,
      summaryVi: newSummaryVi.trim() || undefined,
      highlights: newHighlights.length > 0 ? newHighlights : undefined,
      compatibleVehicles: newCompatVehicles,
      image: newImage,
      specs: {
        wattage: newWattage,
        kelvin: newKelvin
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        socket: "Plug & Play",
        warrantyMonths: 24,
        origin: "Yokocho Spec",
      },
    });
    if (!res.ok) {
      showToast(res.error ?? "Không thể thêm sản phẩm.");
      return;
    }
    setNewNameVi("");
    setNewSku("");
    setNewSummaryVi("");
    setNewHighlights([]);
    await refreshData(token);
    setActiveTab("inventory");
    showToast("Đã thêm phụ tùng mới lên kệ hàng đêm!");
  }

  async function handleSignMedia() {
    if (!token || !mediaFileName.trim()) return;
    const isVideo = /\.(mp4|webm|mov)$/i.test(mediaFileName);
    const res = await signAdminMediaUpload(
      token,
      mediaFileName,
      isVideo ? "video/mp4" : "image/webp",
    );
    if (!res.ok || !res.item) {
      showToast(res.error ?? "Lỗi ký upload.");
      return;
    }
    setNewImage(res.item.publicUrl);
    setMediaSignResult(
      `Provider: ${res.item.provider} • Format chuẩn: ${res.item.optimization.recommendedFormat.toUpperCase()} (tối đa ${res.item.optimization.maxWidthPx}px) → URL: ${res.item.publicUrl}`,
    );
    showToast("Đã cấp chữ ký URL upload & gán vào ô Ảnh!");
  }

  if (loading || !overview || !admin) {
    return (
      <div className="kumiko-grid flex min-h-screen items-center justify-center bg-[#060406] text-xs font-mono text-zinc-300">
        Đang tải bảng điều khiển Phố Đèn Đỏ...
      </div>
    );
  }

  return (
    <div className="kumiko-grid min-h-screen pb-16">
      {/* Admin Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-red-800/50 bg-[#070306]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="chamfer-sm inline-flex items-center gap-1.5 border border-red-900/60 bg-[#14070b] px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:border-red-500"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-amber-300" />
              <span>Storefront</span>
            </Link>
            <div>
              <p className="font-mono text-[10px] font-bold tracking-[0.18em] text-[#ff4d5e] uppercase">
                <span className="font-jp">管理ダッシュボード</span> {"//"} {admin.displayName}
              </p>
              <h1 className="font-display text-base font-bold text-white sm:text-lg">
                AKARI YOKOCHO — Điều Hành Xưởng Đêm
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-xs">
            <span className="inline-flex items-center gap-1.5 border border-emerald-700/60 bg-emerald-950/60 px-2.5 py-1 font-mono text-[10px] font-bold text-emerald-300">
              <Database className="h-3.5 w-3.5" />
              DB: {overview.storageDriver === "postgresql" ? "PostgreSQL (Prisma)" : "JSON Runtime"}
            </span>
            <button
              type="button"
              onClick={() => token && refreshData(token)}
              className="chamfer-sm inline-flex cursor-pointer items-center gap-1 border border-red-800/60 bg-[#14070b] px-3 py-1.5 font-semibold text-zinc-200 hover:border-amber-400"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Làm Mới</span>
            </button>
            <button
              type="button"
              onClick={() => {
                clearStoredAdminToken();
                router.push("/admin/login");
              }}
              className="chamfer-sm inline-flex cursor-pointer items-center gap-1 border border-red-700/70 bg-red-950/50 px-3 py-1.5 font-semibold text-red-200 hover:bg-[#e11d2e] hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Thoát</span>
            </button>
          </div>
        </div>
      </header>

      {toast && (
        <div className="fixed right-5 bottom-5 z-50 border border-amber-400/80 bg-[#16080b]/95 px-4 py-2.5 font-mono text-xs font-bold text-amber-200 shadow-[0_0_24px_rgba(245,158,11,0.35)]">
          {toast}
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        {/* KPI Overview Strip */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="yokocho-panel chamfer-sm p-4">
            <p className="font-mono text-[10px] tracking-wider text-zinc-400 uppercase">
              Tổng Doanh Thu Đơn
            </p>
            <p className="mt-1.5 font-mono text-2xl font-bold text-[#ff4d5e]">
              {formatVnd(overview.stats.totalRevenueVnd)}
            </p>
            <p className="mt-1 text-[11px] text-emerald-300">
              {overview.stats.paidOrders} đơn đã thanh toán VietQR
            </p>
          </div>

          <div className="yokocho-panel chamfer-sm p-4">
            <p className="font-mono text-[10px] tracking-wider text-zinc-400 uppercase">
              Đơn Hàng
            </p>
            <p className="mt-1.5 font-mono text-2xl font-bold text-white">
              {overview.stats.totalOrders}
            </p>
            <p className="mt-1 text-[11px] text-amber-300">
              {overview.stats.pendingOrders} đơn chờ xác nhận giắc
            </p>
          </div>

          <div className="yokocho-panel chamfer-sm p-4">
            <p className="font-mono text-[10px] tracking-wider text-zinc-400 uppercase">
              Mã Phụ Tùng Trên Kệ
            </p>
            <p className="mt-1.5 font-mono text-2xl font-bold text-white">
              {overview.stats.totalProducts}
            </p>
            <p className="mt-1 text-[11px] text-zinc-400">Phụ tùng &amp; Bi-LED JDM</p>
          </div>

          <div className="yokocho-panel chamfer-sm p-4">
            <p className="font-mono text-[10px] tracking-wider text-zinc-400 uppercase">
              Cảnh Báo Tồn / Đặt Nhật
            </p>
            <p className="mt-1.5 font-mono text-2xl font-bold text-amber-300">
              {overview.stats.lowStockProducts}
            </p>
            <p className="mt-1 text-[11px] text-zinc-400">Sản phẩm số lượng ≤ 4 hoặc pre-order</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-6 flex flex-wrap gap-2 border-b border-red-900/45 pb-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`chamfer-sm inline-flex cursor-pointer items-center gap-1.5 border px-4 py-2 transition ${
              activeTab === "orders"
                ? "border-red-400 bg-[#e11d2e] text-white"
                : "border-red-900/50 bg-[#12070b] text-zinc-300 hover:border-red-500"
            }`}
          >
            <ClipboardList className="h-3.5 w-3.5" />
            <span>Đơn Hàng ({orders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("inventory")}
            className={`chamfer-sm inline-flex cursor-pointer items-center gap-1.5 border px-4 py-2 transition ${
              activeTab === "inventory"
                ? "border-red-400 bg-[#e11d2e] text-white"
                : "border-red-900/50 bg-[#12070b] text-zinc-300 hover:border-red-500"
            }`}
          >
            <Box className="h-3.5 w-3.5" />
            <span>Kho &amp; Bảng Giá ({products.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("create")}
            className={`chamfer-sm inline-flex cursor-pointer items-center gap-1.5 border px-4 py-2 transition ${
              activeTab === "create"
                ? "border-red-400 bg-[#e11d2e] text-white"
                : "border-red-900/50 bg-[#12070b] text-zinc-300 hover:border-red-500"
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Thêm Phụ Tùng + Ký Media</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("logs")}
            className={`chamfer-sm inline-flex cursor-pointer items-center gap-1.5 border px-4 py-2 transition ${
              activeTab === "logs"
                ? "border-red-400 bg-[#e11d2e] text-white"
                : "border-red-900/50 bg-[#12070b] text-zinc-300 hover:border-red-500"
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Nhật Ký Kho &amp; Webhook</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("reviews")}
            className={`chamfer-sm inline-flex cursor-pointer items-center gap-1.5 border px-4 py-2 transition ${
              activeTab === "reviews"
                ? "border-red-400 bg-[#e11d2e] text-white"
                : "border-red-900/50 bg-[#12070b] text-zinc-300 hover:border-red-500"
            }`}
          >
            <MessageSquareQuote className="h-3.5 w-3.5" />
            <span>Đánh Giá Xe ({reviewCounts.all})</span>
            {reviewCounts.pending > 0 && (
              <span className="ml-1 rounded-full bg-amber-400 px-1.5 py-0.5 font-mono text-[10px] font-black text-black">
                {reviewCounts.pending} chờ
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ai")}
            className={`chamfer-sm inline-flex cursor-pointer items-center gap-1.5 border px-4 py-2 transition ${
              activeTab === "ai"
                ? "border-amber-400 bg-gradient-to-r from-[#b45309] to-[#e11d2e] text-white"
                : "border-amber-700/50 bg-[#12070b] text-amber-200 hover:border-amber-400"
            }`}
          >
            <Bot className="h-3.5 w-3.5" />
            <span>
              AI Thực Tế ({aiConfig?.realAiReady ? aiConfig.activeProvider.toUpperCase() : "FALLBACK"})
            </span>
          </button>
        </div>

        {/* Tab 1: Orders */}
        {activeTab === "orders" && (
          <div className="mt-6 space-y-3">
            {orders.length === 0 ? (
              <div className="yokocho-panel chamfer-md p-10 text-center text-xs text-zinc-400">
                Chưa có đơn hàng nào được tạo. Thử đặt 1 đơn từ Storefront rồi làm mới nhé!
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.orderCode}
                  className="yokocho-panel chamfer-sm flex flex-col justify-between gap-4 p-4 text-xs lg:flex-row lg:items-center"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold text-amber-300">
                        {order.orderCode}
                      </span>
                      <span
                        className={`border px-2 py-0.5 font-mono text-[10px] font-bold ${
                          order.paymentStatus === "paid"
                            ? "border-emerald-600/70 bg-emerald-950/60 text-emerald-300"
                            : "border-zinc-700 bg-black/60 text-zinc-400"
                        }`}
                      >
                        {order.paymentStatus === "paid"
                          ? `ĐÃ THANH TOÁN QR (${order.paymentRef ?? "OK"})`
                          : "COD / CHƯA CK"}
                      </span>
                      <span className="font-mono text-[11px] text-zinc-500">
                        {new Date(order.createdAt).toLocaleString("vi-VN")}
                      </span>
                    </div>
                    <p className="text-zinc-200">
                      <strong>{order.customerName}</strong> • {order.phone} •{" "}
                      <span className="text-amber-200">{order.vehicleInfo}</span>
                    </p>
                    <p className="text-zinc-400">{order.shippingAddress}</p>
                    <p className="text-zinc-300">
                      Món đặt:{" "}
                      {order.items
                        .map((i) => `${i.nameVi} (${i.selectedKelvin ?? "Std"}) ×${i.quantity}`)
                        .join(" + ")}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-right">
                      <p className="text-[11px] text-zinc-400">Tổng thu</p>
                      <p className="font-mono text-base font-bold text-[#ff4d5e]">
                        {formatVnd(order.totalVnd)}
                      </p>
                    </div>
                    <select
                      value={order.status}
                      onChange={(e) =>
                        handleOrderStatusChange(
                          order.orderCode,
                          e.target.value as OrderRecord["status"],
                        )
                      }
                      aria-label={`Đổi trạng thái đơn ${order.orderCode}`}
                      className="cursor-pointer border border-red-700/70 bg-[#12070b] px-3 py-2 font-mono text-xs font-semibold text-white focus:border-red-400 focus:outline-none"
                    >
                      {ORDER_STATUS_LABELS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Inventory & Pricing */}
        {activeTab === "inventory" && (
          <div className="yokocho-panel chamfer-md mt-6 overflow-x-auto">
            <table className="w-full min-w-[780px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-red-900/50 bg-[#0d0407] font-mono text-[11px] text-amber-300">
                  <th className="p-3.5">SKU / Tên Phụ Tùng</th>
                  <th className="p-3.5">Giá Niêm Yết (VNĐ)</th>
                  <th className="p-3.5">Tồn Kho</th>
                  <th className="p-3.5">Trạng Thái</th>
                  <th className="p-3.5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-red-900/30 hover:bg-red-950/15"
                  >
                    <td className="p-3.5">
                      <p className="font-mono text-[11px] text-[#ff4d5e]">{product.sku}</p>
                      <p className="font-semibold text-white">{product.nameVi}</p>
                    </td>
                    <td className="p-3.5">
                      <input
                        type="number"
                        step={50000}
                        value={draftPrices[product.id] ?? product.priceVnd}
                        onChange={(e) =>
                          setDraftPrices((prev) => ({
                            ...prev,
                            [product.id]: Number(e.target.value),
                          }))
                        }
                        className="w-32 border border-red-900/60 bg-[#080305] px-2.5 py-1.5 font-mono text-xs text-white focus:border-red-500 focus:outline-none"
                      />
                    </td>
                    <td className="p-3.5">
                      <input
                        type="number"
                        min={0}
                        value={draftQty[product.id] ?? product.stockQty}
                        onChange={(e) =>
                          setDraftQty((prev) => ({
                            ...prev,
                            [product.id]: Number(e.target.value),
                          }))
                        }
                        className="w-20 border border-red-900/60 bg-[#080305] px-2.5 py-1.5 font-mono text-xs text-white focus:border-red-500 focus:outline-none"
                      />
                    </td>
                    <td className="p-3.5">
                      <select
                        value={draftStockStatus[product.id] ?? product.stockStatus}
                        onChange={(e) =>
                          setDraftStockStatus((prev) => ({
                            ...prev,
                            [product.id]: e.target.value as StockStatus,
                          }))
                        }
                        className="border border-red-900/60 bg-[#080305] px-2.5 py-1.5 text-xs text-zinc-200 focus:border-red-500 focus:outline-none"
                      >
                        <option value="in_stock">Sẵn Kho</option>
                        <option value="low_stock">Sắp Hết</option>
                        <option value="jdm_preorder">Đặt Nhật</option>
                      </select>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSaveProduct(product)}
                          className="chamfer-sm inline-flex cursor-pointer items-center gap-1 border border-emerald-600/70 bg-emerald-950/60 px-2.5 py-1.5 font-semibold text-emerald-200 hover:bg-emerald-800/70"
                        >
                          <Save className="h-3.5 w-3.5" />
                          <span>Lưu</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(product)}
                          className="chamfer-sm inline-flex cursor-pointer items-center gap-1 border border-red-800/70 bg-red-950/50 px-2.5 py-1.5 text-red-300 hover:bg-[#e11d2e] hover:text-white"
                          aria-label={`Xóa ${product.sku}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Create Product + Media Upload Signing */}
        {activeTab === "create" && (
          <div className="mt-6 grid gap-6 lg:grid-cols-12">
            <form
              onSubmit={handleCreateProduct}
              className="yokocho-panel chamfer-md space-y-4 p-6 text-xs lg:col-span-7"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-lg font-bold text-white">
                  Thêm Phụ Tùng Mới Vào Catalog
                </h2>
                <button
                  type="button"
                  disabled={aiGenerating}
                  onClick={handleAiGenerateDraft}
                  className="chamfer-sm inline-flex cursor-pointer items-center gap-1.5 border border-amber-500/70 bg-amber-950/35 px-3 py-1.5 text-[11px] font-bold text-amber-200 transition hover:bg-amber-900/45 disabled:opacity-50"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  {aiGenerating ? "AI đang soạn..." : "AI Tạo Thông Số & Tiếng Nhật"}
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-zinc-300">Tên phụ tùng (Tiếng Việt) *</label>
                  <input
                    required
                    value={newNameVi}
                    onChange={(e) => setNewNameVi(e.target.value)}
                    placeholder="VD: Bi-LED Akari Titan V10"
                    className="w-full border border-red-900/60 bg-[#080305] px-3 py-2 text-white focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-zinc-300">Mã SKU *</label>
                  <input
                    required
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    placeholder="YKC-BL-V10"
                    className="w-full border border-red-900/60 bg-[#080305] px-3 py-2 font-mono text-white focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-zinc-300">Thương hiệu</label>
                  <input
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    className="w-full border border-red-900/60 bg-[#080305] px-3 py-2 text-white focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-zinc-300">Danh mục</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as PartCategory)}
                    className="w-full border border-red-900/60 bg-[#080305] px-3 py-2 text-white focus:border-red-500 focus:outline-none"
                  >
                    <option value="bi-led">Đèn Bi-LED &amp; Bóng</option>
                    <option value="bi-fog">Bi Gầm Phá Sương</option>
                    <option value="tail-light">Đèn Hậu Khói</option>
                    <option value="chassis-brake">Phanh, Còi &amp; Gầm</option>
                    <option value="jdm-aero">Đồ Chơi Đêm JDM</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-zinc-300">Giá bán (VNĐ) *</label>
                  <input
                    type="number"
                    required
                    value={newPriceVnd}
                    onChange={(e) => setNewPriceVnd(Number(e.target.value))}
                    className="w-full border border-red-900/60 bg-[#080305] px-3 py-2 font-mono text-white focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-zinc-300">Số lượng nhập kho</label>
                  <input
                    type="number"
                    value={newStockQty}
                    onChange={(e) => setNewStockQty(Number(e.target.value))}
                    className="w-full border border-red-900/60 bg-[#080305] px-3 py-2 font-mono text-white focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-zinc-300">Công suất</label>
                  <input
                    value={newWattage}
                    onChange={(e) => setNewWattage(e.target.value)}
                    className="w-full border border-red-900/60 bg-[#080305] px-3 py-2 text-white focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-zinc-300">Nhiệt màu (cách bởi dấu phẩy)</label>
                  <input
                    value={newKelvin}
                    onChange={(e) => setNewKelvin(e.target.value)}
                    className="w-full border border-red-900/60 bg-[#080305] px-3 py-2 text-white focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-zinc-300">Mã OEM tham chiếu</label>
                  <input
                    value={newOemRef}
                    onChange={(e) => setNewOemRef(e.target.value)}
                    className="w-full border border-red-900/60 bg-[#080305] px-3 py-2 font-mono text-white focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-zinc-300">URL Ảnh sản phẩm</label>
                  <input
                    value={newImage}
                    onChange={(e) => setNewImage(e.target.value)}
                    className="w-full border border-red-900/60 bg-[#080305] px-3 py-2 font-mono text-white focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-zinc-300">Tên tiếng Nhật (nameJp)</label>
                  <input
                    value={newNameJp}
                    onChange={(e) => setNewNameJp(e.target.value)}
                    className="font-jp w-full border border-red-900/60 bg-[#080305] px-3 py-2 text-white focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-zinc-300">Ký hiệu Kanji (1 chữ)</label>
                  <input
                    value={newKanji}
                    onChange={(e) => setNewKanji(e.target.value)}
                    maxLength={4}
                    className="font-jp w-full border border-red-900/60 bg-[#080305] px-3 py-2 text-white focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-zinc-300">Mô tả ngắn (summaryVi)</label>
                  <textarea
                    rows={2}
                    value={newSummaryVi}
                    onChange={(e) => setNewSummaryVi(e.target.value)}
                    placeholder="AI sẽ tự điền mô tả kỹ thuật chuẩn JDM khi bạn bấm AI Tạo Thông Số..."
                    className="w-full border border-red-900/60 bg-[#080305] px-3 py-2 text-white placeholder:text-zinc-500 focus:border-red-500 focus:outline-none"
                  />
                  {newCompatVehicles.length > 0 && (
                    <p className="mt-1.5 font-mono text-[10px] text-amber-300/90">
                      Hãng xe tương thích: {newCompatVehicles.join(", ")}
                      {newHighlights.length > 0 ? ` • ${newHighlights.length} điểm nổi bật AI` : ""}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="chamfer-sm cursor-pointer bg-gradient-to-r from-[#c81628] to-[#ff2e43] px-5 py-2.5 text-xs font-bold text-white shadow-[0_0_20px_rgba(225,29,46,0.45)]"
              >
                Lưu &amp; Đăng Lên Kệ Hàng Đêm
              </button>
            </form>

            <div className="yokocho-panel chamfer-md space-y-4 p-6 text-xs lg:col-span-5">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <UploadCloud className="h-4 w-4 text-[#ff4d5e]" />
                <span>Cấp Signed Upload URL (Cloudinary / R2)</span>
              </div>
              <p className="text-zinc-400">
                Tạo chữ ký upload ảnh hoặc video test đèn ban đêm (Issue #3) để gắn thẳng URL
                tối ưu chuẩn WebP/MP4 vào sản phẩm.
              </p>
              <div className="space-y-2">
                <label className="block text-zinc-300">Tên file media thực tế</label>
                <input
                  value={mediaFileName}
                  onChange={(e) => setMediaFileName(e.target.value)}
                  className="w-full border border-red-900/60 bg-[#080305] px-3 py-2 font-mono text-white focus:border-red-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSignMedia}
                  className="chamfer-sm w-full cursor-pointer border border-amber-500/70 bg-amber-950/35 py-2 font-bold text-amber-200 hover:bg-amber-950/60"
                >
                  Ký Upload URL Mới
                </button>
              </div>
              {mediaSignResult && (
                <div className="border border-emerald-700/60 bg-emerald-950/40 p-3 font-mono text-[11px] text-emerald-200">
                  {mediaSignResult}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Daily Inventory Logs & Webhook Notifications */}
        {activeTab === "logs" && (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="yokocho-panel chamfer-md p-5 text-xs">
              <h2 className="mb-3 font-display text-base font-bold text-white">
                Nhật Ký Biến Động Kho (DailyInventoryLog)
              </h2>
              {overview.recentInventoryLogs.length === 0 ? (
                <p className="text-zinc-500">Chưa có biến động tồn kho trong phiên hiện tại.</p>
              ) : (
                <div className="space-y-2">
                  {overview.recentInventoryLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between border border-red-900/35 bg-[#090306] p-2.5"
                    >
                      <div>
                        <span className="font-mono font-bold text-amber-300">{log.sku}</span>
                        <p className="text-[11px] text-zinc-400">
                          {log.reason} • {log.actor}
                        </p>
                      </div>
                      <span
                        className={`font-mono font-bold ${
                          log.deltaQty >= 0 ? "text-emerald-300" : "text-red-300"
                        }`}
                      >
                        {log.deltaQty >= 0 ? `+${log.deltaQty}` : log.deltaQty} ({log.newQty})
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="yokocho-panel chamfer-md p-5 text-xs">
              <h2 className="mb-3 flex items-center gap-2 font-display text-base font-bold text-white">
                <BellRing className="h-4 w-4 text-amber-300" />
                <span>Lịch Sử Webhook VietQR &amp; Thông Báo Đơn</span>
              </h2>
              {overview.recentNotifications.length === 0 ? (
                <p className="text-zinc-500">
                  Chưa có sự kiện thông báo đơn mới hoặc xác nhận chuyển khoản VietQR.
                </p>
              ) : (
                <div className="space-y-2">
                  {overview.recentNotifications.map((ev, idx) => (
                    <div
                      key={`${ev.orderCode}-${idx}`}
                      className="border border-red-900/35 bg-[#090306] p-2.5"
                    >
                      <div className="flex items-center justify-between font-mono text-[10px]">
                        <span className="text-amber-300">
                          {ev.channel.toUpperCase()} {"//"} {ev.event}
                        </span>
                        <span className="text-zinc-500">
                          {new Date(ev.sentAt).toLocaleTimeString("vi-VN")}
                        </span>
                      </div>
                      <p className="mt-1 text-zinc-200">{ev.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 5: Live Real AI Provider Configuration */}
        {activeTab === "ai" && (
          <div className="mt-6 grid gap-6 lg:grid-cols-12">
            <div className="yokocho-panel chamfer-md space-y-4 p-6 text-xs lg:col-span-5">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-display text-base font-bold text-white">
                  <Cpu className="h-4 w-4 text-amber-300" />
                  <span>Trạng Thái AI Engine Thực Tế</span>
                </h2>
                <span
                  className={`border px-2 py-0.5 font-mono text-[10px] font-bold ${
                    aiConfig?.realAiReady
                      ? "border-emerald-600/70 bg-emerald-950/60 text-emerald-300"
                      : "border-amber-600/70 bg-amber-950/50 text-amber-300"
                  }`}
                >
                  {aiConfig?.realAiReady ? "REAL AI ACTIVE" : "FALLBACK LOCAL"}
                </span>
              </div>

              <div className="space-y-2 border border-red-900/40 bg-[#080305] p-3.5 font-mono text-[11px]">
                <p className="text-zinc-300">
                  Provider hiện tại:{" "}
                  <strong className="text-amber-300">{aiConfig?.activeProvider ?? "..."}</strong>
                </p>
                <p className="text-zinc-300">
                  Model đang chạy:{" "}
                  <strong className="text-white">{aiConfig?.activeModel ?? "..."}</strong>
                </p>
                <p className="text-zinc-300">
                  Soi ảnh chóa đèn (Vision):{" "}
                  <strong className={aiConfig?.visionCapable ? "text-emerald-300" : "text-zinc-400"}>
                    {aiConfig?.visionCapable ? "HỖ TRỢ ẢNH TRỰC TIẾP" : "Chỉ nhận text/filename"}
                  </strong>
                </p>
                <p className="text-zinc-300">
                  Ollama trên máy:{" "}
                  <strong className={aiConfig?.ollamaOnline ? "text-emerald-300" : "text-zinc-500"}>
                    {aiConfig?.ollamaOnline
                      ? `ONLINE (${aiConfig.ollamaModels.length} model: ${aiConfig.ollamaModels.join(", ") || "chưa tải model"})`
                      : "Chưa bật / chưa cài"}
                  </strong>
                </p>
              </div>

              {aiConfig?.lastError && (
                <div className="border border-red-700/70 bg-red-950/45 p-3 font-mono text-[11px] text-red-200">
                  Cảnh báo gần nhất: {aiConfig.lastError}
                </div>
              )}

              <button
                type="button"
                disabled={aiTesting}
                onClick={handleTestAiNow}
                className="chamfer-sm inline-flex w-full cursor-pointer items-center justify-center gap-2 border border-amber-400/75 bg-amber-950/40 py-2.5 font-bold text-amber-200 hover:bg-amber-900/50 disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                <span>{aiTesting ? "Đang gọi AI thật kiểm tra..." : "Test Kết Nối AI Thật Ngay"}</span>
              </button>

              {aiTestResult && (
                <div
                  className={`border p-3 font-mono text-[11px] ${
                    aiTestResult.ok
                      ? "border-emerald-700/70 bg-emerald-950/40 text-emerald-200"
                      : "border-red-700/70 bg-red-950/40 text-red-200"
                  }`}
                >
                  <p className="font-bold">
                    {aiTestResult.ok ? "KẾT NỐI THÀNH CÔNG" : "CHƯA KẾT NỐI ĐƯỢC"} (
                    {aiTestResult.provider} {"//"} {aiTestResult.model} • {aiTestResult.latencyMs}ms)
                  </p>
                  {aiTestResult.reply && <p className="mt-1 text-white">Reply: {aiTestResult.reply}</p>}
                  {aiTestResult.error && <p className="mt-1">{aiTestResult.error}</p>}
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => handleSaveAiSettings(e)}
              className="yokocho-panel chamfer-md space-y-4 p-6 text-xs lg:col-span-7"
            >
              <h2 className="font-display text-lg font-bold text-white">
                Đấu Nối Key Cloud Hoặc Model Ollama (Lưu vào backend/.env)
              </h2>

              <div>
                <label className="mb-1 block text-zinc-300">Thứ tự ưu tiên Provider</label>
                <select
                  value={aiProviderMode}
                  onChange={(e) => setAiProviderMode(e.target.value as AiModePreference)}
                  className="w-full border border-red-900/60 bg-[#080305] px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
                >
                  <option value="auto">Tự động (Gemini → OpenAI/Groq → Ollama Local → Fallback)</option>
                  <option value="gemini">Ưu tiên Google Gemini</option>
                  <option value="openai">Ưu tiên OpenAI / Groq / OpenRouter</option>
                  <option value="ollama">Ưu tiên Ollama Local (100% miễn phí trên máy)</option>
                  <option value="local">Chỉ chạy Garage Fallback</option>
                </select>
              </div>

              <div className="space-y-2.5 border border-red-900/40 bg-[#080305]/80 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300">
                    1. Google Gemini (Khuyên dùng cho Vision soi chóa đèn)
                  </span>
                  {aiConfig?.geminiKeyPreview && (
                    <span className="font-mono text-[10px] text-zinc-400">
                      Hiện tại: {aiConfig.geminiKeyPreview}
                    </span>
                  )}
                </div>
                <div className="grid gap-2.5 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <input
                      type="password"
                      value={aiGeminiKeyInput}
                      onChange={(e) => setAiGeminiKeyInput(e.target.value)}
                      placeholder="Dán key AIza... mới từ aistudio.google.com/apikey (để trống nếu giữ nguyên)"
                      className="w-full border border-red-900/60 bg-[#050204] px-3 py-2 font-mono text-white placeholder:text-zinc-500 focus:border-red-500 focus:outline-none"
                    />
                  </div>
                  <input
                    value={aiGeminiModelInput}
                    onChange={(e) => setAiGeminiModelInput(e.target.value)}
                    placeholder="gemini-2.5-flash"
                    className="w-full border border-red-900/60 bg-[#050204] px-3 py-2 font-mono text-white focus:border-red-500 focus:outline-none"
                  />
                </div>
                {aiConfig?.geminiKeyPreview && (
                  <button
                    type="button"
                    onClick={(e) => handleSaveAiSettings(e, "gemini")}
                    className="cursor-pointer font-mono text-[10px] text-red-300 underline hover:text-white"
                  >
                    Xóa GEMINI_API_KEY cũ khỏi .env
                  </button>
                )}
              </div>

              <div className="space-y-2.5 border border-red-900/40 bg-[#080305]/80 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sky-300">
                    2. OpenAI / Groq / OpenRouter Compatible
                  </span>
                  {aiConfig?.openaiKeyPreview && (
                    <span className="font-mono text-[10px] text-zinc-400">
                      Key: {aiConfig.openaiKeyPreview}
                    </span>
                  )}
                </div>
                <div className="grid gap-2.5 sm:grid-cols-3">
                  <input
                    type="password"
                    value={aiOpenaiKeyInput}
                    onChange={(e) => setAiOpenaiKeyInput(e.target.value)}
                    placeholder="sk-... hoặc gsk_..."
                    className="w-full border border-red-900/60 bg-[#050204] px-3 py-2 font-mono text-white placeholder:text-zinc-500 focus:border-red-500 focus:outline-none"
                  />
                  <input
                    value={aiOpenaiBaseUrlInput}
                    onChange={(e) => setAiOpenaiBaseUrlInput(e.target.value)}
                    placeholder="https://api.openai.com/v1"
                    className="w-full border border-red-900/60 bg-[#050204] px-3 py-2 font-mono text-white focus:border-red-500 focus:outline-none"
                  />
                  <input
                    value={aiOpenaiModelInput}
                    onChange={(e) => setAiOpenaiModelInput(e.target.value)}
                    placeholder="gpt-4o-mini"
                    className="w-full border border-red-900/60 bg-[#050204] px-3 py-2 font-mono text-white focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2.5 border border-red-900/40 bg-[#080305]/80 p-3.5">
                <span className="block font-bold text-emerald-300">
                  3. Ollama Local (Chạy trực tiếp trên máy miễn phí 100%)
                </span>
                <div className="grid gap-2.5 sm:grid-cols-3">
                  <input
                    value={aiOllamaUrlInput}
                    onChange={(e) => setAiOllamaUrlInput(e.target.value)}
                    placeholder="http://127.0.0.1:11434"
                    className="w-full border border-red-900/60 bg-[#050204] px-3 py-2 font-mono text-white focus:border-red-500 focus:outline-none"
                  />
                  <input
                    value={aiOllamaModelInput}
                    onChange={(e) => setAiOllamaModelInput(e.target.value)}
                    placeholder={aiConfig?.ollamaModels[0] || "qwen2.5:3b"}
                    className="w-full border border-red-900/60 bg-[#050204] px-3 py-2 font-mono text-white focus:border-red-500 focus:outline-none"
                  />
                  <input
                    value={aiOllamaVisionModelInput}
                    onChange={(e) => setAiOllamaVisionModelInput(e.target.value)}
                    placeholder="qwen2.5vl:3b (Vision)"
                    className="w-full border border-red-900/60 bg-[#050204] px-3 py-2 font-mono text-white focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={aiSavingConfig}
                className="chamfer-sm cursor-pointer bg-gradient-to-r from-[#c81628] to-[#ff2e43] px-5 py-2.5 text-xs font-bold text-white shadow-[0_0_20px_rgba(225,29,46,0.45)] disabled:opacity-50"
              >
                {aiSavingConfig ? "Đang lưu cấu hình..." : "Lưu Cấu Hình AI & Kích Hoạt Ngay"}
              </button>
            </form>
          </div>
        )}

        {/* Tab 6: Customer Reviews Moderation */}
        {activeTab === "reviews" && (
          <div className="mt-6 space-y-4">
            <div className="yokocho-panel chamfer-md flex flex-wrap items-center justify-between gap-3 border border-red-900/50 p-4 text-xs">
              <div>
                <p className="font-mono text-[11px] font-bold tracking-widest text-[#ff4d5e] uppercase">
                  REVIEW MODERATION // Kiểm Duyệt Ảnh Xe &amp; Đánh Giá
                </p>
                <p className="mt-1 text-zinc-300">
                  Mọi đánh giá khách gửi lên sẽ ở trạng thái <strong className="text-amber-300">Chờ duyệt</strong> cho tới khi kỹ thuật viên kiểm tra ảnh thực tế &amp; cho phép lên trang chủ.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { key: "all", label: `Tất cả (${reviewCounts.all})` },
                    { key: "pending", label: `Chờ duyệt (${reviewCounts.pending})` },
                    { key: "approved", label: `Đã lên web (${reviewCounts.approved})` },
                    { key: "rejected", label: `Đã ẩn (${reviewCounts.rejected})` },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setReviewFilter(item.key)}
                    className={`chamfer-sm cursor-pointer border px-3 py-1.5 font-mono text-[11px] font-bold transition ${
                      reviewFilter === item.key
                        ? "border-red-400 bg-[#e11d2e] text-white"
                        : "border-red-900/50 bg-[#12070b] text-zinc-300 hover:border-red-500"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {reviews.filter((r) => reviewFilter === "all" || r.status === reviewFilter).length === 0 ? (
              <div className="yokocho-panel chamfer-sm p-6 text-center text-xs text-zinc-400">
                Không có đánh giá nào trong bộ lọc hiện tại.
              </div>
            ) : (
              reviews
                .filter((r) => reviewFilter === "all" || r.status === reviewFilter)
                .map((rev) => {
                  const matchedProduct = products.find((p) => p.id === rev.productId);
                  const noteDraft = reviewNotes[rev.id] ?? rev.adminNote ?? "";
                  return (
                    <div
                      key={rev.id}
                      className="yokocho-panel chamfer-md flex flex-col gap-4 border border-red-900/55 p-5 text-xs lg:flex-row lg:items-start lg:justify-between"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                        {rev.photoUrl ? (
                          <button
                            type="button"
                            onClick={() => setReviewZoomUrl(rev.photoUrl!)}
                            className="group relative h-28 w-40 shrink-0 cursor-pointer overflow-hidden border border-red-800/60 bg-black"
                            title="Bấm phóng to ảnh xe"
                          >
                            <Image
                              src={rev.photoUrl}
                              alt={`Ảnh xe ${rev.vehicleInfo}`}
                              fill
                              sizes="160px"
                              unoptimized={!rev.photoUrl.startsWith("/")}
                              className="object-cover transition group-hover:scale-105"
                            />
                            <span className="absolute right-1.5 bottom-1.5 inline-flex items-center gap-1 border border-white/20 bg-black/80 px-1.5 py-0.5 font-mono text-[9px] text-amber-200">
                              <Camera className="h-3 w-3" />
                              Phóng to
                            </span>
                          </button>
                        ) : (
                          <div className="flex h-28 w-40 shrink-0 items-center justify-center border border-zinc-800 bg-black/60 font-mono text-[10px] text-zinc-500">
                            Không kèm ảnh
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`border px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                                rev.status === "approved"
                                  ? "border-emerald-600/70 bg-emerald-950/70 text-emerald-300"
                                  : rev.status === "pending"
                                    ? "border-amber-500/70 bg-amber-950/70 text-amber-300"
                                    : "border-zinc-700 bg-zinc-900 text-zinc-400"
                              }`}
                            >
                              {rev.status === "approved"
                                ? "ĐÃ LÊN WEB"
                                : rev.status === "pending"
                                  ? "CHỜ DUYỆT"
                                  : "ĐÃ ẨN"}
                            </span>

                            {rev.verifiedPurchase && (
                              <span className="inline-flex items-center gap-1 border border-emerald-700/60 bg-emerald-950/60 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
                                <ShieldCheck className="h-3 w-3" />
                                Đã Mua Hàng {rev.orderCode ? `(${rev.orderCode})` : ""}
                              </span>
                            )}

                            {rev.beamMode && (
                              <span className="border border-red-800/60 bg-red-950/40 px-2 py-0.5 font-mono text-[10px] text-red-200 uppercase">
                                {rev.beamMode}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-white">{rev.customerName}</span>
                            <span className="text-zinc-400">• {rev.vehicleInfo}</span>
                            <span className="inline-flex items-center gap-0.5 text-amber-400">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`h-3 w-3 ${
                                    s <= rev.rating ? "fill-amber-400 text-amber-400" : "text-zinc-600"
                                  }`}
                                />
                              ))}
                            </span>
                          </div>

                          <p className="font-mono text-[11px] text-[#ff4d5e]">
                            Sản phẩm: {matchedProduct ? matchedProduct.nameVi : rev.productId}
                          </p>
                          <p className="font-semibold text-zinc-100">{rev.title}</p>
                          <p className="max-w-2xl leading-relaxed text-zinc-300">{rev.comment}</p>
                          <p className="font-mono text-[10px] text-zinc-500">
                            ID: {rev.id} • Gửi lúc: {new Date(rev.createdAt).toLocaleString("vi-VN")}
                          </p>
                        </div>
                      </div>

                      <div className="flex w-full shrink-0 flex-col gap-2 lg:w-64">
                        <input
                          value={noteDraft}
                          onChange={(e) =>
                            setReviewNotes((prev) => ({
                              ...prev,
                              [rev.id]: e.target.value,
                            }))
                          }
                          placeholder="Ghi chú kiểm duyệt (tùy chọn)..."
                          className="w-full border border-red-900/60 bg-[#050204] px-2.5 py-1.5 text-[11px] text-white placeholder:text-zinc-500 focus:border-red-500 focus:outline-none"
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateReviewStatus(rev.id, "approved")}
                            className="chamfer-sm inline-flex flex-1 cursor-pointer items-center justify-center gap-1 border border-emerald-500/70 bg-emerald-950/60 px-3 py-1.5 font-bold text-emerald-200 transition hover:bg-emerald-800/70"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Duyệt Lên Web</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateReviewStatus(rev.id, "rejected")}
                            className="chamfer-sm inline-flex cursor-pointer items-center justify-center gap-1 border border-amber-600/60 bg-amber-950/50 px-3 py-1.5 font-bold text-amber-200 transition hover:bg-amber-900/60"
                          >
                            <EyeOff className="h-3.5 w-3.5" />
                            <span>Ẩn</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteReview(rev.id)}
                            title="Xóa đánh giá vĩnh viễn"
                            className="chamfer-sm inline-flex cursor-pointer items-center justify-center border border-red-800/70 bg-red-950/60 px-2.5 py-1.5 text-red-300 transition hover:bg-red-800/70 hover:text-white"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        )}

        {reviewZoomUrl && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            onClick={() => setReviewZoomUrl(null)}
          >
            <div
              className="relative h-[80vh] w-full max-w-4xl border border-red-600/70 bg-[#050204]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setReviewZoomUrl(null)}
                aria-label="Đóng ảnh phóng to"
                className="chamfer-sm absolute top-3 right-3 z-10 cursor-pointer border border-red-500/70 bg-black/85 p-2 text-zinc-200 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
              <Image
                src={reviewZoomUrl}
                alt="Ảnh xe thực tế phóng to"
                fill
                sizes="90vw"
                unoptimized={!reviewZoomUrl.startsWith("/")}
                className="object-contain p-2"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

