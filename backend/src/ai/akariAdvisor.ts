import type {
  AutoPartProduct,
  PartCategory,
  TechnicalSpec,
  VehicleFitment,
} from "../types.ts";

export type DrivingProfile = "city" | "mountain_rain" | "highway" | "showcar";
export type AiProviderId =
  | "gemini"
  | "openai-compatible"
  | "ollama"
  | "yokocho-local-ai";
export type AiModePreference = "auto" | "gemini" | "openai" | "ollama" | "local";

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
  provider: AiProviderId;
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
  fallbackReason?: string;
}

export interface AiAdminDraftResult {
  provider: AiProviderId;
  model?: string;
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

export interface AiEngineStatus {
  modePreference: AiModePreference;
  activeProvider: AiProviderId;
  activeModel: string;
  realAiReady: boolean;
  visionCapable: boolean;
  geminiConfigured: boolean;
  openaiConfigured: boolean;
  ollamaOnline: boolean;
  ollamaModels: string[];
  lastError?: string;
}

const rejectedKeyErrors = new Map<string, string>();
let lastDiagnosticError: string | undefined;

export function clearAiDiagnosticsCache(): void {
  rejectedKeyErrors.clear();
  lastDiagnosticError = undefined;
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

function extractJsonObject<T>(rawText: string): T | null {
  const cleaned = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
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

function getModePreference(): AiModePreference {
  const raw = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (
    raw === "gemini" ||
    raw === "openai" ||
    raw === "ollama" ||
    raw === "local" ||
    raw === "auto"
  ) {
    return raw;
  }
  return "auto";
}

function buildAdvisorPrompt(input: AiAdviseInput, compactForLocal = false): string {
  if (compactForLocal) {
    const catalogLines = input.products
      .map(
        (p) =>
          `- ${p.id}: ${p.nameVi} | ${(p.priceVnd / 1_000_000).toFixed(2)}tr | ${p.category} | ${(p.specs.kelvin ?? []).join("/")} | ${p.compatibleVehicles.join(",")}`,
      )
      .join("\n");

    const qNorm = normalizeViText(`${input.message ?? ""} ${input.vehicleMake ?? ""}`);
    const fitHint = inferMakeFromText(qNorm, input.fitments);
    const fitLine = fitHint
      ? `Fitment khớp: ${fitHint.make} (${fitHint.model}) -> chân ${fitHint.recommendedSockets.join(", ")}`
      : "";

    return [
      "Bạn là kỹ sư trưởng đèn ô tô AKARI YOKOCHO. Tư vấn 2 câu tiếng Việt ngắn gọn, chọn 1-2 id có thật trong danh sách:",
      catalogLines,
      fitLine,
      `Khách hỏi: "${input.message ?? ""}", xe="${input.vehicleMake ?? ""}", gu="${input.drivingProfile ?? "auto"}", nganSach=${input.budgetVnd ?? "tuỳ chọn"}, anh="${input.imageFilename ?? (input.imageBase64 ? "co_anh" : "khong")}".`,
      'Trả về DUY NHẤT JSON: {"replyVi":"string","detectedVehicle":"string|null","detectedSocket":"string|null","recommendedKelvin":"3000K|4300K|6000K","recommendedBeamMode":"3000k|4300k|6000k|combo","recommendedProductIds":["id"],"tipVi":"string"}',
    ]
      .filter(Boolean)
      .join("\n");
  }

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

  return [
    "Bạn là kỹ sư trưởng ánh sáng ô tô tại gara AKARI YOKOCHO (phong cách JDM Nhật Bản).",
    "Hãy tư vấn ngắn gọn, tự nhiên, thực tế bằng tiếng Việt (2–4 câu), chọn 1 đến 3 id sản phẩm THẬT khớp nhất với nhu cầu, dòng xe và ngân sách từ Catalog.",
    "Chỉ trả về DUY NHẤT 1 object JSON hợp lệ (không thêm chữ thừa ngoài JSON) đúng schema sau:",
    '{"replyVi":"string","detectedVehicle":"string|null","detectedSocket":"string|null","recommendedKelvin":"string","recommendedBeamMode":"3000k|4300k|6000k|combo","recommendedProductIds":["id"],"tipVi":"string"}',
    `Catalog hiện có: ${JSON.stringify(catalogCompact)}`,
    `Fitment tham khảo: ${JSON.stringify(input.fitments)}`,
    `Yêu cầu khách hàng: message="${input.message ?? ""}", vehicleMake="${input.vehicleMake ?? ""}", drivingProfile="${input.drivingProfile ?? ""}", budgetVnd=${input.budgetVnd ?? "linh hoạt"}, hasImage=${Boolean(input.imageBase64)}, imageFilename="${input.imageFilename ?? ""}".`,
  ].join("\n");
}

function normalizeAiParsedAdvice(
  parsed: {
    replyVi?: string;
    detectedVehicle?: string | null;
    detectedSocket?: string | null;
    recommendedKelvin?: string;
    recommendedBeamMode?: string;
    recommendedProductIds?: string[];
    tipVi?: string;
  },
  provider: AiProviderId,
  model: string,
  input: AiAdviseInput,
): AiAdviseResult {
  const validProducts = (parsed.recommendedProductIds ?? [])
    .map((id) => input.products.find((p) => p.id === id))
    .filter((p): p is AutoPartProduct => Boolean(p))
    .slice(0, 3);

  const finalProducts =
    validProducts.length > 0 ? validProducts : input.products.slice(0, 2);
  const bundle = computeBundleTotal(finalProducts);

  const validBeam =
    parsed.recommendedBeamMode === "3000k" ||
    parsed.recommendedBeamMode === "4300k" ||
    parsed.recommendedBeamMode === "6000k" ||
    parsed.recommendedBeamMode === "combo"
      ? parsed.recommendedBeamMode
      : "combo";

  const qNorm = normalizeViText(`${input.message ?? ""} ${input.vehicleMake ?? ""}`);
  const matchedFitment =
    (input.vehicleMake
      ? input.fitments.find(
          (f) => normalizeViText(f.make) === normalizeViText(input.vehicleMake ?? ""),
        )
      : undefined) ?? inferMakeFromText(qNorm, input.fitments);

  const canonicalVehicle = matchedFitment
    ? `${matchedFitment.make} (${matchedFitment.model})`
    : parsed.detectedVehicle || undefined;
  const resolvedVehicle =
    canonicalVehicle &&
    parsed.detectedVehicle &&
    !normalizeViText(parsed.detectedVehicle).includes(
      normalizeViText(matchedFitment?.make ?? ""),
    )
      ? canonicalVehicle
      : parsed.detectedVehicle || canonicalVehicle;

  const resolvedSocket =
    parsed.detectedSocket ||
    (matchedFitment ? matchedFitment.recommendedSockets.join(" / ") : undefined);

  return {
    provider,
    model,
    replyVi:
      parsed.replyVi?.trim() ||
      "Mình đã ghép sẵn cấu hình đèn & phụ tùng chuẩn giắc cho xe bạn bên dưới:",
    detectedVehicle: resolvedVehicle,
    detectedSocket: resolvedSocket,
    recommendedKelvin: parsed.recommendedKelvin?.trim() || "4300K / 3000K",
    recommendedBeamMode: validBeam,
    recommendedProducts: finalProducts,
    bundleDiscountPct: bundle.discountPct,
    bundleTotalVnd: bundle.totalVnd,
    tipVi:
      parsed.tipVi?.trim() ||
      "Mẹo thợ đêm: Giữ nguyên giắc chuyển zin và căn mặt cắt Cos thấp hơn ngang vai xe đối diện.",
  };
}

function isOllamaVisionModel(modelName: string): boolean {
  return /(vl|vision|gemma3|llava|moondream|minicpm|qwen3-vl|qwen2\.5vl)/i.test(
    modelName,
  );
}

export async function listOllamaModels(): Promise<{
  online: boolean;
  models: string[];
}> {
  const baseUrl = (
    process.env.OLLAMA_BASE_URL?.trim() || "http://127.0.0.1:11434"
  ).replace(/\/+$/, "");

  try {
    const res = await fetch(`${baseUrl}/api/tags`, {
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) return { online: false, models: [] };
    const data = (await res.json()) as {
      models?: Array<{ name?: string; model?: string }>;
    };
    const names = (data.models ?? [])
      .map((m) => m.name || m.model || "")
      .filter(Boolean);
    return { online: true, models: names };
  } catch {
    return { online: false, models: [] };
  }
}

function pickBestOllamaModel(
  installed: string[],
  needsVision: boolean,
): string | undefined {
  const envVision = process.env.OLLAMA_VISION_MODEL?.trim();
  const envChat = process.env.OLLAMA_MODEL?.trim();

  if (needsVision && envVision && installed.includes(envVision)) {
    return envVision;
  }
  if (needsVision) {
    const visionInstalled = installed.find((m) => isOllamaVisionModel(m));
    if (visionInstalled) return visionInstalled;
  }
  if (envChat && installed.includes(envChat)) {
    return envChat;
  }
  if (envChat && installed.length === 0) {
    return envChat;
  }
  const preferredOrder = needsVision
    ? ["qwen2.5vl:3b", "gemma3:4b", "llava", "moondream", "qwen2.5:3b"]
    : ["qwen2.5:3b", "qwen2.5:1.5b", "llama3.2:3b", "gemma3:4b", "qwen2.5vl:3b"];
  for (const cand of preferredOrder) {
    const found = installed.find((m) => m.startsWith(cand));
    if (found) return found;
  }
  return installed[0];
}

async function tryGeminiAdvice(
  input: AiAdviseInput,
): Promise<AiAdviseResult | null> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
  if (rejectedKeyErrors.has(`gemini:${apiKey}`)) {
    lastDiagnosticError = rejectedKeyErrors.get(`gemini:${apiKey}`);
    return null;
  }

  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const parts: Array<Record<string, unknown>> = [
    { text: buildAdvisorPrompt(input) },
  ];
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
          temperature: 0.35,
          responseMimeType: "application/json",
        },
      }),
      signal: AbortSignal.timeout(18_000),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      const summary = `Gemini HTTP ${res.status}: ${errBody.slice(0, 140)}`;
      lastDiagnosticError = summary;
      if (res.status === 401 || res.status === 403 || res.status === 400) {
        rejectedKeyErrors.set(`gemini:${apiKey}`, summary);
      }
      return null;
    }

    const data = (await res.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;

    const parsed = extractJsonObject<Record<string, unknown>>(rawText);
    if (!parsed) return null;

    lastDiagnosticError = undefined;
    return normalizeAiParsedAdvice(parsed, "gemini", model, input);
  } catch (err) {
    lastDiagnosticError =
      err instanceof Error ? `Gemini error: ${err.message}` : "Gemini error";
    return null;
  }
}

async function tryOpenAiCompatibleAdvice(
  input: AiAdviseInput,
): Promise<AiAdviseResult | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  if (rejectedKeyErrors.has(`openai:${apiKey}`)) {
    lastDiagnosticError = rejectedKeyErrors.get(`openai:${apiKey}`);
    return null;
  }

  const baseUrl = (
    process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1"
  ).replace(/\/+$/, "");
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

  const userContent: Array<Record<string, unknown>> = [
    { type: "text", text: buildAdvisorPrompt(input) },
  ];
  if (input.imageBase64) {
    const cleanDataUrl = input.imageBase64.startsWith("data:")
      ? input.imageBase64
      : `data:${input.imageMimeType || "image/jpeg"};base64,${input.imageBase64}`;
    userContent.push({
      type: "image_url",
      image_url: { url: cleanDataUrl },
    });
  }

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.35,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Bạn là kỹ sư tư vấn phụ tùng đèn ô tô AKARI YOKOCHO. Luôn trả lời JSON hợp lệ.",
          },
          {
            role: "user",
            content: input.imageBase64 ? userContent : buildAdvisorPrompt(input),
          },
        ],
      }),
      signal: AbortSignal.timeout(18_000),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      const summary = `OpenAI-Compatible HTTP ${res.status}: ${errBody.slice(0, 140)}`;
      lastDiagnosticError = summary;
      if (res.status === 401 || res.status === 403) {
        rejectedKeyErrors.set(`openai:${apiKey}`, summary);
      }
      return null;
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const rawText = data.choices?.[0]?.message?.content;
    if (!rawText) return null;

    const parsed = extractJsonObject<Record<string, unknown>>(rawText);
    if (!parsed) return null;

    lastDiagnosticError = undefined;
    return normalizeAiParsedAdvice(parsed, "openai-compatible", model, input);
  } catch (err) {
    lastDiagnosticError =
      err instanceof Error ? `OpenAI error: ${err.message}` : "OpenAI error";
    return null;
  }
}

async function tryOllamaAdvice(
  input: AiAdviseInput,
): Promise<AiAdviseResult | null> {
  const { online, models } = await listOllamaModels();
  if (!online || models.length === 0) {
    return null;
  }

  const baseUrl = (
    process.env.OLLAMA_BASE_URL?.trim() || "http://127.0.0.1:11434"
  ).replace(/\/+$/, "");

  const hasImage = Boolean(input.imageBase64);
  const selectedModel = pickBestOllamaModel(models, hasImage);
  if (!selectedModel) return null;

  const supportsVision = isOllamaVisionModel(selectedModel);
  const userMessage: Record<string, unknown> = {
    role: "user",
    content: buildAdvisorPrompt(input, true),
  };

  if (hasImage && supportsVision && input.imageBase64) {
    userMessage.images = [
      input.imageBase64.replace(/^data:[^;]+;base64,/, ""),
    ];
  }

  try {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: selectedModel,
        stream: false,
        format: "json",
        keep_alive: "30m",
        options: {
          temperature: 0.25,
          num_ctx: hasImage ? 4096 : 2048,
          num_predict: 240,
        },
        messages: [userMessage],
      }),
      signal: AbortSignal.timeout(hasImage ? 120_000 : 60_000),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      lastDiagnosticError = `Ollama HTTP ${res.status}: ${errBody.slice(0, 140)}`;
      return null;
    }

    const data = (await res.json()) as {
      message?: { content?: string };
    };
    const rawText = data.message?.content;
    if (!rawText) return null;

    const parsed = extractJsonObject<Record<string, unknown>>(rawText);
    if (!parsed) return null;

    lastDiagnosticError = undefined;
    return normalizeAiParsedAdvice(parsed, "ollama", selectedModel, input);
  } catch (err) {
    lastDiagnosticError =
      err instanceof Error ? `Ollama error: ${err.message}` : "Ollama error";
    return null;
  }
}

export async function adviseGarageAi(input: AiAdviseInput): Promise<AiAdviseResult> {
  const pref = getModePreference();

  if (pref !== "local") {
    const chain: Array<() => Promise<AiAdviseResult | null>> =
      pref === "gemini"
        ? [() => tryGeminiAdvice(input), () => tryOllamaAdvice(input)]
        : pref === "openai"
          ? [() => tryOpenAiCompatibleAdvice(input), () => tryOllamaAdvice(input)]
          : pref === "ollama"
            ? [() => tryOllamaAdvice(input)]
            : [
                () => tryGeminiAdvice(input),
                () => tryOpenAiCompatibleAdvice(input),
                () => tryOllamaAdvice(input),
              ];

    for (const runner of chain) {
      const result = await runner();
      if (result) {
        return result;
      }
    }
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
    replyVi: replyParts.join(" "),
    detectedVehicle: vehicleLabel,
    detectedSocket: socketLabel,
    recommendedKelvin: kelvinLabel,
    recommendedBeamMode: beamMode,
    recommendedProducts: finalParts,
    bundleDiscountPct: bundle.discountPct,
    bundleTotalVnd: bundle.totalVnd,
    tipVi:
      "Mẹo thợ đêm: Chỉnh đường cắt Cos thấp hơn ngang vai xe máy đối diện và giữ nguyên giắc chuyển zin để qua đăng kiểm mượt.",
    fallbackReason: lastDiagnosticError,
  };
}

export async function generateAdminProductDraft(input: {
  nameVi: string;
  category?: PartCategory;
  wattage?: string;
  priceVnd?: number;
}): Promise<AiAdminDraftResult> {
  const pref = getModePreference();
  const draftPrompt = [
    "Tạo dữ liệu sản phẩm phụ tùng ô tô JDM bằng tiếng Việt + phụ đề tiếng Nhật ngắn cho shop AKARI YOKOCHO.",
    `Tên SP: ${input.nameVi}, Danh mục: ${input.category ?? "bi-led"}, Công suất: ${input.wattage ?? "65W"}, Giá: ${input.priceVnd ?? 3000000}.`,
    'Chỉ trả về JSON: {"skuSuggestion":"YKC-...","nameJp":"string","kanjiMark":"1 kanji","oemRef":"string","badgeText":"uppercase short","compatibleVehicles":["Toyota","Honda"],"summaryVi":"2 câu tiếng Việt","highlights":["3 ý ngắn"],"specs":{"wattage":"string","kelvin":["4300K","6000K"],"socket":"string","lumens":"string","warrantyMonths":24,"origin":"string"}}',
  ].join("\n");

  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const geminiModel = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
  if (
    pref !== "local" &&
    pref !== "ollama" &&
    pref !== "openai" &&
    geminiKey &&
    !rejectedKeyErrors.has(`gemini:${geminiKey}`)
  ) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${encodeURIComponent(geminiKey)}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: draftPrompt }] }],
          generationConfig: {
            temperature: 0.45,
            responseMimeType: "application/json",
          },
        }),
        signal: AbortSignal.timeout(18_000),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        const parsed = text
          ? extractJsonObject<Omit<AiAdminDraftResult, "provider" | "model">>(text)
          : null;
        if (parsed) {
          return { provider: "gemini", model: geminiModel, ...parsed };
        }
      } else if (res.status === 401 || res.status === 403) {
        rejectedKeyErrors.set(`gemini:${geminiKey}`, `Gemini HTTP ${res.status}`);
      }
    } catch {
      // Fallback cleanly
    }
  }

  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  const openaiBase = (
    process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1"
  ).replace(/\/+$/, "");
  const openaiModel = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  if (
    pref !== "local" &&
    pref !== "ollama" &&
    pref !== "gemini" &&
    openaiKey &&
    !rejectedKeyErrors.has(`openai:${openaiKey}`)
  ) {
    try {
      const res = await fetch(`${openaiBase}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: openaiModel,
          temperature: 0.45,
          response_format: { type: "json_object" },
          messages: [{ role: "user", content: draftPrompt }],
        }),
        signal: AbortSignal.timeout(18_000),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const text = data.choices?.[0]?.message?.content;
        const parsed = text
          ? extractJsonObject<Omit<AiAdminDraftResult, "provider" | "model">>(text)
          : null;
        if (parsed) {
          return { provider: "openai-compatible", model: openaiModel, ...parsed };
        }
      }
    } catch {
      // Fallback cleanly
    }
  }

  if (pref === "auto" || pref === "ollama") {
    const { online, models } = await listOllamaModels();
    const ollamaModel = pickBestOllamaModel(models, false);
    if (online && ollamaModel) {
      const ollamaBase = (
        process.env.OLLAMA_BASE_URL?.trim() || "http://127.0.0.1:11434"
      ).replace(/\/+$/, "");
      try {
        const res = await fetch(`${ollamaBase}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: ollamaModel,
            stream: false,
            format: "json",
            keep_alive: "30m",
            options: { temperature: 0.3, num_ctx: 1536, num_predict: 260 },
            messages: [{ role: "user", content: draftPrompt }],
          }),
          signal: AbortSignal.timeout(60_000),
        });
        if (res.ok) {
          const data = (await res.json()) as { message?: { content?: string } };
          const text = data.message?.content;
          const parsed = text
            ? extractJsonObject<Omit<AiAdminDraftResult, "provider" | "model">>(text)
            : null;
          if (parsed && parsed.skuSuggestion && parsed.nameJp) {
            return { provider: "ollama", model: ollamaModel, ...parsed };
          }
        }
      } catch {
        // Fallback cleanly
      }
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
    model: "akari-copywriter-v1",
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

export async function getAiEngineStatus(): Promise<AiEngineStatus> {
  const modePreference = getModePreference();
  const geminiKey = process.env.GEMINI_API_KEY?.trim() ?? "";
  const openaiKey = process.env.OPENAI_API_KEY?.trim() ?? "";
  const geminiRejected = geminiKey
    ? rejectedKeyErrors.get(`gemini:${geminiKey}`)
    : undefined;
  const openaiRejected = openaiKey
    ? rejectedKeyErrors.get(`openai:${openaiKey}`)
    : undefined;

  const geminiConfigured = Boolean(geminiKey) && !geminiRejected;
  const openaiConfigured = Boolean(openaiKey) && !openaiRejected;
  const { online: ollamaOnline, models: ollamaModels } = await listOllamaModels();
  const bestOllamaModel = pickBestOllamaModel(ollamaModels, false);

  let activeProvider: AiProviderId = "yokocho-local-ai";
  let activeModel = "akari-night-advisor-v1";

  if (modePreference === "gemini" && geminiConfigured) {
    activeProvider = "gemini";
    activeModel = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
  } else if (modePreference === "openai" && openaiConfigured) {
    activeProvider = "openai-compatible";
    activeModel = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  } else if (modePreference === "ollama" && ollamaOnline && bestOllamaModel) {
    activeProvider = "ollama";
    activeModel = bestOllamaModel;
  } else if (modePreference === "auto") {
    if (geminiConfigured) {
      activeProvider = "gemini";
      activeModel = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
    } else if (openaiConfigured) {
      activeProvider = "openai-compatible";
      activeModel = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
    } else if (ollamaOnline && bestOllamaModel) {
      activeProvider = "ollama";
      activeModel = bestOllamaModel;
    }
  }

  const visionCapable =
    activeProvider === "gemini" ||
    activeProvider === "openai-compatible" ||
    (activeProvider === "ollama" &&
      ollamaModels.some((m) => isOllamaVisionModel(m)));

  return {
    modePreference,
    activeProvider,
    activeModel,
    realAiReady: activeProvider !== "yokocho-local-ai",
    visionCapable,
    geminiConfigured,
    openaiConfigured,
    ollamaOnline,
    ollamaModels,
    lastError: geminiRejected || openaiRejected || lastDiagnosticError,
  };
}

export async function testLiveAiConnection(): Promise<{
  ok: boolean;
  provider: AiProviderId;
  model: string;
  latencyMs: number;
  reply?: string;
  error?: string;
}> {
  const started = Date.now();
  clearAiDiagnosticsCache();
  const pref = getModePreference();

  const tryGeminiPing = async () => {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) return null;
    const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "Trả lời ngắn gọn: AKARI AI SAN SANG" }] }],
      }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      const err = `Gemini HTTP ${res.status}: ${txt.slice(0, 180)}`;
      lastDiagnosticError = err;
      if (res.status === 401 || res.status === 403 || res.status === 400) {
        rejectedKeyErrors.set(`gemini:${apiKey}`, err);
      }
      return { ok: false as const, provider: "gemini" as const, model, error: err };
    }
    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "OK";
    lastDiagnosticError = undefined;
    return { ok: true as const, provider: "gemini" as const, model, reply };
  };

  const tryOpenAiPing = async () => {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) return null;
    const baseUrl = (
      process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1"
    ).replace(/\/+$/, "");
    const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 32,
        messages: [{ role: "user", content: "Say OK AKARI" }],
      }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      const err = `OpenAI-Compatible HTTP ${res.status}: ${txt.slice(0, 180)}`;
      lastDiagnosticError = err;
      if (res.status === 401 || res.status === 403) {
        rejectedKeyErrors.set(`openai:${apiKey}`, err);
      }
      return {
        ok: false as const,
        provider: "openai-compatible" as const,
        model,
        error: err,
      };
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const reply = data.choices?.[0]?.message?.content?.trim() || "OK";
    lastDiagnosticError = undefined;
    return {
      ok: true as const,
      provider: "openai-compatible" as const,
      model,
      reply,
    };
  };

  const tryOllamaPing = async () => {
    const { online, models } = await listOllamaModels();
    const model = pickBestOllamaModel(models, false) || "none";
    if (!online || models.length === 0) {
      return null;
    }
    const baseUrl = (
      process.env.OLLAMA_BASE_URL?.trim() || "http://127.0.0.1:11434"
    ).replace(/\/+$/, "");
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        stream: false,
        keep_alive: "30m",
        options: { num_ctx: 1024, num_predict: 20 },
        messages: [{ role: "user", content: "Reply: AKARI OK" }],
      }),
      signal: AbortSignal.timeout(45_000),
    });
    if (!res.ok) {
      const err = `Ollama HTTP ${res.status}`;
      return { ok: false as const, provider: "ollama" as const, model, error: err };
    }
    const data = (await res.json()) as { message?: { content?: string } };
    return {
      ok: true as const,
      provider: "ollama" as const,
      model,
      reply: data.message?.content?.trim() || "AKARI OK",
    };
  };

  let lastFail:
    | { ok: false; provider: AiProviderId; model: string; error: string }
    | null = null;

  const attempts =
    pref === "gemini"
      ? [tryGeminiPing]
      : pref === "openai"
        ? [tryOpenAiPing]
        : pref === "ollama"
          ? [tryOllamaPing]
          : pref === "local"
            ? []
            : [tryGeminiPing, tryOpenAiPing, tryOllamaPing];

  for (const fn of attempts) {
    const out = await fn();
    if (!out) continue;
    if (out.ok) {
      return { ...out, latencyMs: Date.now() - started };
    }
    lastFail = out;
  }

  return (
    lastFail ? { ...lastFail, latencyMs: Date.now() - started } : {
      ok: false,
      provider: "yokocho-local-ai",
      model: "akari-night-advisor-v1",
      latencyMs: Date.now() - started,
      error:
        lastDiagnosticError ||
        "Chưa có key Gemini/OpenAI hợp lệ hoặc model Ollama đang chạy.",
    }
  );
}
