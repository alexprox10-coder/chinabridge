import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/client/",
          "/settings/",
          "/demo/",
        ],
      },
    ],
    sitemap: "https://chinabridge.pro/sitemap.xml",
    host: "https://chinabridge.pro",
  };
}
