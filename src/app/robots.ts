import type { MetadataRoute } from "next";

const SITE_URL = "https://www.qasro.com";

/**
 * Indexation policy — see docs/seo-architecture.md for the full rationale. Verified
 * live before this existed: GET /robots.txt returned Next's 404 page (no route at
 * all), so every crawler got whatever default behavior it assumes for a missing file.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/dashboard",
        "/agent/dashboard",
        "/agency/dashboard",
        "/developer/dashboard",
        "/login",
        "/register",
        "/oauth",
        "/api",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
