"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search, X } from "lucide-react";
import type { BlogPost } from "@/lib/blog";

/** Build a lowercase searchable blob from every text field of a post. */
function haystack(p: BlogPost): string {
  const parts: string[] = [p.title, p.excerpt, p.category];
  for (const s of p.sections) {
    if (s.heading) parts.push(s.heading);
    if (s.paragraphs) parts.push(...s.paragraphs);
    if (s.bullets) parts.push(...s.bullets);
  }
  return parts.join(" ").toLowerCase();
}

export default function BlogSearch({ posts }: { posts: BlogPost[] }) {
  const [query, setQuery] = useState("");

  const indexed = useMemo(() => posts.map((post) => ({ post, text: haystack(post) })), [posts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return posts;
    // Keyword search: every whitespace-separated term must appear somewhere.
    const terms = q.split(/\s+/).filter(Boolean);
    return indexed.filter(({ text }) => terms.every((t) => text.includes(t))).map((x) => x.post);
  }, [query, posts, indexed]);

  return (
    <>
      <div className="max-w-[560px] mx-auto mt-6 px-5 sm:px-0">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#9CA3AF]" strokeWidth={2} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles by keyword (e.g. roaming, data, install)"
            className="w-full pl-11 pr-11 py-3 rounded-full bg-white border border-gray-200 text-[14px] text-[#1A1D20] placeholder:text-[#9CA3AF] outline-none focus:border-[#FF561E] focus:ring-2 focus:ring-[#FF561E]/10 transition-all shadow-sm"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-[#1A1D20] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto px-5 sm:px-8 py-10 sm:py-14">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[16px] font-semibold text-[#1A1D20]">No articles match &ldquo;{query}&rdquo;</p>
            <p className="text-[14px] text-[#6B7280] mt-1.5">Try a different keyword like &ldquo;eSIM&rdquo;, &ldquo;roaming&rdquo;, or &ldquo;data&rdquo;.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {filtered.map((post) => (
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
        )}
      </div>
    </>
  );
}
