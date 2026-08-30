"use client";

import DashboardTopbar from "@/components/dashboard/topbar";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, DollarSign, LogOut, ShieldCheck, LifeBuoy, Mail, Save } from "lucide-react";
import toast from "react-hot-toast";
import { signOutAndClear } from "@/lib/auth-client";

const CURRENCIES = ["USD", "EUR", "GBP"];

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [currency, setCurrency] = useState("USD");
  const [email, setEmail] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error();
      const d = await res.json();
      setCurrency(d.profile?.preferred_currency || "USD");
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

  const saveCurrency = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferred_currency: currency }),
      });
      if (!res.ok) throw new Error();
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const signOut = async () => {
    setSigningOut(true);
    await signOutAndClear();
    router.push("/login");
  };

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
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
              <div className="flex items-center gap-2 mb-5">
                <DollarSign className="w-5 h-5 text-[#FF561E]" />
                <h3 className="text-[16px] font-bold text-[#1A1D20]">Billing Preferences</h3>
              </div>
              <label className="block text-[13px] font-medium text-[#6B7280] mb-2">Display Currency</label>
              <div className="flex items-center gap-3">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl bg-white border border-gray-200 outline-none focus:border-[#FF561E] focus:ring-2 focus:ring-[#FF561E]/10 text-[14px] transition-all"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <button
                  onClick={saveCurrency}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#FF561E] text-white text-[14px] font-bold hover:bg-[#E04B18] transition-colors shadow-sm shadow-orange-500/20 disabled:opacity-70"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save
                </button>
              </div>
            </div>

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
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-semibold shrink-0">
                  Verified
                </span>
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

            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
              <div className="flex items-center gap-2 mb-4">
                <LifeBuoy className="w-5 h-5 text-[#FF561E]" />
                <h3 className="text-[16px] font-bold text-[#1A1D20]">Help &amp; Support</h3>
              </div>
              <p className="text-[14px] text-[#6B7280] mb-3">
                Need help with your eSIM or an order? Reach our support team.
              </p>
              <a
                href="mailto:support@esim4u.uk"
                className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#FF561E] hover:text-[#E04B18] transition-colors"
              >
                <Mail className="w-4 h-4" /> support@esim4u.uk
              </a>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
