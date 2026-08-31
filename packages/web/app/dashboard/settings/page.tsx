"use client";

import DashboardTopbar from "@/components/dashboard/topbar";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, DollarSign, LogOut, ShieldCheck, LifeBuoy, Mail, UserRound } from "lucide-react";
import toast from "react-hot-toast";
import { signOutAndClear } from "@/lib/auth-client";
import { useCurrency } from "@/lib/currency-context";
import { SUPPORTED_CURRENCIES } from "@/lib/fx";
import SelectMenu from "@/components/admin/select-menu";

export default function SettingsPage() {
  const router = useRouter();
  const { currency, setCurrency } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [email, setEmail] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error();
      const d = await res.json();
      setEmail(d.user?.email || "");
    } catch {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const signOut = async () => {
    setSigningOut(true);
    await signOutAndClear();
    router.push("/login");
  };

  const labelCls = "block text-[13px] font-medium text-[#6B7280] mb-2";

  return (
    <>
      <DashboardTopbar title="Settings" />
      <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8 max-w-3xl mx-auto w-full">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#FF561E] animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Personal details live on the Profile page */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
              <div className="flex items-center gap-2 mb-2">
                <UserRound className="w-5 h-5 text-[#FF561E]" />
                <h3 className="text-[16px] font-bold text-[#1A1D20]">Personal details</h3>
              </div>
              <p className="text-[13px] text-[#6B7280] mb-4">Update your name, mobile number, date of birth and gender on your profile.</p>
              <Link
                href="/dashboard/profile"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-gray-200 text-[14px] font-bold text-[#1A1D20] hover:border-[#FF561E] hover:text-[#FF561E] transition-colors"
              >
                <UserRound className="w-4 h-4" /> Edit profile
              </Link>
            </div>

            {/* Billing / currency — applies instantly across the site */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
              <div className="flex items-center gap-2 mb-5">
                <DollarSign className="w-5 h-5 text-[#FF561E]" />
                <h3 className="text-[16px] font-bold text-[#1A1D20]">Billing Preferences</h3>
              </div>
              <label className={labelCls}>Display Currency</label>
              <div className="max-w-xs">
                <SelectMenu
                  value={currency}
                  onChange={(v) => {
                    setCurrency(v as (typeof SUPPORTED_CURRENCIES)[number]);
                    toast.success("Currency updated");
                  }}
                  options={SUPPORTED_CURRENCIES.map((c) => ({ value: c, label: c }))}
                />
              </div>
              <p className="text-[12px] text-[#6B7280] mt-2">Prices across the site load in this currency each time you visit.</p>
            </div>

            {/* Account & security */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
              <div className="flex items-center gap-2 mb-5">
                <ShieldCheck className="w-5 h-5 text-[#FF561E]" />
                <h3 className="text-[16px] font-bold text-[#1A1D20]">Account &amp; Security</h3>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <Mail className="w-4 h-4 text-[#6B7280] shrink-0" />
                  <span className="text-[14px] font-medium text-[#1A1D20] truncate">{email}</span>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-semibold shrink-0">Verified</span>
              </div>
              <button
                onClick={signOut}
                disabled={signingOut}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-red-50 text-red-500 border border-red-100 text-[14px] font-bold hover:bg-red-100 transition-colors disabled:opacity-70"
              >
                {signingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                Sign Out
              </button>
            </div>

            {/* Help */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
              <div className="flex items-center gap-2 mb-4">
                <LifeBuoy className="w-5 h-5 text-[#FF561E]" />
                <h3 className="text-[16px] font-bold text-[#1A1D20]">Help &amp; Support</h3>
              </div>
              <p className="text-[14px] text-[#6B7280] mb-3">Need help with your eSIM or an order? Reach our support team.</p>
              <a href="mailto:support@esim4u.uk" className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#FF561E] hover:text-[#E04B18] transition-colors">
                <Mail className="w-4 h-4" /> support@esim4u.uk
              </a>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
