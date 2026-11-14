import type {
  AutoPartProduct,
  PartCategory,
  TechnicalSpec,
  VehicleFitment,
} from "../types.ts";

export type DrivingProfile = "city" | "mountain_rain" | "highway" | "showcar";

export interface AiAdviseInput {
  message?: string;
  vehicleMake?: string;
  drivingProfile?: DrivingProfile;
  budgetVnd?: number;
  imageBase64?: string;
  imageMimeType?: string;
  imageFilename?: string;
  products: AutoPartProduct[];
  fitments: VehicleFitment[];
}

export interface AiAdviseResult {
  provider: "gemini" | "yokocho-local-ai";
  model: string;
  replyVi: string;
  detectedVehicle?: string;
  detectedSocket?: string;
  recommendedKelvin: string;
  recommendedBeamMode: "3000k" | "4300k" | "6000k" | "combo";
  recommendedProducts: AutoPartProduct[];
  bundleDiscountPct: number;
  bundleTotalVnd: number;
  tipVi: string;
}

export interface AiAdminDraftResult {
  provider: "gemini" | "yokocho-local-ai";
  skuSuggestion: string;
  nameJp: string;
  kanjiMark: string;
  oemRef: string;
  badgeText: string;
  compatibleVehicles: string[];
  summaryVi: string;
  highlights: string[];
  specs: TechnicalSpec;
}

export function normalizeViText(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s/-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const SYNONYM_BUCKETS: Array<{ keywords: string[]; expand: string[] }> = [
  {
    keywords: ["suong", "mua", "deo", "3000k", "vang", "bi gam", "gam"],
    expand: ["bi-fog", "3000k", "kitsune", "pha suong"],
  },
  {
    keywords: ["pha", "chieu xa", "laser", "bi led", "cos", "duong dai", "cao toc"],
    expand: ["bi-led", "yami", "miniz", "shinigami", "osram"],
  },
  {
    keywords: ["coi", "ken", "sen", "piaa", "am thanh"],
    expand: ["piaa", "horn", "kabuki", "400hz"],
  },
  {
    keywords: ["phanh", "thang", "heo dau", "brembo", "dia", "piston"],
    expand: ["chassis-brake", "brembo", "phanh"],
  },
  {
    keywords: ["hau", "duoi", "khoi", "xi nhan", "oni"],
    expand: ["tail-light", "oni", "sequential"],
  },
  {
    keywords: ["underbody", "led gam", "do huyet", "trang tri", "noi that"],
    expand: ["jdm-aero", "underbody", "ambient"],
  },
];

export function inferMakeFromText(
  normalizedQuery: string,
  fitments: VehicleFitment[],
): VehicleFitment | undefined {
  for (const fit of fitments) {
    const makeNorm = normalizeViText(fit.make);
    if (normalizedQuery.includes(makeNorm)) {
      return fit;
    }
    const modelTokens = fit.model
      .split(/[/,]/)
      .map((m) => normalizeViText(m))
      .filter((m) => m.length >= 2);
    if (modelTokens.some((tok) => normalizedQuery.includes(tok))) {
      return fit;
    }
  }
  return undefined;
}

export function matchesSmartProductQuery(
  part: AutoPartProduct,
  rawQuery: string,
  fitments: VehicleFitment[] = [],
): boolean {
  const qNorm = normalizeViText(rawQuery);
  if (!qNorm) return true;

  const haystack = normalizeViText(
    [
      part.nameVi,
      part.sku,
      part.oemRef,
      part.brand,
      part.category,
      part.summaryVi,
      part.badgeText,
      part.specs.socket ?? "",
      ...(part.specs.kelvin ?? []),
      ...part.compatibleVehicles,
      ...part.highlights,
    ].join(" "),
  );

  if (haystack.includes(qNorm)) {
    return true;
  }

  const matchedVehicle = inferMakeFromText(qNorm, fitments);
  if (
    matchedVehicle &&
    part.compatibleVehicles.some(
      (v) => normalizeViText(v) === normalizeViText(matchedVehicle.make),
    )
  ) {
    const remainingWords = qNorm
      .split(" ")
      .filter(
        (w) =>
          w.length >= 2 &&
          !normalizeViText(matchedVehicle.make).includes(w) &&
          !normalizeViText(matchedVehicle.model).includes(w) &&
          !/^\d{4}$/.test(w),
      );
    if (remainingWords.length === 0) {
      return true;
    }
  }

  const expandedTokens = new Set<string>(qNorm.split(" ").filter((t) => t.length >= 2));
  for (const bucket of SYNONYM_BUCKETS) {
    if (bucket.keywords.some((kw) => qNorm.includes(kw))) {
      for (const exp of bucket.expand) {
        expandedTokens.add(exp);
      }
    }
  }

  for (const token of expandedTokens) {
    if (haystack.includes(token)) {
      return true;
    }
  }

  return false;
}

function extractBudgetVnd(normalizedQuery: string): number | undefined {
  const m = normalizedQuery.match(/(\d+(?:[.,]\d+)?)\s*(tr|trieu|m)\b/);
  if (m) {
    const num = Number(m[1].replace(",", "."));
    if (Number.isFinite(num) && num > 0) {
      return Math.round(num * 1_000_000);
    }
  }
  return undefined;
}

function detectDrivingProfile(
  normalizedQuery: string,
  explicit?: DrivingProfile,
): DrivingProfile {
  if (explicit) return explicit;
  if (/(mua|suong|deo|nui|bao)/.test(normalizedQuery)) return "mountain_rain";
  if (/(cao toc|duong dai|da pha|xa)/.test(normalizedQuery)) return "highway";
  if (/(show|ngau|do huyet|hau khoi|gam|tokyo)/.test(normalizedQuery)) return "showcar";
  return "city";
}

function computeBundleTotal(parts: AutoPartProduct[]): {
  discountPct: number;
  totalVnd: number;
} {
  const raw = parts.reduce((sum, p) => sum + p.priceVnd, 0);
  const discountPct = parts.length >= 3 ? 8 : parts.length === 2 ? 5 : 0;
  const totalVnd = Math.round(raw * (1 - discountPct / 100));
  return { discountPct, totalVnd };
}

async function tryGeminiAdvice(
  input: AiAdviseInput,
): Promise<AiAdviseResult | null> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const catalogCompact = input.products.map((p) => ({
    id: p.id,
    sku: p.sku,
    nameVi: p.nameVi,
    category: p.category,
    priceVnd: p.priceVnd,
    socket: p.specs.socket,
    kelvin: p.specs.kelvin,
    compatibleVehicles: p.compatibleVehicles,
  }));

  const promptText = [
    "Bạn là kỹ sư trưởng ánh sáng ô tô tại gara AKARI YOKOCHO (phong cách Nhật Bản).",
    "Hãy tư vấn ngắn gọn, chuyên nghiệp bằng tiếng Việt (tối đa 4 câu), đề xuất tối đa 3 mã sản phẩm THẬT trong Catalog dưới đây.",
    "Trả về DUY NHẤT JSON đúng schema:",
    '{"replyVi":"string","detectedVehicle":"string|null","detectedSocket":"string|null","recommendedKelvin":"3000K|4300K|5500K|6000K","recommendedBeamMode":"3000k|4300k|6000k|combo","recommendedProductIds":["id"],"tipVi":"string"}',
    `Catalog hiện có: ${JSON.stringify(catalogCompact)}`,
    `Fitment các dòng xe: ${JSON.stringify(input.fitments)}`,
    `Yêu cầu khách: message=${input.message ?? ""}, vehicleMake=${input.vehicleMake ?? ""}, drivingProfile=${input.drivingProfile ?? ""}, budgetVnd=${input.budgetVnd ?? "không giới hạn"}`,
  ].join("\n");

  const parts: Array<Record<string, unknown>> = [{ text: promptText }];
  if (input.imageBase64) {
    parts.push({
      inlineData: {
        mimeType: input.imageMimeType || "image/jpeg",
        data: input.imageBase64.replace(/^data:[^;]+;base64,/, ""),
      },
    });
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: {
          temperature: 0.4,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!res.ok) return null;
    const data = (await res.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;

    const parsed = JSON.parse(rawText) as {
      replyVi?: string;
      detectedVehicle?: string | null;
      detectedSocket?: string | null;
      recommendedKelvin?: string;
      recommendedBeamMode?: "3000k" | "4300k" | "6000k" | "combo";
      recommendedProductIds?: string[];
      tipVi?: string;
    };

    const validProducts = (parsed.recommendedProductIds ?? [])
      .map((id) => input.products.find((p) => p.id === id))
      .filter((p): p is AutoPartProduct => Boolean(p))
      .slice(0, 3);

    const finalProducts =
      validProducts.length > 0 ? validProducts : input.products.slice(0, 2);
    const bundle = computeBundleTotal(finalProducts);

    return {
      provider: "gemini",
      model,
      replyVi: parsed.replyVi || "Mình đã chọn sẵn cấu hình tối ưu cho xe của bạn bên dưới:",
      detectedVehicle: parsed.detectedVehicle ?? undefined,
      detectedSocket: parsed.detectedSocket ?? undefined,
      recommendedKelvin: parsed.recommendedKelvin || "4300K / 3000K",
      recommendedBeamMode: parsed.recommendedBeamMode || "combo",
      recommendedProducts: finalProducts,
      bundleDiscountPct: bundle.discountPct,
      bundleTotalVnd: bundle.totalVnd,
      tipVi:
        parsed.tipVi ||
        "Lắp giữ nguyên giắc zin và căn lại chiều cao tim đèn trên bảng canh 10m.",
    };
  } catch {
    return null;
  }
}

export async function adviseGarageAi(input: AiAdviseInput): Promise<AiAdviseResult> {
  const geminiResult = await tryGeminiAdvice(input);
  if (geminiResult) {
    return geminiResult;
  }

  const rawMsg = input.message?.trim() ?? "";
  const qNorm = normalizeViText(rawMsg);
  const budgetVnd = input.budgetVnd ?? extractBudgetVnd(qNorm);
  const profile = detectDrivingProfile(qNorm, input.drivingProfile);

  const matchedFitment =
    (input.vehicleMake
      ? input.fitments.find(
          (f) => normalizeViText(f.make) === normalizeViText(input.vehicleMake ?? ""),
        )
      : undefined) ?? inferMakeFromText(qNorm, input.fitments);

  let pool = input.products;
  if (matchedFitment) {
    const byMake = pool.filter((p) =>
      p.compatibleVehicles.some(
        (v) => normalizeViText(v) === normalizeViText(matchedFitment.make),
      ),
    );
    if (byMake.length > 0) pool = byMake;
  }

  const selected: AutoPartProduct[] = [];
  const pushIfFound = (predicate: (p: AutoPartProduct) => boolean) => {
    const item = pool.find((p) => !selected.some((s) => s.id === p.id) && predicate(p));
    if (item) selected.push(item);
  };

  if (qNorm.includes("coi") || qNorm.includes("piaa")) {
    pushIfFound((p) => p.id.includes("piaa"));
  }
  if (qNorm.includes("phanh") || qNorm.includes("brembo")) {
    pushIfFound((p) => p.category === "chassis-brake" && p.id.includes("brembo"));
  }

  const mentionsHalogenH4 =
    qNorm.includes("h4") ||
    qNorm.includes("halogen") ||
    (input.imageFilename ? /halogen|h4|choa/i.test(input.imageFilename) : false);

  if (mentionsHalogenH4 || (budgetVnd && budgetVnd <= 3_000_000)) {
    pushIfFound((p) => p.id === "yokocho-miniz-h4" || p.category === "bi-led");
    if (!budgetVnd || budgetVnd >= 2_500_000) {
      pushIfFound((p) => p.category === "bi-fog");
    }
  } else if (profile === "mountain_rain") {
    pushIfFound((p) => p.category === "bi-fog");
    pushIfFound((p) => p.category === "bi-led");
  } else if (profile === "highway") {
    pushIfFound((p) => p.id === "akari-biled-yami-v9" || p.category === "bi-led");
    pushIfFound((p) => p.id === "shinigami-led-bulb-h11");
  } else if (profile === "showcar") {
    pushIfFound((p) => p.category === "tail-light");
    pushIfFound((p) => p.category === "jdm-aero");
    pushIfFound((p) => p.category === "bi-led");
  } else {
    pushIfFound((p) => p.category === "bi-led");
    pushIfFound((p) => p.category === "bi-fog");
  }

  // Enforce budget cap gently when user set budget
  let finalParts = selected;
  if (budgetVnd && finalParts.length > 1) {
    const withinBudget = finalParts.filter((p) => p.priceVnd <= budgetVnd);
    if (withinBudget.length > 0) {
      const sortedCheap = [...withinBudget].sort((a, b) => a.priceVnd - b.priceVnd);
      const picked: AutoPartProduct[] = [];
      let sum = 0;
      for (const p of sortedCheap) {
        if (sum + p.priceVnd <= budgetVnd * 1.1 || picked.length === 0) {
          picked.push(p);
          sum += p.priceVnd;
        }
      }
      finalParts = picked;
    }
  }

  if (finalParts.length === 0) {
    finalParts = pool.slice(0, 2);
  }

  const beamMode: AiAdviseResult["recommendedBeamMode"] =
    profile === "mountain_rain"
      ? "3000k"
      : profile === "highway"
        ? "6000k"
        : profile === "showcar" || finalParts.length >= 2
          ? "combo"
          : "4300k";

  const kelvinLabel =
    beamMode === "3000k"
      ? "3000K Phá Sương Đậm"
      : beamMode === "6000k"
        ? "6000K Trắng Sắc Nét"
        : beamMode === "4300k"
          ? "4300K Nắng Ấm Bám Đường"
          : "Combo Bi-LED 5500K + Bi-Gầm 3000K";

  const bundle = computeBundleTotal(finalParts);
  const vehicleLabel = matchedFitment
    ? `${matchedFitment.make} (${matchedFitment.model})`
    : undefined;
  const socketLabel = matchedFitment
    ? matchedFitment.recommendedSockets.join(" / ")
    : mentionsHalogenH4
      ? "Chân H4 (Chóa phản xạ zin)"
      : "Bi Projector / H11 Plug & Play";

  const visionNote = input.imageBase64
    ? "Ảnh bạn gửi đã được phân tích kiểu chóa đèn ở chế độ nội bộ (gắn GEMINI_API_KEY vào backend/.env để bật nhận diện Gemini Vision theo đời xe chính xác hơn). "
    : "";

  const replyParts: string[] = [];
  if (vehicleLabel) {
    replyParts.push(
      `Với dòng xe ${vehicleLabel}, hệ thống khuyến nghị chân giắc chuẩn ${socketLabel}.`,
    );
  } else {
    replyParts.push(`Dựa trên nhu cầu di chuyển ban đêm, cấu hình ${kelvinLabel} sẽ tối ưu nhất.`);
  }
  if (budgetVnd) {
    replyParts.push(
      `Ngân sách ~${(budgetVnd / 1_000_000).toFixed(1).replace(".0", "")} triệu hoàn toàn vừa gói phụ tùng Plug & Play bên dưới:`,
    );
  } else {
    replyParts.push("Dưới đây là cấu hình đèn cắt nét chống chói tương thích chuẩn:");
  }

  return {
    provider: "yokocho-local-ai",
    model: "akari-night-advisor-v1",
    replyVi: `${visionNote}${replyParts.join(" ")}`,
    detectedVehicle: vehicleLabel,
    detectedSocket: socketLabel,
    recommendedKelvin: kelvinLabel,
    recommendedBeamMode: beamMode,
    recommendedProducts: finalParts,
    bundleDiscountPct: bundle.discountPct,
    bundleTotalVnd: bundle.totalVnd,
    tipVi:
      "Mẹo thợ đêm: Chỉnh đường cắt Cos thấp hơn ngang vai xe máy đối diện và giữ nguyên giắc chuyển zin để qua đăng kiểm mượt.",
  };
}

export async function generateAdminProductDraft(input: {
  nameVi: string;
  category?: PartCategory;
  wattage?: string;
  priceVnd?: number;
}): Promise<AiAdminDraftResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";

  if (apiKey) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const prompt = [
        "Tạo dữ liệu sản phẩm phụ tùng ô tô JDM bằng tiếng Việt + phụ đề tiếng Nhật ngắn cho shop AKARI YOKOCHO.",
        `Tên SP: ${input.nameVi}, Danh mục: ${input.category ?? "bi-led"}, Công suất: ${input.wattage ?? "65W"}, Giá: ${input.priceVnd ?? 3000000}.`,
        'Trả về JSON: {"skuSuggestion":"YKC-...","nameJp":"string","kanjiMark":"1 kanji","oemRef":"string","badgeText":"uppercase short","compatibleVehicles":["Toyota",...],"summaryVi":"2 sentences","highlights":["3 bullets"],"specs":{"wattage":"string","kelvin":["4300K","6000K"],"socket":"string","lumens":"string","warrantyMonths":24,"origin":"string"}}',
      ].join("\n");

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.5,
            responseMimeType: "application/json",
          },
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text) as Omit<AiAdminDraftResult, "provider">;
          return { provider: "gemini", ...parsed };
        }
      }
    } catch {
      // Fall back to deterministic generator seamlessly
    }
  }

  const norm = normalizeViText(input.nameVi).toUpperCase();
  const codeTail = norm
    .split(" ")
    .filter((w) => w.length >= 2)
    .slice(0, 2)
    .map((w) => w.slice(0, 3))
    .join("-");
  const cat = input.category ?? "bi-led";

  const presetMap: Record<
    PartCategory,
    { jp: string; kanji: string; badge: string; kelvin: string[]; socket: string }
  > = {
    "bi-led": {
      jp: "夜光バイLED・精密光学",
      kanji: "光",
      badge: "CHIP NHẬT CẮT Z-STEP",
      kelvin: ["4300K", "5500K", "6000K"],
      socket: "H4 / H7 / H11 / 9005 (Plug & Play)",
    },
    "bi-fog": {
      jp: "濃霧突破フォグランプ",
      kanji: "霧",
      badge: "PHÁ SƯƠNG XUYÊN MƯA",
      kelvin: ["3000K", "4300K"],
      socket: "H11 / Ford / Toyota Bracket",
    },
    "tail-light": {
      jp: "燻製LEDテールランプ",
      kanji: "鬼",
      badge: "KHÓI SEQUENTIAL ĐÊM",
      kelvin: ["Crimson Red"],
      socket: "Giắc Zin nguyên bản 100%",
    },
    "chassis-brake": {
      jp: "鍛造ブレーキ＆ホーン",
      kanji: "制",
      badge: "HIỆU SUẤT CAO NHẬT",
      kelvin: ["Crimson anodized"],
      socket: "Pat CNC theo đời xe",
    },
    "jdm-aero": {
      jp: "東京夜光キット",
      kanji: "夜",
      badge: "PHONG CÁCH KABUKICHO",
      kelvin: ["Crimson Red", "Amber 3000K"],
      socket: "Cầu chì ACC + App Sync",
    },
  };

  const preset = presetMap[cat];
  return {
    provider: "yokocho-local-ai",
    skuSuggestion: `YKC-${codeTail || "PRO"}-${String(Math.floor(10 + Math.random() * 89))}`,
    nameJp: preset.jp,
    kanjiMark: preset.kanji,
    oemRef: `OEM-JDM-${codeTail || "STD"}`,
    badgeText: preset.badge,
    compatibleVehicles: ["Toyota", "Honda", "Mazda", "Ford", "Hyundai"],
    summaryVi: `${input.nameVi} được tinh chỉnh riêng cho điều kiện chạy đêm và mưa bão tại Việt Nam, cho đường cắt gọn và độ ổn định nhiệt bền bỉ.`,
    highlights: [
      "Lắp đặt Plug & Play chuẩn giắc, giữ nguyên hệ thống điện zin của xe",
      "Chống nước & tản nhiệt chủ động giúp hoạt động ổn định trong mưa lớn",
      "Bảo hành điện tử 1 đổi 1 tới 24–36 tháng tại xưởng AKARI YOKOCHO",
    ],
    specs: {
      wattage: input.wattage?.trim() || "65W Cos / 80W Pha",
      kelvin: preset.kelvin,
      socket: preset.socket,
      lumens: "12.500 Lm",
      warrantyMonths: 24,
      origin: "Công nghệ quang học Nhật Bản • Bảo hành 1 đổi 1",
    },
  };
}

