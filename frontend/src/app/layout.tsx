import type { Metadata } from "next";
import { Be_Vietnam_Pro, JetBrains_Mono, Noto_Serif_JP } from "next/font/google";
import "./globals.css";

const beVietnam = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

const notoSerifJp = Noto_Serif_JP({
  subsets: ["latin"],
  weight: ["500", "700", "900"],
  variable: "--font-serif-jp",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "AKARI YOKOCHO // 赤灯横丁 — Phụ Tùng & Đèn Ô Tô Phong Cách Nhật Đêm",
  description:
    "Cửa hàng phụ tùng ô tô, đèn Bi-LED, Bi-Gầm phá sương và đồ chơi JDM phong cách ma mị phố đèn đỏ Nhật Bản.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${beVietnam.variable} ${notoSerifJp.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-[family-name:var(--font-sans)] antialiased selection:bg-[#e11d2e] selection:text-white">
        {children}
      </body>
    </html>
  );
}

