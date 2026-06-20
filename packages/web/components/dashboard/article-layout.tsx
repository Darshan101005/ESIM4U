"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export interface TocItem {
  id: string;
  label: string;
}

interface ArticleLayoutProps {
  backHref: string;
  backLabel: string;
  eyebrow: string;
  title: string;
  intro?: string;
  icon: React.ReactNode;
  sections: TocItem[];
  children: React.ReactNode;
}

export default function ArticleLayout({
  backHref,
  backLabel,
  eyebrow,
  title,
  intro,
  icon,
  sections,
  children,
}: ArticleLayoutProps) {
  const [active, setActive] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const setActiveFromScroll = () => {
      const atBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 4;
      if (atBottom) {
        setActive(sections[sections.length - 1]?.id ?? "");
        return true;
      }
      return false;
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (setActiveFromScroll()) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-100px 0px -65% 0px", threshold: 0 }
    );

    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });

    window.addEventListener("scroll", setActiveFromScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", setActiveFromScroll);
    };
  }, [sections]);

  const handleClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top, behavior: "smooth" });
    setActive(id);
  };

  return (
    <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8">
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#6B7280] hover:text-[#FF561E] transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> {backLabel}
      </Link>

      <div className="flex items-center gap-4 mb-10">
        <div className="w-14 h-14 flex items-center justify-center shrink-0">{icon}</div>
        <div>
          <p className="text-[12px] uppercase tracking-wide text-[#FF561E] font-bold">{eyebrow}</p>
          <h1 className="text-[26px] lg:text-[32px] font-bold text-[#1A1D20] tracking-tight leading-tight">{title}</h1>
        </div>
      </div>

      <div className="flex gap-10 xl:gap-16">
        <aside className="hidden lg:block w-[240px] shrink-0">
          <div className="sticky top-[90px]">
            <p className="text-[12px] uppercase tracking-wide text-[#6B7280] font-semibold mb-5">In this article</p>
            <nav className="relative">
              <span className="absolute left-[5px] top-2 bottom-2 w-px bg-gray-200" aria-hidden="true" />
              <ul className="space-y-1">
                {sections.map((s) => {
                  const isActive = active === s.id;
                  return (
                    <li key={s.id} className="relative">
                      <a
                        href={`#${s.id}`}
                        onClick={(e) => handleClick(e, s.id)}
                        className="group flex items-start gap-3 py-2 pl-0"
                      >
                        <span
                          className={`mt-[5px] w-[11px] h-[11px] rounded-full border-2 shrink-0 transition-colors ${
                            isActive ? "border-[#FF561E] bg-[#FF561E]" : "border-gray-300 bg-white group-hover:border-[#FF561E]"
                          }`}
                        />
                        <span
                          className={`text-[13px] leading-snug transition-colors ${
                            isActive ? "font-bold text-[#1A1D20]" : "font-medium text-[#6B7280] group-hover:text-[#FF561E]"
                          }`}
                        >
                          {s.label}
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </aside>

        <article className="flex-1 min-w-0 max-w-[760px]">
          {intro && <p className="text-[15px] leading-[1.85] text-[#6B7280] mb-10">{intro}</p>}
          <div className="space-y-12">{children}</div>
        </article>
      </div>
    </main>
  );
}
