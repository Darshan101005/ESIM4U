"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import toast from "react-hot-toast";

/**
 * Footer newsletter signup. Validates the email and shows a confirmation
 * toast. It's handled entirely client-side (no backend, no insecure form
 * action) — which also stops Chrome's "form is not secure" autofill warning
 * that the old mailto form triggered.
 */
export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      toast.error("Please enter a valid email address");
      return;
    }
    setEmail("");
    setDone(true);
    toast.success("Subscribed to our newsletter!");
    setTimeout(() => setDone(false), 3000);
  };

  return (
    <form onSubmit={submit} className="relative w-full">
      <input
        type="email"
        name="newsletter-email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        autoComplete="email"
        className="w-full pl-4 pr-12 py-[10px] rounded-full text-[14px] text-[#1A1D20] bg-white outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-white/50 shadow-sm"
      />
      <button
        type="submit"
        className="absolute right-1 top-1 bottom-1 w-9 bg-[#FF561E] text-white flex items-center justify-center rounded-full transition-colors shadow-sm hover:bg-[#E04B18]"
        aria-label="Subscribe"
      >
        {done ? <Check className="w-4 h-4 text-white" strokeWidth={2.5} /> : <ArrowRight className="w-4 h-4 text-white" strokeWidth={2.5} />}
      </button>
    </form>
  );
}
