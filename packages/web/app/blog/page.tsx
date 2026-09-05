import type { Metadata } from "next";
import SiteHeader from "@/components/marketing/site-header";
import SiteFooter from "@/components/marketing/site-footer";
import { blogPosts } from "@/lib/blog";
import BlogSearch from "@/components/marketing/blog-search";

export const metadata: Metadata = {
  title: "Blog | eSIM4U",
  description: "Tips, guides, and insights on eSIMs, travel connectivity, and staying online abroad.",
};

export default function BlogPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      <main className="flex-1 w-full">
        <div className="w-full bg-gradient-to-b from-[#FFF4F0] to-white">
          <SiteHeader />
          <div className="max-w-[1000px] mx-auto px-5 sm:px-8 pt-6 pb-8 sm:pt-10 text-center">
            <h1 className="text-[30px] sm:text-[44px] leading-[1.1] font-semibold text-[#1A1D20] tracking-[-0.02em]">
              The eSIM4U <span className="text-[#FF561E] font-serif italic font-normal">Blog</span>
            </h1>
            <p className="mt-4 text-[16px] leading-[1.7] text-[#5E6673] font-medium max-w-[560px] mx-auto">
              Practical guides and tips on eSIMs, roaming, and staying connected wherever you travel.
            </p>
          </div>
        </div>

        <BlogSearch posts={blogPosts} />
      </main>

      <SiteFooter />
    </div>
  );
}
