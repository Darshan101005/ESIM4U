import type { MetadataRoute } from "next";
import { blogPosts } from "@/lib/blog";

/**
 * Dynamic sitemap served at /sitemap.xml. Lists the public, indexable pages
 * (marketing, legal, help) plus every blog article. Admin, dashboard, API and
 * auth utility routes are intentionally excluded (they're also blocked in
 * robots.ts). Uses the canonical production domain regardless of environment.
 */

const SITE = "https://esim4u.uk";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes = [
    "", // home
    "/about-us",
    "/affiliate",
    "/contact",
    "/blog",
    "/faq",
    "/help-center",
    "/installation",
    "/download",
    "/terms",
    "/privacy",
    "/refund-policy",
    "/cookie-policy",
  ];

  const pages: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${SITE}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.7,
  }));

  const posts: MetadataRoute.Sitemap = blogPosts.map((p) => ({
    url: `${SITE}/blog/${p.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...pages, ...posts];
}
