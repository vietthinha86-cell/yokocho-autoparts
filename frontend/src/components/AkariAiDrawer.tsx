"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Bot,
  Camera,
  CloudRain,
  Compass,
  Eye,
  Flame,
  ImagePlus,
  Layers,
  Send,
  ShoppingBag,
  Sparkles,
  Sun,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { fetchAiEngineStatus, formatVnd, requestAiAdvice } from "@/lib/api";
import { compressImageFileToDataUrl } from "@/lib/imageUtils";
import type {
  AiAdviceResponse,
  AiEngineStatus,
  AutoPartProduct,
  DrivingProfile,
  VehicleFitment,
} from "@/types/autoparts";
import type { RainBeamColorMode } from "./MidnightRainCanvas";

interface AkariAiDrawerProps {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  products: AutoPartProduct[];
  fitments: VehicleFitment[];
  selectedVehicleMake: string;
  onAddProduct: (product: AutoPartProduct) => void;
  onAddCombo: (parts: AutoPartProduct[]) => void;
  onApplyBeamMode: (mode: RainBeamColorMode) => void;
}

interface ChatEntry {
  id: string;
  role: "user" | "assistant";
  text: string;
  imagePreview?: string;
  advice?: AiAdviceResponse;
}

const DRIVING_PROFILES: Array<{
  id: DrivingProfile;
  label: string;
  sub: string;
  Icon: typeof CloudRain;
}> = [
  { id: "mountain_rain", label: "Đèo Mưa & Sương", sub: "Ưu tiên 3000K", Icon: CloudRain },
  { id: "city", label: "Phố Tối Hẻm Nhỏ", sub: "Cắt nét 4300K", Icon: Sun },
  { id: "highway", label: "Cao Tốc Đêm Xa", sub: "Pha Laser 6000K", Icon: Compass },
  { id: "showcar", label: "Showcar Đỏ Huyết", sub: "Hậu + Gầm JDM", Icon: Flame },
];

const BUDGET_OPTIONS: Array<{ label: string; value?: number }> = [
  { label: "Dưới 3tr", value: 2_800_000 },
  { label: "3 – 6tr", value: 5_800_000 },
  { label: "Full Set 6tr+", value: undefined },
];

const QUICK_PROMPTS = [
  "Xe City 2021 hay đi mưa sương mù tầm 4 triệu lắp đèn gì không chói?",
  "Bán tải Ranger đi đèo nhiều nên gắn Bi-Gầm loại nào?",
  "Chóa Halogen chân H4 muốn sáng gọn không cần đục chóa?",
];

export function AkariAiDrawer({
  open,
  onOpen,
  onClose,
  products,
  fitments,
  selectedVehicleMake,
  onAddProduct,
  onAddCombo,
  onApplyBeamMode,
}: AkariAiDrawerProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [messages, setMessages] = useState<ChatEntry[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Chào bạn! Mình là AKARI AI — Thợ Máy Đêm. Bạn cứ gõ tên xe, ngân sách, chọn phong cách lái hoặc tải ảnh đầu xe/chóa đèn lên, mình sẽ soi đúng chân giắc và ghép cấu hình Plug & Play ngay!",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<DrivingProfile | undefined>(undefined);
  const [selectedBudget, setSelectedBudget] = useState<number | undefined>(undefined);
  const [attachedImage, setAttachedImage] = useState<{
    dataUrl: string;
    mimeType: string;
    filename: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState<AiEngineStatus | null>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    fetchAiEngineStatus().then((status) => {
      if (active && status) setAiStatus(status);
    });
    return () => {
      active = false;
    };
  }, [open]);

  async function sendToAi(customPayload?: {
    text?: string;
    profile?: DrivingProfile;
    budget?: number;
  }) {
    const queryText = (customPayload?.text ?? inputText).trim();
    const activeProfile = customPayload?.profile ?? selectedProfile;
    const activeBudget =
      customPayload && "budget" in customPayload ? customPayload.budget : selectedBudget;

    if (!queryText && !attachedImage && !activeProfile) {
      return;
    }

    const displayUserText =
      queryText ||
      (attachedImage
        ? `Phân tích ảnh chóa đèn: ${attachedImage.filename}`
        : `Tư vấn cấu hình cho phong cách ${
            DRIVING_PROFILES.find((p) => p.id === activeProfile)?.label ?? "đêm"
          }`);

    const userMsg: ChatEntry = {
      id: `u-${Date.now()}`,
      role: "user",
      text: displayUserText,
      imagePreview: attachedImage?.dataUrl,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPayload?.text) {
      setInputText("");
    }
    const imageToSend = attachedImage;
    setAttachedImage(null);
    setLoading(true);

    const advice = await requestAiAdvice(
      {
        message: queryText,
        vehicleMake: selectedVehicleMake || undefined,
        drivingProfile: activeProfile,
        budgetVnd: activeBudget,
        imageBase64: imageToSend?.dataUrl,
        imageMimeType: imageToSend?.mimeType,
        imageFilename: imageToSend?.filename,
      },
      products,
      fitments,
    );

    setLoading(false);
    setMessages((prev) => [
      ...prev,
      {
        id: `a-${Date.now()}`,
        role: "assistant",
        text: advice.replyVi,
        advice,
      },
    ]);
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFileToDataUrl(file);
      setAttachedImage({
        dataUrl: compressed.dataUrl,
        mimeType: compressed.mimeType,
        filename: file.name,
      });
    } finally {
      e.target.value = "";
    }
  }

  return (
    <>
      {/* Floating glowing trigger button when drawer is closed */}
      {!open && (
        <button
          type="button"
          onClick={onOpen}
          className="chamfer-sm fixed right-5 bottom-5 z-40 inline-flex cursor-pointer items-center gap-2.5 border border-amber-400/80 bg-gradient-to-r from-[#23060c] via-[#8b0d1b] to-[#c81628] px-4 py-3 text-xs font-bold text-white shadow-[0_0_32px_rgba(225,29,46,0.65)] transition hover:scale-[1.03] hover:brightness-115"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-300 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-400" />
          </span>
          <Bot className="h-4 w-4 text-amber-300" />
          <span>AI Thợ Đêm</span>
          <span className="font-jp hidden border border-white/20 bg-black/40 px-1.5 py-0.5 text-[10px] text-amber-200 sm:inline">
            赤灯AI
          </span>
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm">
          <div className="flex h-full w-full max-w-lg flex-col border-l border-red-600/70 bg-[#080306] shadow-[-24px_0_70px_rgba(225,29,46,0.4)]">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-red-900/50 bg-[#100408] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center border border-amber-400/60 bg-gradient-to-b from-[#e11d2e] to-[#6e0813] text-white shadow-[0_0_16px_rgba(225,29,46,0.55)]">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-sm font-bold tracking-wide text-white">
                      AKARI AI — Thợ Máy Đêm
                    </h2>
                    <span className="font-jp border border-amber-500/40 bg-amber-950/50 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                      赤灯知能
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Tư vấn chân giắc, soi ảnh chóa đèn &amp; ghép combo sáng chuẩn
                  </p>
                  {aiStatus && (
                    <span
                      className={`mt-1 inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-[10px] font-bold ${
                        aiStatus.realAiReady
                          ? "border-emerald-600/70 bg-emerald-950/60 text-emerald-300"
                          : "border-amber-700/60 bg-amber-950/40 text-amber-300"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          aiStatus.realAiReady ? "bg-emerald-400" : "bg-amber-400"
                        }`}
                      />
                      {aiStatus.activeProvider === "gemini"
                        ? `GEMINI LIVE • ${aiStatus.activeModel}`
                        : aiStatus.activeProvider === "openai-compatible"
                          ? `CLOUD AI • ${aiStatus.activeModel}`
                          : aiStatus.activeProvider === "ollama"
                            ? `OLLAMA REAL AI • ${aiStatus.activeModel}`
                            : "CHẾ ĐỘ GARA CỤC BỘ"}
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Đóng AKARI AI"
                className="chamfer-sm cursor-pointer border border-red-800/60 p-1.5 text-zinc-300 hover:border-red-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* A5: Quick Driving Style + Budget Customizer */}
            <div className="border-b border-red-900/40 bg-[#0b0407] px-4 py-3">
              <div className="mb-2 flex items-center justify-between text-[11px]">
                <span className="font-mono font-bold text-amber-300">
                  GHÉP COMBO AI THEO PHONG CÁCH LÁI:
                </span>
                <div className="flex gap-1">
                  {BUDGET_OPTIONS.map((b) => (
                    <button
                      key={b.label}
                      type="button"
                      onClick={() => setSelectedBudget(b.value)}
                      className={`cursor-pointer border px-1.5 py-0.5 font-mono text-[10px] transition ${
                        selectedBudget === b.value
                          ? "border-amber-400 bg-amber-500/20 text-amber-200"
                          : "border-zinc-800 bg-black/60 text-zinc-400 hover:border-red-700"
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                {DRIVING_PROFILES.map((prof) => {
                  const Icon = prof.Icon;
                  const active = selectedProfile === prof.id;
                  return (
                    <button
                      key={prof.id}
                      type="button"
                      disabled={loading}
                      onClick={() => {
                        setSelectedProfile(prof.id);
                        void sendToAi({
                          text: `Tư vấn giúp mình cấu hình đi kiểu "${prof.label}"`,
                          profile: prof.id,
                          budget: selectedBudget,
                        });
                      }}
                      className={`chamfer-sm cursor-pointer border p-2 text-left transition ${
                        active
                          ? "border-[#ff4d5e] bg-red-950/60 text-white"
                          : "border-red-900/45 bg-[#12060a] text-zinc-300 hover:border-red-500"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-[11px] font-bold">
                        <Icon className="h-3.5 w-3.5 text-amber-300" />
                        <span className="truncate">{prof.label}</span>
                      </div>
                      <p className="mt-0.5 font-mono text-[9px] text-zinc-400">{prof.sub}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chat Message Thread */}
            <div className="flex-1 space-y-4 overflow-y-auto p-4 text-xs">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[92%] border p-3.5 ${
                      msg.role === "user"
                        ? "chamfer-sm border-amber-500/50 bg-amber-950/35 text-amber-50"
                        : "chamfer-sm border-red-800/55 bg-[#110609] text-zinc-100"
                    }`}
                  >
                    {msg.imagePreview && (
                      <div className="mb-2 overflow-hidden border border-amber-400/50">
                        <Image
                          src={msg.imagePreview}
                          alt="Ảnh chóa đèn khách gửi"
                          width={240}
                          height={150}
                          unoptimized
                          className="h-32 w-full object-cover"
                        />
                      </div>
                    )}

                    <p className="leading-relaxed">{msg.text}</p>

                    {msg.advice && (
                      <div className="mt-3 space-y-2.5 border-t border-red-900/45 pt-3">
                        <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
                          {msg.advice.detectedVehicle && (
                            <span className="border border-sky-700/60 bg-sky-950/50 px-2 py-0.5 text-sky-200">
                              Xe: {msg.advice.detectedVehicle}
                            </span>
                          )}
                          {msg.advice.detectedSocket && (
                            <span className="border border-amber-600/60 bg-amber-950/50 px-2 py-0.5 text-amber-200">
                              Chân: {msg.advice.detectedSocket}
                            </span>
                          )}
                          <span className="border border-red-600/60 bg-red-950/60 px-2 py-0.5 text-red-200">
                            {msg.advice.recommendedKelvin}
                          </span>
                          <span
                            className={`border px-2 py-0.5 ${
                              msg.advice.provider === "yokocho-local-ai"
                                ? "border-zinc-700 bg-black/50 text-zinc-400"
                                : "border-emerald-700/70 bg-emerald-950/50 text-emerald-300"
                            }`}
                          >
                            {msg.advice.provider === "yokocho-local-ai"
                              ? "Gara Local"
                              : `AI: ${msg.advice.model}`}
                          </span>
                        </div>

                        {/* Recommended Product Action Cards */}
                        <div className="space-y-2">
                          {msg.advice.recommendedProducts.map((part) => (
                            <div
                              key={part.id}
                              className="flex items-center gap-2.5 border border-red-900/45 bg-[#070305] p-2"
                            >
                              <div className="relative h-12 w-14 shrink-0 overflow-hidden border border-red-900/50">
                                <Image
                                  src={part.image}
                                  alt={part.nameVi}
                                  fill
                                  sizes="56px"
                                  unoptimized={!part.image.startsWith("/")}
                                  className="object-cover"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <Link
                                  href={`/san-pham/${part.slug}`}
                                  onClick={onClose}
                                  className="block truncate font-semibold text-white hover:text-[#ff4d5e]"
                                >
                                  {part.nameVi}
                                </Link>
                                <p className="font-mono text-[11px] font-bold text-[#ff4d5e]">
                                  {formatVnd(part.priceVnd)}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => onAddProduct(part)}
                                className="chamfer-sm shrink-0 cursor-pointer border border-red-600/70 bg-[#e11d2e] px-2.5 py-1.5 font-bold text-white hover:brightness-115"
                              >
                                + Giỏ
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {msg.advice.recommendedProducts.length >= 2 && (
                            <button
                              type="button"
                              onClick={() =>
                                msg.advice && onAddCombo(msg.advice.recommendedProducts)
                              }
                              className="chamfer-sm inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 bg-gradient-to-r from-[#c81628] to-[#ff2e43] px-3 py-2 font-bold text-white shadow-[0_0_16px_rgba(225,29,46,0.45)]"
                            >
                              <Layers className="h-3.5 w-3.5" />
                              <span>
                                Thêm Combo AI (-{msg.advice.bundleDiscountPct}% •{" "}
                                {formatVnd(msg.advice.bundleTotalVnd)})
                              </span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              if (!msg.advice) return;
                              onApplyBeamMode(msg.advice.recommendedBeamMode);
                              onClose();
                            }}
                            className="chamfer-sm inline-flex cursor-pointer items-center gap-1.5 border border-amber-400/70 bg-amber-950/40 px-3 py-2 font-bold text-amber-200 hover:bg-amber-950/70"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Thử Tia Này ↗</span>
                          </button>
                        </div>

                        <p className="flex items-start gap-1.5 border-l-2 border-amber-400 bg-black/50 p-2 text-[11px] text-zinc-300">
                          <Wrench className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
                          <span>{msg.advice.tipVi}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 font-mono text-[11px] text-amber-300">
                  <Sparkles className="h-3.5 w-3.5 animate-spin" />
                  <span>AKARI AI đang soi chân giắc &amp; ghép cấu hình tối ưu...</span>
                </div>
              )}
            </div>

            {/* Quick Suggestion Chips */}
            <div className="border-t border-red-900/35 bg-[#090306] px-4 py-2">
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {QUICK_PROMPTS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    disabled={loading}
                    onClick={() => void sendToAi({ text: q })}
                    className="shrink-0 cursor-pointer border border-red-900/50 bg-[#14070b] px-2.5 py-1 text-[10px] text-zinc-300 hover:border-amber-400 hover:text-amber-200"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Composer + Vision Photo Attachment */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void sendToAi();
              }}
              className="border-t border-red-800/50 bg-[#0d0407] p-3.5"
            >
              {attachedImage && (
                <div className="mb-2 flex items-center justify-between border border-amber-500/50 bg-amber-950/25 p-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Image
                      src={attachedImage.dataUrl}
                      alt="Preview ảnh đầu xe"
                      width={48}
                      height={36}
                      unoptimized
                      className="h-9 w-12 object-cover"
                    />
                    <div>
                      <p className="font-mono text-[11px] font-bold text-amber-200">
                        {attachedImage.filename}
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        Sẵn sàng gửi cho AI Vision soi chóa đèn
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAttachedImage(null)}
                    className="cursor-pointer p-1 text-zinc-400 hover:text-red-300"
                    aria-label="Gỡ ảnh"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Tải ảnh đầu xe hoặc chóa đèn để AI soi chân bóng"
                  aria-label="Tải ảnh chóa đèn"
                  className="chamfer-sm cursor-pointer border border-amber-500/60 bg-amber-950/35 p-2.5 text-amber-300 transition hover:bg-amber-950/70"
                >
                  <Camera className="h-4 w-4" />
                </button>
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Gõ tên xe, ngân sách hoặc tải ảnh chóa đèn..."
                  className="flex-1 border border-red-900/60 bg-[#070305] px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:border-red-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={loading}
                  aria-label="Gửi cho AKARI AI"
                  className="chamfer-sm cursor-pointer bg-gradient-to-r from-[#c81628] to-[#ff2e43] px-3.5 py-2.5 text-xs font-bold text-white shadow-[0_0_16px_rgba(225,29,46,0.45)] disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-1.5 flex items-center justify-between text-[10px] text-zinc-500">
                <span className="inline-flex items-center gap-1">
                  <ImagePlus className="h-3 w-3 text-amber-400" />
                  Hỗ trợ tải ảnh xe thật (Gemini Vision khi cấu hình key)
                </span>
                <span className="inline-flex items-center gap-1 text-zinc-400">
                  <ShoppingBag className="h-3 w-3 text-[#ff4d5e]" />1 chạm thêm giỏ
                </span>
              </p>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

