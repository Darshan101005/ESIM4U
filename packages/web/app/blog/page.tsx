import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/marketing/site-header";
import SiteFooter from "@/components/marketing/site-footer";
import { blogPosts } from "@/lib/blog";
import { ArrowRight } from "lucide-react";

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

        <div className="max-w-[1000px] mx-auto px-5 sm:px-8 py-10 sm:py-14 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {blogPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col rounded-2xl border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 hover:border-orange-200 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wide text-[#FF561E] bg-[#FFF4F0] px-2.5 py-1 rounded-full">
                  {post.category}
                </span>
                <span className="text-[12px] text-[#9CA3AF]">{post.readingTime}</span>
              </div>
              <h2 className="text-[19px] font-bold text-[#1A1D20] leading-snug mb-2 group-hover:text-[#FF561E] transition-colors">
                {post.title}
              </h2>
              <p className="text-[14px] text-[#6B7280] leading-relaxed flex-1">{post.excerpt}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#FF561E]">
                Read article <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
