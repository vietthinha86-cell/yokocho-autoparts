import type {
  AiAdviceResponse,
  AutoPartProduct,
  DrivingProfile,
  VehicleFitment,
} from "@/types/autoparts";

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
    expand: ["bi-fog", "3000k", "kitsune"],
  },
  {
    keywords: ["pha", "chieu xa", "laser", "bi led", "cos", "duong dai", "cao toc"],
    expand: ["bi-led", "yami", "miniz", "shinigami", "osram"],
  },
  {
    keywords: ["coi", "ken", "sen", "piaa"],
    expand: ["piaa", "horn", "kabuki"],
  },
  {
    keywords: ["phanh", "thang", "heo dau", "brembo"],
    expand: ["chassis-brake", "brembo"],
  },
  {
    keywords: ["hau", "duoi", "khoi", "oni"],
    expand: ["tail-light", "oni", "sequential"],
  },
  {
    keywords: ["underbody", "do huyet", "noi that", "led gam"],
    expand: ["jdm-aero", "underbody"],
  },
];

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

  for (const fit of fitments) {
    const makeNorm = normalizeViText(fit.make);
    const modelTokens = fit.model
      .split(/[/,]/)
      .map((m) => normalizeViText(m))
      .filter((m) => m.length >= 2);
    const matchedFitment =
      qNorm.includes(makeNorm) || modelTokens.some((tok) => qNorm.includes(tok));
    if (
      matchedFitment &&
      part.compatibleVehicles.some((v) => normalizeViText(v) === makeNorm)
    ) {
      const leftoverWords = qNorm
        .split(" ")
        .filter(
          (w) =>
            w.length >= 2 &&
            !makeNorm.includes(w) &&
            !normalizeViText(fit.model).includes(w) &&
            !/^\d{4}$/.test(w),
        );
      if (leftoverWords.length === 0) {
        return true;
      }
    }
  }

  const expanded = new Set<string>(qNorm.split(" ").filter((t) => t.length >= 2));
  for (const bucket of SYNONYM_BUCKETS) {
    if (bucket.keywords.some((kw) => qNorm.includes(kw))) {
      for (const word of bucket.expand) {
        expanded.add(word);
      }
    }
  }

  for (const token of expanded) {
    if (haystack.includes(token)) {
      return true;
    }
  }

  return false;
}

export function buildOfflineAiFallback(
  products: AutoPartProduct[],
  fitments: VehicleFitment[],
  payload: {
    message?: string;
    drivingProfile?: DrivingProfile;
    vehicleMake?: string;
  },
): AiAdviceResponse {
  const qNorm = normalizeViText(payload.message ?? "");
  const matchedFit =
    fitments.find((f) =>
      payload.vehicleMake
        ? normalizeViText(f.make) === normalizeViText(payload.vehicleMake)
        : qNorm.includes(normalizeViText(f.make)) ||
          f.model
            .split(/[/,]/)
            .some((m) => qNorm.includes(normalizeViText(m))),
    ) ?? undefined;

  const picked = products
    .filter((p) => {
      if (payload.drivingProfile === "mountain_rain") {
        return p.category === "bi-fog" || p.category === "bi-led";
      }
      if (payload.drivingProfile === "showcar") {
        return p.category === "tail-light" || p.category === "jdm-aero";
      }
      return p.category === "bi-led" || p.category === "bi-fog";
    })
    .slice(0, 2);

  const rawSum = picked.reduce((sum, p) => sum + p.priceVnd, 0);
  const discountPct = picked.length >= 2 ? 5 : 0;

  return {
    provider: "yokocho-local-ai",
    model: "offline-fallback",
    replyVi: matchedFit
      ? `Chế độ dự phòng: Xe ${matchedFit.make} (${matchedFit.model}) dùng chuẩn chân ${matchedFit.recommendedSockets.join(" / ")}. Mình đề xuất 2 món Plug & Play bên dưới:`
      : "Đang chạy chế độ gợi ý nhanh từ danh mục kho. Bạn có thể bấm Thêm vào giỏ hoặc Thử tia sáng ngay:",
    detectedVehicle: matchedFit ? `${matchedFit.make} (${matchedFit.model})` : undefined,
    detectedSocket: matchedFit?.recommendedSockets.join(" / "),
    recommendedKelvin: payload.drivingProfile === "mountain_rain" ? "3000K Phá Sương" : "Combo 5500K + 3000K",
    recommendedBeamMode: payload.drivingProfile === "mountain_rain" ? "3000k" : "combo",
    recommendedProducts: picked,
    bundleDiscountPct: discountPct,
    bundleTotalVnd: Math.round(rawSum * (1 - discountPct / 100)),
    tipVi: "Giắc zin Plug & Play giữ nguyên hệ thống điện và đăng kiểm dễ dàng.",
  };
}

