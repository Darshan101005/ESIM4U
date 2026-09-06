import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/marketing/site-header";
import SiteFooter from "@/components/marketing/site-footer";
import { blogPosts, getPost } from "@/lib/blog";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getSiteSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = getPost(params.slug);
  if (!post) return { title: "Article | eSIM4U" };
  return { title: `${post.title} | eSIM4U`, description: post.excerpt };
}

export default async function BlogArticlePage({ params }: { params: { slug: string } }) {
  const settings = await getSiteSettings();
  if (!settings.features.blog) notFound();

  const post = getPost(params.slug);
  if (!post) notFound();

  const more = blogPosts.filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      <main className="flex-1 w-full">
        <div className="w-full bg-gradient-to-b from-[#FFF4F0] to-white">
          <SiteHeader />
          <div className="max-w-[760px] mx-auto px-5 sm:px-8 pt-4 pb-8 sm:pt-8">
            <Link href="/blog" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#FF561E] mb-6">
              <ArrowLeft className="w-4 h-4" /> Back to Blog
            </Link>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[11px] font-bold uppercase tracking-wide text-[#FF561E] bg-white px-2.5 py-1 rounded-full">
                {post.category}
              </span>
              <span className="text-[12px] text-[#9CA3AF]">{post.date} · {post.readingTime}</span>
            </div>
            <h1 className="text-[30px] sm:text-[40px] leading-[1.12] font-semibold text-[#1A1D20] tracking-[-0.02em]">
              {post.title}
            </h1>
          </div>
        </div>

        <article className="max-w-[760px] mx-auto px-5 sm:px-8 py-10 sm:py-12">
          {post.sections.map((section, i) => (
            <section key={i} className="mb-8">
              {section.heading && (
                <h2 className="text-[22px] font-bold text-[#1A1D20] tracking-tight mb-3">{section.heading}</h2>
              )}
              {section.paragraphs?.map((para, j) => (
                <p key={j} className="text-[16px] leading-[1.85] text-[#374151] mb-4">{para}</p>
              ))}
              {section.bullets && (
                <ul className="list-disc pl-5 space-y-2 text-[16px] leading-[1.8] text-[#374151]">
                  {section.bullets.map((b, k) => <li key={k}>{b}</li>)}
                </ul>
              )}
            </section>
          ))}

          <div className="mt-10 rounded-2xl border border-orange-100 bg-[#FFF4F0] px-6 py-6 text-center">
            <p className="text-[16px] font-bold text-[#1A1D20] mb-1">Ready to travel connected?</p>
            <p className="text-[14px] text-[#6B7280] mb-4">Get a data plan for 200+ countries and stay online the moment you land.</p>
            <Link href="/dashboard/browse" className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full bg-[#FF561E] text-white font-semibold text-[14px] shadow-lg shadow-orange-500/20">
              Browse eSIM plans <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </article>

        {more.length > 0 && (
          <div className="max-w-[760px] mx-auto px-5 sm:px-8 pb-14">
            <h3 className="text-[18px] font-bold text-[#1A1D20] mb-4">Keep reading</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {more.map((p) => (
                <Link key={p.slug} href={`/blog/${p.slug}`} className="group rounded-2xl border border-gray-100 bg-white p-5 hover:border-orange-200 transition-colors">
                  <h4 className="text-[15px] font-bold text-[#1A1D20] group-hover:text-[#FF561E] transition-colors leading-snug">{p.title}</h4>
                  <p className="text-[13px] text-[#6B7280] mt-1.5 line-clamp-2">{p.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
