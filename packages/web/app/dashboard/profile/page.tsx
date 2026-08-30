"use client";

import DashboardTopbar from "@/components/dashboard/topbar";
import { useEffect, useState, useCallback } from "react";
import { Loader2, User, Mail, Phone, Globe, Calendar, Save } from "lucide-react";
import toast from "react-hot-toast";

interface ProfileData {
  user: { id: string; name: string; email: string; createdAt?: string };
  profile: { phone: string | null; preferred_currency: string; country: string | null };
}

const CURRENCIES = ["USD", "EUR", "GBP"];

export default function ProfilePage() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [currency, setCurrency] = useState("USD");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error();
      const d: ProfileData = await res.json();
      setData(d);
      setPhone(d.profile.phone || "");
      setCountry(d.profile.country || "");
      setCurrency(d.profile.preferred_currency || "USD");
    } catch {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, country, preferred_currency: currency }),
      });
      if (!res.ok) throw new Error();
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <DashboardTopbar title="Profile" />
      <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8 max-w-3xl mx-auto w-full">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#FF561E] animate-spin" />
          </div>
        ) : data ? (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF561E] to-[#FF7A45] flex items-center justify-center">
                  <span className="text-white text-[24px] font-bold">
                    {(data.user.name || data.user.email).charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="text-[20px] font-bold text-[#1A1D20]">{data.user.name || "Customer"}</h2>
                  <p className="text-[14px] text-[#6B7280]">{data.user.email}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
              <h3 className="text-[16px] font-bold text-[#1A1D20] mb-5">Account Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <ReadOnlyField icon={User} label="Full Name" value={data.user.name || "—"} />
                <ReadOnlyField icon={Mail} label="Email" value={data.user.email} />
                <ReadOnlyField
                  icon={Calendar}
                  label="Member Since"
                  value={data.user.createdAt ? new Date(data.user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—"}
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
              <h3 className="text-[16px] font-bold text-[#1A1D20] mb-5">Preferences</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="flex items-center gap-2 text-[13px] font-medium text-[#6B7280] mb-2">
                    <Phone className="w-4 h-4" /> Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 234 567 890"
                    className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 outline-none focus:border-[#FF561E] focus:ring-2 focus:ring-[#FF561E]/10 text-[14px] transition-all"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-[13px] font-medium text-[#6B7280] mb-2">
                    <Globe className="w-4 h-4" /> Country
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Your country"
                    className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 outline-none focus:border-[#FF561E] focus:ring-2 focus:ring-[#FF561E]/10 text-[14px] transition-all"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-[13px] font-medium text-[#6B7280] mb-2">
                    Preferred Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 outline-none focus:border-[#FF561E] focus:ring-2 focus:ring-[#FF561E]/10 text-[14px] transition-all"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={save}
                disabled={saving}
                className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#FF561E] text-white text-[14px] font-bold hover:bg-[#E04B18] transition-colors shadow-sm shadow-orange-500/20 disabled:opacity-70"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>
        ) : null}
      </main>
    </>
  );
}

function ReadOnlyField({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div>
      <label className="flex items-center gap-2 text-[13px] font-medium text-[#6B7280] mb-2">
        <Icon className="w-4 h-4" /> {label}
      </label>
      <div className="px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-[14px] font-medium text-[#1A1D20]">
        {value}
      </div>
    </div>
  );
}
