import type {
  AiAdviceResponse,
  AiEngineStatus,
  AutoPartProduct,
  BeamModeChoice,
  DrivingProfile,
  OrderRecord,
  ProductReviewRecord,
  ReviewsFeedResponse,
  VehicleBuildCombo,
  VehicleFitment,
} from "@/types/autoparts";
import { buildOfflineAiFallback } from "./smartSearch";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:4000";

export function formatVnd(amount: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(amount)} ₫`;
}

export const FALLBACK_FITMENTS: VehicleFitment[] = [
  {
    make: "Toyota",
    model: "Camry / Vios / Fortuner",
    years: ["2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025"],
    recommendedSockets: ["Bi-LED 3.0 inch", "H11", "9005", "Bi-Gầm 3.0 inch"],
  },
  {
    make: "Honda",
    model: "Civic / CR-V / City",
    years: ["2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024"],
    recommendedSockets: ["Bi-LED 3.0 inch", "H11", "HB3", "5x114.3"],
  },
  {
    make: "Mazda",
    model: "Mazda 3 / CX-5 / Mazda 6",
    years: ["2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025"],
    recommendedSockets: ["Bi-LED 3.0 inch", "D4S", "H11", "Bi-Gầm 3.0 inch"],
  },
  {
    make: "Hyundai",
    model: "Accent / Tucson / SantaFe",
    years: ["2019", "2020", "2021", "2022", "2023", "2024", "2025"],
    recommendedSockets: ["H7", "9005", "Bi-Gầm 3.0 inch", "H4"],
  },
  {
    make: "Ford",
    model: "Ranger / Everest / Territory",
    years: ["2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025"],
    recommendedSockets: ["Bi-LED 3.0 inch", "Bi-Gầm 3.0 inch", "H11"],
  },
  {
    make: "Mitsubishi",
    model: "Xpander / Triton / Pajero Sport",
    years: ["2019", "2020", "2021", "2022", "2023", "2024", "2025"],
    recommendedSockets: ["H4", "H11", "Bi-Gầm 3.0 inch"],
  },
];

export const FALLBACK_PRODUCTS: AutoPartProduct[] = [
  {
    id: "akari-biled-yami-v9",
    slug: "akari-biled-yami-v9",
    sku: "AKR-BL-Y900",
    oemRef: "KOITO-30-PRO-JP",
    nameVi: "Bi-LED Pha Cốt Akari Yami V9 — Laser Đêm Đỏ",
    nameJp: "闇・LEDプロジェクター V9",
    kanjiMark: "闇",
    brand: "AKARI YOKOCHO",
    category: "bi-led",
    priceVnd: 5850000,
    originalPriceVnd: 6500000,
    stockStatus: "in_stock",
    stockQty: 14,
    image: "/images/biled-projector.jpg",
    badgeText: "BÁN CHẠY ĐÊM",
    compatibleVehicles: ["Toyota", "Honda", "Mazda", "Ford", "Hyundai"],
    specs: {
      wattage: "65W Cos / 80W Pha Laser",
      kelvin: ["4300K", "5500K", "6000K"],
      socket: "Bi-LED 3.0 inch (Chân xoáy H4/H7/9005)",
      lumens: "9.800 lm / cặp",
      voltage: "12V - 24V DC",
      warrantyMonths: 36,
      origin: "Thiết kế quang học Nhật Bản • Gia công CNC",
    },
    summaryVi:
      "Thấu kính xanh tím phủ AR đa lớp cắt nét đường chân trời sắc lẹm như lưỡi katana, không gây chói xe đối diện khi đi phố đêm mưa.",
    highlights: [
      "Mặt cắt Cos phẳng chống chói chuẩn Nhật",
      "Quạt tản nhiệt kép vòng bi Nhật Bản siêu êm",
      "Cắm giắc zin Plug & Play không cắt dây",
    ],
  },
  {
    id: "kuro-fog-kitsune-f30",
    slug: "kuro-fog-kitsune-f30",
    sku: "KRO-FG-F300",
    oemRef: "IPF-30-FOG-3K",
    nameVi: "Bi Gầm Phá Sương Kitsune F30 — 3 Nhiệt Màu",
    nameJp: "狐・フォグランプ 3000K",
    kanjiMark: "狐",
    brand: "KURO WORKS",
    category: "bi-fog",
    priceVnd: 3450000,
    originalPriceVnd: 3900000,
    stockStatus: "in_stock",
    stockQty: 22,
    image: "/images/bifog-lamp.jpg",
    badgeText: "CHỐNG NƯỚC IP68",
    compatibleVehicles: ["Toyota", "Honda", "Mazda", "Hyundai", "Ford", "Mitsubishi"],
    specs: {
      wattage: "45W Cos / 55W Trợ Pha",
      kelvin: ["3000K", "4300K", "6000K"],
      socket: "Bi-Gầm 3.0 inch (Pat Toyota / Honda / Ford)",
      lumens: "6.400 lm / cặp",
      voltage: "12V DC",
      warrantyMonths: 24,
      origin: "JDM Spec • Chuẩn kín nước IP68",
    },
    summaryVi:
      "Chuyên trị sương mù đèo dốc và đường mưa ướt nhòe ánh đèn đỏ. Đổi nhanh 3 nhiệt màu 3000K vàng phá sương – 4300K nắng ấm – 6000K trắng lạnh.",
    highlights: [
      "Ngâm nước 1m vẫn hoạt động ổn định",
      "Chế độ 3000K vàng rực xuyên màn sương dày",
      "Lắp đặt khớp pat zin theo từng dòng xe",
    ],
  },
  {
    id: "yokocho-tail-oni-seq",
    slug: "yokocho-tail-oni-seq",
    sku: "YKC-TL-ONI88",
    oemRef: "VALENTI-SMK-SEQ",
    nameVi: "Đèn Hậu LED Khói Oni Sequential — Hiệu Ứng Quét Đỏ",
    nameJp: "鬼・スモークテールランプ",
    kanjiMark: "鬼",
    brand: "AKARI YOKOCHO",
    category: "tail-light",
    priceVnd: 8900000,
    originalPriceVnd: 9800000,
    stockStatus: "low_stock",
    stockQty: 4,
    image: "/images/smoked-taillight.jpg",
    badgeText: "PHIÊN BẢN GIỚI HẠN",
    compatibleVehicles: ["Honda", "Mazda", "Toyota", "Hyundai"],
    specs: {
      wattage: "28W Full LED OLED",
      kelvin: ["Crimson 630nm", "Amber Turn"],
      socket: "Cụm đèn hậu Plug & Play",
      lumens: "Độ sáng chuẩn ECE R7",
      voltage: "12V DC + Canbus chống báo lỗi",
      warrantyMonths: 24,
      origin: "JDM Midnight Style • Kính khói PC chống UV",
    },
    summaryVi:
      "Dải LED đỏ huyết chạy tuần tự lúc khởi động như dãy đèn lồng phố đêm Kabukicho, chóa khói tối đầy ma mị nhưng độ xuyên sáng ban ngày vẫn cực cao.",
    highlights: [
      "Hiệu ứng Welcome Breathing khi mở khóa xe",
      "Xi-nhan chạy đuổi Sequential mượt không giật",
      "Tích hợp điện trở Canbus chuẩn zin không báo lỗi táp-lô",
    ],
  },
  {
    id: "shinigami-led-bulb-h11",
    slug: "shinigami-led-bulb-h11",
    sku: "SHN-LB-H1165",
    oemRef: "PIAA-H11-6000",
    nameVi: "Bóng LED Tăng Sáng Shinigami H11/H7/9005 — Chip Osram",
    nameJp: "死神・高輝度LEDバルブ",
    kanjiMark: "閃",
    brand: "SHINIGAMI OPTICS",
    category: "bi-led",
    priceVnd: 1650000,
    originalPriceVnd: 1950000,
    stockStatus: "in_stock",
    stockQty: 38,
    image: "/images/shinigami-bulb.jpg",
    badgeText: "LẮP NHANH 10 PHÚT",
    compatibleVehicles: ["Toyota", "Honda", "Hyundai", "Mitsubishi", "Ford"],
    specs: {
      wattage: "55W / bóng",
      kelvin: ["4300K", "6000K"],
      socket: "H4 / H7 / H11 / 9005 / 9006",
      lumens: "7.200 lm / cặp",
      voltage: "12V DC",
      warrantyMonths: 24,
      origin: "Ống đồng dẫn nhiệt kép • Bảo hành điện tử",
    },
    summaryVi:
      "Giải pháp thay bóng halogen zin nhanh gọn trong 10 phút không cần mở mặt kính đèn. Tâm tim LED trùng khớp tiêu cự chóa zin.",
    highlights: [
      "Thân hợp kim CNC 6063 nhỏ gọn vừa chụp cao su zin",
      "Tăng sáng gấp 3.5 lần bóng Halogen nguyên bản",
      "Đủ mọi chân bóng phổ biến cho xe Nhật & Hàn",
    ],
  },
  {
    id: "yokocho-miniz-h4",
    slug: "yokocho-miniz-h4",
    sku: "YKC-MZ-H450",
    oemRef: "STANLEY-MINI-H4",
    nameVi: "Bi-LED Mini H4 Chân Xoáy Yokocho Mini-Z — Giữ Chóa Zin",
    nameJp: "極小H4プロジェクター・零",
    kanjiMark: "零",
    brand: "AKARI YOKOCHO",
    category: "bi-led",
    priceVnd: 2450000,
    originalPriceVnd: 2850000,
    stockStatus: "in_stock",
    stockQty: 19,
    image: "/images/miniz-h4-bulb.jpg",
    badgeText: "KHÔNG CẮT CHÓA",
    compatibleVehicles: ["Toyota", "Hyundai", "Mitsubishi", "Honda"],
    specs: {
      wattage: "50W Cos / 62W Pha",
      kelvin: ["4300K", "5500K", "6000K"],
      socket: "H4 Plug & Play (Tháo bóng lắp trực tiếp)",
      lumens: "8.100 lm / cặp",
      voltage: "12V DC",
      warrantyMonths: 24,
      origin: "Thấu kính lồi mini gắn liền bóng H4",
    },
    summaryVi:
      "Giải pháp tối ưu cho Vios, Accent, Xpander, City đời đầu muốn có mặt cắt Cos Z-Step sắc nét như Bi-LED nhưng không cần khui đèn.",
    highlights: [
      "Cài chân H4 nguyên bản trong 15 phút, về zin dễ dàng",
      "Đuôi tản nhiệt gọn, vừa chụp cao su chống bụi xe phổ thông",
      "Đường cắt Cos thẳng băng, đá pha gắt tách bạch",
    ],
  },
  {
    id: "tokyogarage-caliper-4pot",
    slug: "tokyogarage-caliper-4pot",
    sku: "TKG-BRK-4P01",
    oemRef: "ENDLESS-4POT-RED",
    nameVi: "Cùm Phanh Nhôm Đúc 4-Piston Akachōchin Edition",
    nameJp: "赤提灯・鍛造4ポットキャリパー",
    kanjiMark: "鍛",
    brand: "TOKYO GARAGE",
    category: "chassis-brake",
    priceVnd: 16800000,
    stockStatus: "jdm_preorder",
    stockQty: 2,
    image: "/images/caliper-4pot.jpg",
    badgeText: "ĐẶT NHẬT 7 NGÀY",
    compatibleVehicles: ["Honda", "Mazda", "Toyota"],
    specs: {
      voltage: 'Tương thích mâm 17" trở lên (5x114.3)',
      warrantyMonths: 36,
      origin: "Nhôm rèn 7075 Anodized Đỏ Huyết • Hàng JDM",
    },
    summaryVi:
      "Cùm phanh 4 piston đối xứng sơn tĩnh điện đỏ thẫm chịu nhiệt 850°C, đi kèm đĩa xẻ rãnh thoát khí và dây dầu thép bện.",
    highlights: [
      "Giảm quãng đường phanh tốc độ cao, chống mất phanh nhiệt",
      "Kèm pat CNC theo đúng mã moay-ơ xe",
      "Phụ kiện kèm má phanh gốm ít bụi mâm",
    ],
  },
  {
    id: "piaa-horn-kabuki",
    slug: "piaa-horn-kabuki",
    sku: "PIA-HRN-4500",
    oemRef: "PIAA-HO14-JP",
    nameVi: "Cặp Còi Sò Đôi Nhật PIAA Bass Horn 400/500Hz — Chống Nước",
    nameJp: "響・防滴ダブルホーン",
    kanjiMark: "響",
    brand: "PIAA JAPAN",
    category: "chassis-brake",
    priceVnd: 1150000,
    originalPriceVnd: 1350000,
    stockStatus: "in_stock",
    stockQty: 28,
    image: "/images/piaa-twin-horn.jpg",
    badgeText: "CHÍNH HÃNG NHẬT",
    compatibleVehicles: ["Toyota", "Honda", "Mazda", "Hyundai", "Ford", "Mitsubishi"],
    specs: {
      wattage: "112dB • Tần số kép 400Hz + 500Hz",
      socket: "Giắc còi 2 chân Plug & Play (kèm rơ-le bảo vệ)",
      voltage: "12V DC",
      warrantyMonths: 24,
      origin: "Thiết kế Nhật Bản • Màng lọc chống mưa lụt",
    },
    summaryVi:
      "Âm thanh còi trầm ấm, vang gọn chuẩn xe sang Nhật Bản — không bị rè khi đi qua vùng ngập nước hay mưa rào.",
    highlights: [
      "Tiếng kép 400Hz + 500Hz dứt khoát, không chói gắt",
      "Miệng loa úp chống nước mưa & bùn bắn khoang máy",
      "Tặng kèm dây chia giắc zin cho các dòng xe Nhật – Hàn",
    ],
  },
  {
    id: "yokocho-underbody-amber",
    slug: "yokocho-underbody-amber",
    sku: "YKC-JDM-GLOW",
    oemRef: "JDM-TOKYO-DRIFT-01",
    nameVi: "Bộ Đèn Gầm & Nội Thất Phố Đêm — App Sync Đỏ Huyết",
    nameJp: "夜光・アンビエントキット",
    kanjiMark: "夜",
    brand: "AKARI YOKOCHO",
    category: "jdm-aero",
    priceVnd: 2290000,
    originalPriceVnd: 2650000,
    stockStatus: "in_stock",
    stockQty: 19,
    image: "/images/underbody-glow.jpg",
    badgeText: "PHONG CÁCH TOKYO",
    compatibleVehicles: ["Toyota", "Honda", "Mazda", "Hyundai", "Ford", "Mitsubishi"],
    specs: {
      wattage: "18W Tiết Kiệm Điện",
      kelvin: ["Crimson Red", "Amber 3000K", "RGBIC"],
      socket: "Cầu chì ACC / App Bluetooth",
      voltage: "12V DC",
      warrantyMonths: 12,
      origin: "Thanh LED bọc silicone chống va đập IP67",
    },
    summaryVi:
      "Tạo vầng sáng đỏ hắt xuống mặt đường ướt đậm chất phim đường phố Tokyo đêm. Chỉnh độ sáng & nhịp thở nhẹ qua điện thoại.",
    highlights: [
      "Chống nước & đá văng gầm xe chuẩn IP67",
      "Lấy nguồn qua tẩu cầu chì phụ, an toàn hệ thống điện",
      "Có công tắc ngắt nhanh khi lưu thông ban ngày",
    ],
  },
];

export const FALLBACK_COMBOS: VehicleBuildCombo[] = [
  {
    id: "combo-civic-midnight",
    vehicleTitle: "Honda Civic — Cấu Hình Phố Đêm 6000K + 3000K",
    jpSubtitle: "シビック・夜戦仕様",
    driverStyle: "Đi phố mưa + Cao tốc ban đêm",
    image: "/images/build-civic-night.jpg",
    recommendedMode: "Combo Bi-LED V9 + Bi-Gầm Kitsune F30",
    descriptionVi:
      "Cặp Bi-LED Yami V9 cắt nét Cos phẳng chống chói kết hợp Bi-Gầm 3000K vàng bám vạch kẻ đường ướt sũng.",
    productIds: ["akari-biled-yami-v9", "kuro-fog-kitsune-f30"],
    bundleDiscountPct: 5,
  },
  {
    id: "combo-ranger-fog-pass",
    vehicleTitle: "Bán Tải Custom (Ranger / Triton) — Cấu Hình Đèo Dốc Sương Mù Dày",
    jpSubtitle: "オフロード・濃霧突破",
    driverStyle: "Off-road đèo núi + Mưa bão lớn",
    image: "/images/build-ranger-rain.jpg",
    recommendedMode: "Bi-Gầm 3000K + Bóng LED + Còi PIAA",
    descriptionVi:
      "Tối ưu gầm cao phá sương bằng Bi-Gầm 3000K công suất 55W kết hợp bóng LED Osram pha xa và còi đôi chống nước.",
    productIds: ["kuro-fog-kitsune-f30", "shinigami-led-bulb-h11", "piaa-horn-kabuki"],
    bundleDiscountPct: 8,
  },
  {
    id: "combo-mazda-kabukicho",
    vehicleTitle: "Mazda 3 — Full Set Kabukicho Đỏ Huyết",
    jpSubtitle: "マツダ3・赤灯フル装備",
    driverStyle: "Showcar đường phố + Đêm Tokyo",
    image: "/images/build-mazda3-tokyo.jpg",
    recommendedMode: "Đèn Hậu Khói Oni + Đèn Gầm Đỏ + Bi-LED V9",
    descriptionVi:
      "Ngoại hình ma mị hoàn chỉnh cả trước và sau: ánh sáng Laser phía trước, hậu quét LED khói và gầm đỏ phản chiếu mặt đường.",
    productIds: ["akari-biled-yami-v9", "yokocho-tail-oni-seq", "yokocho-underbody-amber"],
    bundleDiscountPct: 7,
  },
];

export const FALLBACK_REVIEWS: ProductReviewRecord[] = [
  {
    id: "rev-civic-yami-01",
    productId: "akari-biled-yami-v9",
    customerName: "Minh Quân",
    vehicleInfo: "Honda Civic RS 2023",
    rating: 5,
    title: "Cắt Z-Step cực sắc dưới mưa đêm, không chói xe đối diện",
    comment:
      "Lắp giắc zin trong 40 phút không đụng dây điện. Đi cao tốc Long Thành trời mưa tầm tã vẫn nhìn rõ vạch kẻ đường, đá pha laser rất xa.",
    beamMode: "6000k",
    photoUrl: "/images/build-civic-night.jpg",
    verifiedPurchase: true,
    orderCode: "YKC-DEMO-01",
    status: "approved",
    createdAt: "2026-11-12T14:20:00.000Z",
  },
  {
    id: "rev-ranger-kitsune-02",
    productId: "kuro-fog-kitsune-f30",
    customerName: "Hoàng Hải",
    vehicleInfo: "Ford Ranger Wildtrak 2024",
    rating: 5,
    title: "3000K vàng bám đường đèo sương mù cực tốt",
    comment:
      "Chạy đèo Bảo Lộc sương dày bật 3000K thấy mặt đường ngay, lội nước mưa lớn không bị hấp hơi bên trong thấu kính.",
    beamMode: "3000k",
    photoUrl: "/images/build-ranger-rain.jpg",
    verifiedPurchase: true,
    orderCode: "YKC-DEMO-02",
    status: "approved",
    createdAt: "2026-11-12T19:45:00.000Z",
  },
  {
    id: "rev-mazda-oni-03",
    productId: "yokocho-tail-oni-seq",
    customerName: "Tuấn Kiệt",
    vehicleInfo: "Mazda 3 Signature 2023",
    rating: 5,
    title: "Đuôi khói OLED quét đỏ cực ngầu phong cách Tokyo",
    comment:
      "Buổi tối bật đề mi hiệu ứng quét LED nhìn sang và ma mị hẳn, Canbus không báo lỗi trên taplo Mazda.",
    beamMode: "combo",
    photoUrl: "/images/build-mazda3-tokyo.jpg",
    verifiedPurchase: true,
    orderCode: "YKC-DEMO-03",
    status: "approved",
    createdAt: "2026-11-13T11:10:00.000Z",
  },
  {
    id: "rev-xpander-miniz-04",
    productId: "yokocho-miniz-h4",
    customerName: "Quốc Bảo",
    vehicleInfo: "Mitsubishi Xpander 2022",
    rating: 4,
    title: "Lắp vừa zin chóa H4 không cần đục khoét",
    comment:
      "Thay tại nhà rất gọn, ánh sáng 4300K ấm mắt dễ chịu khi đi phố và đi tỉnh ban đêm, sáng hơn bóng zin rõ rệt.",
    beamMode: "4300k",
    photoUrl: "/images/miniz-h4-bulb.jpg",
    verifiedPurchase: true,
    orderCode: "YKC-DEMO-04",
    status: "approved",
    createdAt: "2026-11-13T20:15:00.000Z",
  },
];

export interface CatalogResponse {
  products: AutoPartProduct[];
  fitments: VehicleFitment[];
  combos: VehicleBuildCombo[];
  apiConnected: boolean;
}

export async function fetchCatalogData(): Promise<CatalogResponse> {
  try {
    const [prodRes, fitRes, comboRes] = await Promise.all([
      fetch(`${API_BASE_URL}/api/products`, { cache: "no-store" }),
      fetch(`${API_BASE_URL}/api/fitments`, { cache: "no-store" }),
      fetch(`${API_BASE_URL}/api/combos`, { cache: "no-store" }),
    ]);

    if (!prodRes.ok || !fitRes.ok) {
      throw new Error("API unavailable");
    }

    const prodData = (await prodRes.json()) as { items: AutoPartProduct[] };
    const fitData = (await fitRes.json()) as { items: VehicleFitment[] };
    const comboData = comboRes.ok
      ? ((await comboRes.json()) as { items: VehicleBuildCombo[] })
      : { items: FALLBACK_COMBOS };

    return {
      products: prodData.items,
      fitments: fitData.items,
      combos: comboData.items,
      apiConnected: true,
    };
  } catch {
    return {
      products: FALLBACK_PRODUCTS,
      fitments: FALLBACK_FITMENTS,
      combos: FALLBACK_COMBOS,
      apiConnected: false,
    };
  }
}

export async function fetchProductBySlug(slug: string): Promise<{
  product: AutoPartProduct | null;
  related: AutoPartProduct[];
  apiConnected: boolean;
}> {
  try {
    const [itemRes, listRes] = await Promise.all([
      fetch(`${API_BASE_URL}/api/products/${encodeURIComponent(slug)}`, {
        cache: "no-store",
      }),
      fetch(`${API_BASE_URL}/api/products`, { cache: "no-store" }),
    ]);

    if (!itemRes.ok) {
      return { product: null, related: FALLBACK_PRODUCTS.slice(0, 3), apiConnected: true };
    }

    const itemData = (await itemRes.json()) as { item: AutoPartProduct };
    const allItems = listRes.ok
      ? ((await listRes.json()) as { items: AutoPartProduct[] }).items
      : FALLBACK_PRODUCTS;

    return {
      product: itemData.item,
      related: allItems.filter((p) => p.slug !== itemData.item.slug).slice(0, 3),
      apiConnected: true,
    };
  } catch {
    const found =
      FALLBACK_PRODUCTS.find((p) => p.slug === slug || p.id === slug) ?? null;
    return {
      product: found,
      related: FALLBACK_PRODUCTS.filter((p) => p.slug !== slug).slice(0, 3),
      apiConnected: false,
    };
  }
}

export async function submitOrder(payload: {
  customerName: string;
  phone: string;
  vehicleInfo: string;
  shippingAddress: string;
  note?: string;
  items: Array<{ productId: string; quantity: number; selectedKelvin?: string }>;
}): Promise<{ ok: boolean; order?: OrderRecord; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { item?: OrderRecord; error?: string };
    if (!res.ok || !data.item) {
      return { ok: false, error: data.error ?? "Không thể tạo đơn hàng." };
    }
    return { ok: true, order: data.item };
  } catch {
    return {
      ok: false,
      error: "Không kết nối được Backend API (localhost:4000). Hãy khởi chạy backend để tạo đơn thật.",
    };
  }
}

export async function lookupOrder(orderCode: string): Promise<{
  ok: boolean;
  order?: OrderRecord;
  error?: string;
}> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/orders/${encodeURIComponent(orderCode.trim())}`,
      { cache: "no-store" },
    );
    const data = (await res.json()) as { item?: OrderRecord; error?: string };
    if (!res.ok || !data.item) {
      return { ok: false, error: data.error ?? "Không tìm thấy mã đơn." };
    }
    return { ok: true, order: data.item };
  } catch {
    return {
      ok: false,
      error: "Chưa kết nối Backend API (localhost:4000) để tra cứu đơn hàng.",
    };
  }
}

export async function requestAiAdvice(
  payload: {
    message?: string;
    vehicleMake?: string;
    drivingProfile?: DrivingProfile;
    budgetVnd?: number;
    imageBase64?: string;
    imageMimeType?: string;
    imageFilename?: string;
  },
  fallbackProducts: AutoPartProduct[],
  fallbackFitments: VehicleFitment[],
): Promise<AiAdviceResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/ai/advise`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { item?: AiAdviceResponse };
    if (!res.ok || !data.item) {
      throw new Error("AI endpoint unavailable");
    }
    return data.item;
  } catch {
    return buildOfflineAiFallback(fallbackProducts, fallbackFitments, payload);
  }
}

export async function fetchAiEngineStatus(): Promise<AiEngineStatus | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/ai/status`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { item?: AiEngineStatus };
    return data.item ?? null;
  } catch {
    return null;
  }
}

export async function fetchPublicReviews(
  productId?: string,
): Promise<ReviewsFeedResponse & { apiConnected: boolean }> {
  try {
    const url = productId
      ? `${API_BASE_URL}/api/reviews?productId=${encodeURIComponent(productId)}`
      : `${API_BASE_URL}/api/reviews`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Reviews endpoint unavailable");
    const data = (await res.json()) as ReviewsFeedResponse;
    return { ...data, apiConnected: true };
  } catch {
    const items = productId
      ? FALLBACK_REVIEWS.filter((r) => r.productId === productId)
      : FALLBACK_REVIEWS;
    const averageRating =
      items.length > 0
        ? Number((items.reduce((s, r) => s + r.rating, 0) / items.length).toFixed(1))
        : 5.0;
    return {
      items,
      total: items.length,
      averageRating,
      verifiedCount: items.filter((r) => r.verifiedPurchase).length,
      apiConnected: false,
    };
  }
}

export async function submitCustomerReview(payload: {
  productId: string;
  customerName: string;
  vehicleInfo: string;
  rating: number;
  title?: string;
  comment: string;
  beamMode?: BeamModeChoice;
  orderCode?: string;
  photoUrl?: string;
}): Promise<{ ok: boolean; item?: ProductReviewRecord; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { item?: ProductReviewRecord; error?: string };
    if (!res.ok || !data.item) {
      return { ok: false, error: data.error ?? "Không thể gửi đánh giá." };
    }
    return { ok: true, item: data.item };
  } catch {
    return {
      ok: false,
      error: "Không kết nối được Backend API (localhost:4000) để lưu đánh giá.",
    };
  }
}
