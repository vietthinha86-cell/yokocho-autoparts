import type { Metadata } from "next";
import { Be_Vietnam_Pro, Chakra_Petch, JetBrains_Mono, Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const beVietnam = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-be-vietnam",
});

const chakraPetch = Chakra_Petch({
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700"],
  variable: "--font-chakra",
});

const notoSansJp = Noto_Sans_JP({
  subsets: ["latin", "vietnamese"],
  weight: ["500", "700", "900"],
  variable: "--font-noto-jp",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jetbrains",
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
      className={`${beVietnam.variable} ${chakraPetch.variable} ${notoSansJp.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans antialiased selection:bg-[#e11d2e] selection:text-white">
        {children}
      </body>
    </html>
  );
}
