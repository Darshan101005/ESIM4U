"use client";

import DashboardTopbar from "@/components/dashboard/topbar";
import { useEffect, useState, useCallback } from "react";
import { Loader2, User, Mail, Phone, Globe, Calendar, Save, Cake, Users } from "lucide-react";
import toast from "react-hot-toast";
import SelectMenu from "@/components/admin/select-menu";
import { clearSessionCache } from "@/lib/auth-client";

interface ProfileData {
  user: { id: string; name: string; email: string; createdAt?: string };
  profile: {
    phone: string | null;
    preferred_currency: string;
    country: string | null;
    date_of_birth: string | null;
    gender: string | null;
  };
}

const GENDER_OPTIONS = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
  { value: "Prefer not to say", label: "Prefer not to say" },
];

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

export default function ProfilePage() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error();
      const d: ProfileData = await res.json();
      setData(d);
      setName(d.user.name || "");
      setPhone(d.profile.phone || "");
      setCountry(d.profile.country || "");
      setDob(d.profile.date_of_birth ? String(d.profile.date_of_birth).slice(0, 10) : "");
      setGender(d.profile.gender || "");
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
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || null,
          country: country.trim() || null,
          date_of_birth: dob || null,
          gender: gender || null,
        }),
      });
      if (!res.ok) throw new Error();
      // Refresh the cached session so the new name shows in the sidebar/topbar.
      clearSessionCache();
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const age = ageFrom(dob);
  const inputCls =
    "w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 outline-none focus:border-[#FF561E] focus:ring-2 focus:ring-[#FF561E]/10 text-[14px] transition-all";
  const labelCls = "flex items-center gap-2 text-[13px] font-medium text-[#6B7280] mb-2";

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
            {/* Header */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF561E] to-[#FF7A45] flex items-center justify-center">
                  <span className="text-white text-[24px] font-bold">{(name || data.user.email).charAt(0).toUpperCase()}</span>
                </div>
                <div className="min-w-0">
                  <h2 className="text-[20px] font-bold text-[#1A1D20] truncate">{name || "Customer"}</h2>
                  <p className="text-[14px] text-[#6B7280] truncate">{data.user.email}</p>
                </div>
              </div>
            </div>

            {/* Personal details — editable */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
              <h3 className="text-[16px] font-bold text-[#1A1D20] mb-5">Personal details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className={labelCls}><User className="w-4 h-4" /> Full name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={inputCls} />
                </div>

                <div>
                  <label className={labelCls}><Mail className="w-4 h-4" /> Email</label>
                  <div className="px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-[14px] font-medium text-[#1A1D20] truncate">{data.user.email}</div>
                </div>
                <div>
                  <label className={labelCls}><Calendar className="w-4 h-4" /> Member since</label>
                  <div className="px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-[14px] font-medium text-[#1A1D20]">
                    {data.user.createdAt ? new Date(data.user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—"}
                  </div>
                </div>

                <div>
                  <label className={labelCls}><Phone className="w-4 h-4" /> Mobile number</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+44 7123 456789" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}><Globe className="w-4 h-4" /> Country</label>
                  <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Your country" className={inputCls} />
                </div>

                <div>
                  <label className={labelCls}><Cake className="w-4 h-4" /> Date of birth</label>
                  <input type="date" value={dob} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDob(e.target.value)} className={inputCls} />
                  {age !== null && <p className="text-[12px] text-[#6B7280] mt-1.5">Age: <span className="font-semibold text-[#1A1D20]">{age}</span></p>}
                </div>
                <div>
                  <label className={labelCls}><Users className="w-4 h-4" /> Gender</label>
                  <SelectMenu value={gender} onChange={setGender} options={GENDER_OPTIONS} placeholder="Select…" />
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
