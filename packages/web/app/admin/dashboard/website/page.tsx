"use client";

import AdminTopbar from "@/components/admin/admin-topbar";
import { useCallback, useEffect, useState } from "react";
import { Loader2, Mail, Phone, Share2, ToggleRight, Save, Wrench } from "lucide-react";
import toast from "react-hot-toast";
import { DEFAULT_SETTINGS, type SiteSettings } from "@/lib/site-settings-types";

const inputCls =
  "w-full px-3.5 py-2.5 rounded-xl bg-[#F9FAFB] border border-gray-200 text-[13.5px] text-[#1A1D20] outline-none focus:border-[#FF561E] focus:ring-2 focus:ring-[#FF561E]/10 transition-all";
const labelCls = "block text-[12px] font-semibold text-[#6B7280] mb-1.5";

function Toggle({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      disabled={disabled}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 disabled:opacity-50 ${on ? "bg-[#FF561E]" : "bg-gray-300"}`}
      aria-pressed={on}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${on ? "translate-x-5" : ""}`} />
    </button>
  );
}

const FEATURES: { key: keyof SiteSettings["features"]; label: string; desc: string }[] = [
  { key: "topup", label: "Wallet Top Up", desc: "Show the Top Up page and its sidebar link." },
  { key: "referrals", label: "Referrals (Refer & Earn)", desc: "Show the referral program page and links." },
  { key: "affiliate", label: "Affiliate page", desc: "Show the public 'Become an affiliate' page and footer link." },
  { key: "blog", label: "Blog", desc: "Show the blog and its links." },
  { key: "cookieConsent", label: "Cookie consent banner", desc: "Show the cookie consent popup on the landing page." },
];

export default function ManageWebsitePage() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [savingContact, setSavingContact] = useState(false);
  const [savingSocials, setSavingSocials] = useState(false);
  const [savingFeature, setSavingFeature] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings/site", { cache: "no-store" });
      if (!res.ok) throw new Error();
      setSettings(await res.json());
    } catch {
      toast.error("Failed to load website settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const put = useCallback(async (partial: Partial<SiteSettings>) => {
    const res = await fetch("/api/admin/settings/site", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partial),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Save failed");
    setSettings(data.settings);
  }, []);

  const saveContact = async () => {
    setSavingContact(true);
    try {
      await put({
        contactEmail: settings.contactEmail.trim(),
        whatsapp: settings.whatsapp.trim(),
      });
      toast.success("Contact details saved");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingContact(false);
    }
  };

  const saveSocials = async () => {
    setSavingSocials(true);
    try {
      await put({ socials: settings.socials });
      toast.success("Social links saved");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingSocials(false);
    }
  };

  const [savingMaint, setSavingMaint] = useState(false);
  const [savingMaintToggle, setSavingMaintToggle] = useState<string | null>(null);

  const toggleMaintenance = async (key: "website" | "bot", value: boolean) => {
    const prev = settings.maintenance[key];
    setSettings((s) => ({ ...s, maintenance: { ...s.maintenance, [key]: value } }));
    setSavingMaintToggle(key);
    try {
      await put({ maintenance: { ...settings.maintenance, [key]: value } });
      toast.success(`${key === "bot" ? "Bot" : "Website"} maintenance ${value ? "on" : "off"}`);
    } catch (e: unknown) {
      setSettings((s) => ({ ...s, maintenance: { ...s.maintenance, [key]: prev } }));
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingMaintToggle(null);
    }
  };

  const saveMaintenanceMessage = async () => {
    setSavingMaint(true);
    try {
      await put({ maintenance: { ...settings.maintenance, message: settings.maintenance.message.trim() } });
      toast.success("Maintenance message saved");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingMaint(false);
    }
  };

  const toggleFeature = async (key: keyof SiteSettings["features"], value: boolean) => {
    const prev = settings.features[key];
    setSettings((s) => ({ ...s, features: { ...s.features, [key]: value } }));
    setSavingFeature(key);
    try {
      await put({ features: { ...settings.features, [key]: value } });
      toast.success(`${value ? "Enabled" : "Disabled"} — updated across the site`);
    } catch (e: unknown) {
      setSettings((s) => ({ ...s, features: { ...s.features, [key]: prev } }));
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingFeature(null);
    }
  };

  return (
    <>
      <AdminTopbar title="Manage Website" />
      <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8 max-w-3xl mx-auto w-full">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#FF561E] animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-[14px] text-[#6B7280]">
              Change site-wide details and turn features on or off. Updates apply everywhere they&apos;re used.
            </p>

            {/* Contact & Company */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-9 h-9 rounded-xl bg-[#FFF4F0] flex items-center justify-center"><Mail className="w-4.5 h-4.5 text-[#FF561E]" /></div>
                <h2 className="text-[16px] font-bold text-[#1A1D20]">Contact &amp; Company</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Contact email</label>
                  <input className={inputCls} type="email" value={settings.contactEmail} onChange={(e) => setSettings((s) => ({ ...s, contactEmail: e.target.value }))} placeholder="support@esim4u.uk" />
                </div>
                <div>
                  <label className={labelCls}><Phone className="inline w-3.5 h-3.5 -mt-0.5" /> WhatsApp number</label>
                  <input className={inputCls} value={settings.whatsapp} onChange={(e) => setSettings((s) => ({ ...s, whatsapp: e.target.value }))} placeholder="+44 7700 900000" />
                </div>
                <button onClick={saveContact} disabled={savingContact} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF561E] text-white text-[13px] font-bold hover:bg-[#E04B18] transition-colors disabled:opacity-70">
                  {savingContact ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save contact details
                </button>
              </div>
            </section>

            {/* Social Links */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-9 h-9 rounded-xl bg-[#FFF4F0] flex items-center justify-center"><Share2 className="w-4.5 h-4.5 text-[#FF561E]" /></div>
                <h2 className="text-[16px] font-bold text-[#1A1D20]">Social Links</h2>
              </div>
              <p className="text-[12.5px] text-[#6B7280] mb-4">Add the profile URL and use the toggle to show or hide each icon in the footer.</p>
              <div className="space-y-4">
                {(["instagram", "facebook", "x", "tiktok", "youtube"] as const).map((k) => (
                  <div key={k}>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className={`${labelCls} capitalize mb-0`}>{k === "x" ? "X (Twitter)" : k}</label>
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-semibold ${settings.socials[k].enabled ? "text-[#FF561E]" : "text-[#9CA3AF]"}`}>
                          {settings.socials[k].enabled ? "Shown" : "Hidden"}
                        </span>
                        <Toggle
                          on={settings.socials[k].enabled}
                          onChange={(v) => setSettings((s) => ({ ...s, socials: { ...s.socials, [k]: { ...s.socials[k], enabled: v } } }))}
                        />
                      </div>
                    </div>
                    <input
                      className={inputCls}
                      value={settings.socials[k].url}
                      onChange={(e) => setSettings((s) => ({ ...s, socials: { ...s.socials, [k]: { ...s.socials[k], url: e.target.value } } }))}
                      placeholder={`https://${k === "x" ? "x" : k}.com/esim4u`}
                    />
                  </div>
                ))}
                <button onClick={saveSocials} disabled={savingSocials} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF561E] text-white text-[13px] font-bold hover:bg-[#E04B18] transition-colors disabled:opacity-70">
                  {savingSocials ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save social links
                </button>
              </div>
            </section>

            {/* Feature toggles */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-9 h-9 rounded-xl bg-[#FFF4F0] flex items-center justify-center"><ToggleRight className="w-4.5 h-4.5 text-[#FF561E]" /></div>
                <h2 className="text-[16px] font-bold text-[#1A1D20]">Features</h2>
              </div>
              <p className="text-[12.5px] text-[#6B7280] mb-4">Turn a feature off to hide it from the menus, pages and links across the whole site.</p>
              <div className="divide-y divide-gray-50">
                {FEATURES.map((f) => (
                  <div key={f.key} className="flex items-center justify-between gap-4 py-3.5">
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-[#1A1D20]">{f.label}</p>
                      <p className="text-[12px] text-[#6B7280]">{f.desc}</p>
                    </div>
                    <Toggle on={settings.features[f.key]} onChange={(v) => toggleFeature(f.key, v)} disabled={savingFeature === f.key} />
                  </div>
                ))}
              </div>
            </section>

            {/* Maintenance mode */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-9 h-9 rounded-xl bg-[#FFF4F0] flex items-center justify-center"><Wrench className="w-4.5 h-4.5 text-[#FF561E]" /></div>
                <h2 className="text-[16px] font-bold text-[#1A1D20]">Maintenance mode</h2>
              </div>
              <p className="text-[12.5px] text-[#6B7280] mb-4">
                Temporarily pause the website or the Telegram bot for customers. Admins always keep access.
              </p>
              <div className="divide-y divide-gray-50">
                <div className="flex items-center justify-between gap-4 py-3.5">
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-[#1A1D20]">Website maintenance</p>
                    <p className="text-[12px] text-[#6B7280]">Show a maintenance screen to customers on the site.</p>
                  </div>
                  <Toggle on={settings.maintenance.website} onChange={(v) => toggleMaintenance("website", v)} disabled={savingMaintToggle === "website"} />
                </div>
                <div className="flex items-center justify-between gap-4 py-3.5">
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-[#1A1D20]">Telegram bot maintenance</p>
                    <p className="text-[12px] text-[#6B7280]">Bot replies with the maintenance notice to non-admins.</p>
                  </div>
                  <Toggle on={settings.maintenance.bot} onChange={(v) => toggleMaintenance("bot", v)} disabled={savingMaintToggle === "bot"} />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Schedule from (optional)</label>
                  <input
                    type="datetime-local"
                    className={inputCls}
                    value={settings.maintenance.from}
                    onChange={(e) => setSettings((s) => ({ ...s, maintenance: { ...s.maintenance, from: e.target.value } }))}
                  />
                </div>
                <div>
                  <label className={labelCls}>Schedule to (optional)</label>
                  <input
                    type="datetime-local"
                    className={inputCls}
                    value={settings.maintenance.to}
                    onChange={(e) => setSettings((s) => ({ ...s, maintenance: { ...s.maintenance, to: e.target.value } }))}
                  />
                </div>
              </div>
              <p className="text-[12px] text-[#6B7280] mt-2">
                Leave both blank to start immediately when a toggle is on. With a window set, maintenance only applies
                between those times, and the popup / bot message shows the schedule.
              </p>
              <div className="mt-4">
                <label className={labelCls}>Maintenance message</label>
                <textarea
                  className={`${inputCls} min-h-[80px] resize-y`}
                  value={settings.maintenance.message}
                  onChange={(e) => setSettings((s) => ({ ...s, maintenance: { ...s.maintenance, message: e.target.value } }))}
                  placeholder="We'll be back shortly…"
                />
                <button onClick={saveMaintenanceMessage} disabled={savingMaint} className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF561E] text-white text-[13px] font-bold hover:bg-[#E04B18] transition-colors disabled:opacity-70">
                  {savingMaint ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save schedule &amp; message
                </button>
              </div>
            </section>
          </div>
        )}
      </main>
    </>
  );
}
