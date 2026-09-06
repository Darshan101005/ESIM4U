import type { MetadataRoute } from "next";

/**
 * robots.txt served at /robots.txt. Allows crawling of public pages, blocks
 * private/app areas, and points crawlers to the sitemap.
 */

const SITE = "https://esim4u.uk";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/dashboard", "/api/", "/partner/", "/verify-email", "/forgot-password"],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
