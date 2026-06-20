"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

export interface FaqItem {
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
}

export default function FaqAccordion({ items }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="flex flex-col gap-4">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={item.question}
            className={`rounded-2xl border bg-white transition-all duration-200 ${
              isOpen ? "border-[#FF561E] shadow-[0_8px_24px_rgba(255,86,30,0.08)]" : "border-gray-200 hover:border-orange-200"
            }`}
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
              aria-expanded={isOpen}
            >
              <span className={`text-[16px] md:text-[17px] font-semibold ${isOpen ? "text-[#FF561E]" : "text-[#1A1D20]"}`}>
                {item.question}
              </span>
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  isOpen ? "bg-[#FF561E] text-white" : "bg-[#FFF4F0] text-[#FF561E]"
                }`}
              >
                {isOpen ? <Minus className="w-4 h-4" strokeWidth={2.5} /> : <Plus className="w-4 h-4" strokeWidth={2.5} />}
              </span>
            </button>
            <div
              className={`grid transition-all duration-300 ease-in-out ${
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <p className="px-6 pb-5 text-[15px] leading-[1.8] text-[#6B7280]">{item.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
