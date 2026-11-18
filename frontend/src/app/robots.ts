import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/san-pham/"],
        disallow: ["/admin", "/admin/", "/tai-khoan", "/dang-nhap"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

