"use client";

import DashboardTopbar from "@/components/dashboard/topbar";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, DollarSign, LogOut, ShieldCheck, LifeBuoy, Mail, Save, UserRound } from "lucide-react";
import toast from "react-hot-toast";
import { signOutAndClear } from "@/lib/auth-client";
import { useCurrency } from "@/lib/currency-context";
import { SUPPORTED_CURRENCIES } from "@/lib/fx";

const GENDERS = ["Male", "Female", "Other", "Prefer not to say"];

/** Whole-year age from a date-of-birth string. */
function ageFrom(dob: string): number | null {
  if (!dob) return null;
  const b = new Date(dob);
  if (Number.isNaN(b.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age >= 0 && age < 130 ? age : null;
}

export default function SettingsPage() {
  const router = useRouter();
  const { currency, setCurrency } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [email, setEmail] = useState("");

  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error();
      const d = await res.json();
      setEmail(d.user?.email || "");
      setPhone(d.profile?.phone || "");
      setDob(d.profile?.date_of_birth ? String(d.profile.date_of_birth).slice(0, 10) : "");
      setGender(d.profile?.gender || "");
    } catch {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() || null, date_of_birth: dob || null, gender: gender || null }),
      });
      if (!res.ok) throw new Error();
      toast.success("Details saved");
    } catch {
      toast.error("Failed to save details");
    } finally {
      setSavingProfile(false);
    }
  };

  const signOut = async () => {
    setSigningOut(true);
    await signOutAndClear();
    router.push("/login");
  };

  const age = ageFrom(dob);
  const inputCls =
    "w-full px-4 py-3 rounded-xl bg-white border border-gray-200 outline-none focus:border-[#FF561E] focus:ring-2 focus:ring-[#FF561E]/10 text-[14px] transition-all";
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
            {/* Billing / currency — applies instantly across the site */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
              <div className="flex items-center gap-2 mb-5">
                <DollarSign className="w-5 h-5 text-[#FF561E]" />
                <h3 className="text-[16px] font-bold text-[#1A1D20]">Billing Preferences</h3>
              </div>
              <label className={labelCls}>Display Currency</label>
              <select
                value={currency}
                onChange={(e) => {
                  setCurrency(e.target.value as (typeof SUPPORTED_CURRENCIES)[number]);
                  toast.success("Currency updated");
                }}
                className={inputCls}
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <p className="text-[12px] text-[#6B7280] mt-2">Prices across the site load in this currency each time you visit.</p>
            </div>

            {/* Personal details */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
              <div className="flex items-center gap-2 mb-5">
                <UserRound className="w-5 h-5 text-[#FF561E]" />
                <h3 className="text-[16px] font-bold text-[#1A1D20]">Personal details</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelCls}>Mobile number</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+44 7123 456789" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Date of birth</label>
                  <input
                    type="date"
                    value={dob}
                    max={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setDob(e.target.value)}
                    className={inputCls}
                  />
                  {age !== null && <p className="text-[12px] text-[#6B7280] mt-1.5">Age: <span className="font-semibold text-[#1A1D20]">{age}</span></p>}
                </div>
                <div>
                  <label className={labelCls}>Gender</label>
                  <select value={gender} onChange={(e) => setGender(e.target.value)} className={inputCls}>
                    <option value="">Select…</option>
                    {GENDERS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={saveProfile}
                disabled={savingProfile}
                className="inline-flex items-center gap-2 mt-5 px-5 py-3 rounded-xl bg-[#FF561E] text-white text-[14px] font-bold hover:bg-[#E04B18] transition-colors shadow-sm shadow-orange-500/20 disabled:opacity-70"
              >
                {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save details
              </button>
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
