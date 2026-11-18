import type { Metadata } from "next";
import { Be_Vietnam_Pro, JetBrains_Mono, Lexend, Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const beVietnam = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-be-vietnam",
});

const lexend = Lexend({
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-lexend",
});

const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["500", "700", "900"],
  variable: "--font-noto-jp",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jetbrains",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "AKARI YOKOCHO // 赤灯横丁 — Phụ Tùng & Đèn Ô Tô Phong Cách Nhật Đêm",
    template: "%s | AKARI YOKOCHO",
  },
  description:
    "Cửa hàng phụ tùng ô tô, đèn Bi-LED, Bi-Gầm phá sương và đồ chơi JDM phong cách ma mị phố đèn đỏ Nhật Bản. Tra cứu chân đèn chuẩn theo xe & Akari AI Vision.",
  keywords: [
    "Akari Yokocho",
    "Bi-LED ô tô",
    "Bi-Gầm phá sương",
    "phụ tùng JDM",
    "đèn pha ô tô",
    "cụm phanh 4 piston",
    "đèn hậu LED khói",
  ],
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: SITE_URL,
    siteName: "AKARI YOKOCHO // 赤灯横丁",
    title: "AKARI YOKOCHO // 赤灯横丁 — Phụ Tùng & Đèn Ô Tô Nhật Đêm",
    description:
      "Hệ thống ánh sáng Bi-LED, Bi-Gầm phá sương 3 chế độ nhiệt màu, giả lập ánh sáng mưa đêm & trợ lý gara Akari AI Vision.",
    images: [
      {
        url: "/images/hero-yokocho.jpg",
        width: 1200,
        height: 630,
        alt: "AKARI YOKOCHO Midnight Garage & JDM Lighting",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AKARI YOKOCHO // 赤灯横丁 — Phụ Tùng & Đèn Ô Tô Nhật Đêm",
    description:
      "Nâng cấp ánh sáng Bi-LED, Bi-Gầm JDM, kiểm tra chân đèn chuẩn form xe & tư vấn qua AI Vision.",
    images: ["/images/hero-yokocho.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${beVietnam.variable} ${lexend.variable} ${notoSansJp.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans antialiased selection:bg-[#e11d2e] selection:text-white">
        {children}
      </body>
    </html>
  );
}
