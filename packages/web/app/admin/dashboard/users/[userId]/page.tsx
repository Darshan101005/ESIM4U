"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AdminTopbar from "@/components/admin/admin-topbar";
import {
  ArrowLeft, Loader2, Mail, Phone, MapPin, User, Calendar, Copy, Check, Cake, Users, Globe, Monitor,
  Wifi, ShieldAlert, Clock, BadgeCheck, Wallet, Gift, ShoppingBag, Ban, ShieldCheck, Trash2, ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";

/* ---------------- helpers ---------------- */

const usd = (n: number) => `$${(n || 0).toFixed(2)}`;

function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(String(iso).replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}
function fmtDateTime(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(String(iso).replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}
function ageFrom(dob?: string | null): number | null {
  if (!dob) return null;
  const b = new Date(dob);
  if (Number.isNaN(b.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age >= 0 && age < 130 ? age : null;
}
function parseUA(ua?: string | null) {
  if (!ua) return null;
  const os = /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /iPhone|iPad|iPod/.test(ua) ? "iOS" : /Mac OS X|Macintosh/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "Unknown";
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\/|Opera/.test(ua) ? "Opera" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Unknown";
  const device = /Mobile|Android|iPhone|iPod/.test(ua) ? "Mobile" : /iPad|Tablet/.test(ua) ? "Tablet" : "Desktop";
  return { browser, os, device };
}
function statusPill(status: string) {
  const map: Record<string, string> = {
    completed: "bg-emerald-50 text-emerald-600", pending: "bg-amber-50 text-amber-600",
    pending_verification: "bg-amber-50 text-amber-600", failed: "bg-red-50 text-red-500", refunded: "bg-gray-100 text-gray-500",
  };
  return map[status] || "bg-gray-100 text-gray-500";
}

function CopyValue({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(value); setCopied(true); toast.success("Copied"); setTimeout(() => setCopied(false), 1200); } catch { toast.error("Could not copy"); }
  };
  return (
    <button onClick={copy} title="Click to copy" className="group inline-flex items-center gap-1.5 min-w-0 text-left">
      <span className="text-[13px] font-semibold text-[#1A1D20] truncate">{value}</span>
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <Copy className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#FF561E] shrink-0" />}
    </button>
  );
}
function Field({ icon: Icon, label, value, copyable }: { icon: typeof Mail; label: string; value?: string | null; copyable?: boolean }) {
  if (value == null || String(value).trim() === "") return null;
  const v = String(value);
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Icon className="w-4 h-4 text-[#FF561E] shrink-0" />
      <span className="text-[12px] text-[#6B7280] w-28 shrink-0">{label}</span>
      {copyable ? <CopyValue value={v} /> : <span className="text-[13px] font-semibold text-[#1A1D20] truncate">{v}</span>}
    </div>
  );
}
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden break-inside-avoid mb-5">
      <p className="px-4 py-3 border-b border-gray-100 text-[13px] font-bold text-[#1A1D20]">{title}</p>
      {children}
    </div>
  );
}
function Stat({ icon: Icon, label, value }: { icon: typeof Wallet; label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-4">
      <div className="w-9 h-9 rounded-xl bg-[#FFF4F0] flex items-center justify-center mb-2">
        <Icon className="w-[18px] h-[18px] text-[#FF561E]" />
      </div>
      <p className="text-[18px] font-bold text-[#1A1D20]">{value}</p>
      <p className="text-[11.5px] text-[#6B7280]">{label}</p>
    </div>
  );
}

/* ---------------- types ---------------- */

interface Data {
  user: { id: string; name: string | null; email: string | null; emailVerified: boolean; createdAt: string; banned: boolean; banReason: string | null };
  profile: { phone?: string | null; country?: string | null; preferred_currency?: string | null; date_of_birth?: string | null; gender?: string | null; last_seen_at?: string | null };
  lastActivity: {
    ipv4?: string | null; ipv6?: string | null; country?: string | null; region?: string | null; city?: string | null;
    latitude?: string | null; longitude?: string | null; postal?: string | null; flag_emoji?: string | null; isp?: string | null;
    org?: string | null; timezone_id?: string | null; is_vpn?: boolean; is_proxy?: boolean; is_tor?: boolean; user_agent?: string | null;
    event_type?: string | null; created_at?: string | null;
  } | null;
  wallet: { balanceUsd: number };
  referral: { balanceUsd: number; friendsReferred: number; earnedUsd: number } | null;
  orders: { id: number; order_reference: string; bundle_name: string | null; country: string | null; data_amount: string | null; validity: string | null; price: string; status: string; created_at: string }[];
  stats: { total: number; spent: number };
}

export default function AdminCustomerPage() {
  const params = useParams();
  const router = useRouter();
  const userId = String(params.userId);
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, { cache: "no-store" });
      if (res.status === 404) { setNotFound(true); return; }
      if (!res.ok) throw new Error();
      setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const doAction = async (action: "block" | "unblock" | "delete") => {
    if (action === "delete" && !window.confirm("Permanently delete this customer's account? This removes their login, profile and sessions. Order history is retained. This cannot be undone.")) return;
    if (action === "block" && !window.confirm("Block this customer? They will be signed out and unable to log in.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error();
      if (action === "delete") {
        toast.success("Customer deleted");
        router.push("/admin/dashboard/users");
        return;
      }
      toast.success(action === "block" ? "Customer blocked" : "Customer unblocked");
      await load();
    } catch {
      toast.error("Action failed");
    } finally {
      setBusy(false);
    }
  };

  const u = data?.user;
  const p = data?.profile || {};
  const a = data?.lastActivity || null;
  const age = ageFrom(p.date_of_birth);
  const ua = a ? parseUA(a.user_agent) : null;
  const lat = a?.latitude != null ? Number(a.latitude) : null;
  const lon = a?.longitude != null ? Number(a.longitude) : null;
  const hasCoords = lat != null && lon != null && !Number.isNaN(lat) && !Number.isNaN(lon) && (lat !== 0 || lon !== 0);
  const dd = 0.05;
  const mapSrc = hasCoords ? `https://www.openstreetmap.org/export/embed.html?bbox=${lon! - dd}%2C${lat! - dd}%2C${lon! + dd}%2C${lat! + dd}&layer=mapnik&marker=${lat}%2C${lon}` : "";
  const place = a ? [a.city, a.region, a.country].filter(Boolean).join(", ") : "";
  const risky = Boolean(a?.is_vpn || a?.is_proxy || a?.is_tor);

  return (
    <>
      <AdminTopbar title="Customer" />
      <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8 max-w-6xl mx-auto w-full">
        <Link href="/admin/dashboard/users" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#6B7280] hover:text-[#FF561E] mb-5">
          <ArrowLeft className="w-4 h-4" /> All customers
        </Link>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-[#FF561E] animate-spin" /></div>
        ) : notFound || !u ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <p className="text-[14px] font-semibold text-[#1A1D20]">Customer not found</p>
          </div>
        ) : (
          <>
            {/* Header + actions */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 mb-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FF561E] to-[#FF7A45] flex items-center justify-center text-white text-[24px] font-bold shrink-0">
                {(u.name || u.email || "?").trim().charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-[20px] font-bold text-[#1A1D20]">{u.name || "Customer"}</h2>
                  {u.emailVerified && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-semibold"><BadgeCheck className="w-3.5 h-3.5" /> Verified</span>}
                  {u.banned && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-500 text-[11px] font-semibold"><Ban className="w-3.5 h-3.5" /> Blocked</span>}
                </div>
                <p className="text-[13px] text-[#6B7280] mt-0.5">{u.email} · Member since {fmtDate(u.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {u.banned ? (
                  <button onClick={() => doAction("unblock")} disabled={busy} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-[13px] font-bold text-[#6B7280] hover:text-emerald-600 hover:border-emerald-200 transition-colors disabled:opacity-60">
                    <ShieldCheck className="w-4 h-4" /> Unblock
                  </button>
                ) : (
                  <button onClick={() => doAction("block")} disabled={busy} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-[13px] font-bold text-[#6B7280] hover:text-amber-600 hover:border-amber-200 transition-colors disabled:opacity-60">
                    <Ban className="w-4 h-4" /> Block
                  </button>
                )}
                <button onClick={() => doAction("delete")} disabled={busy} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-50 border border-red-100 text-[13px] font-bold text-red-500 hover:bg-red-100 transition-colors disabled:opacity-60">
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </div>

            {/* Lifetime stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
              <Stat icon={ShoppingBag} label="Total orders" value={String(data!.stats.total)} />
              <Stat icon={ShoppingBag} label="Lifetime spend" value={usd(data!.stats.spent)} />
              <Stat icon={Wallet} label="Wallet balance" value={usd(data!.wallet.balanceUsd)} />
              <Stat icon={Gift} label={`Referral · ${data!.referral?.friendsReferred || 0} friends`} value={usd(data!.referral?.balanceUsd || 0)} />
            </div>

            <div className="columns-1 lg:columns-2 gap-5">
              {/* Profile */}
              <Card title="Profile & personal">
                <div className="divide-y divide-gray-50">
                  <Field icon={Mail} label="Email" value={u.email} copyable />
                  <Field icon={Phone} label="Mobile" value={p.phone} copyable />
                  <Field icon={Cake} label="Date of birth" value={p.date_of_birth ? `${fmtDate(p.date_of_birth)}${age != null ? ` · ${age} yrs` : ""}` : null} />
                  <Field icon={Users} label="Gender" value={p.gender} />
                  <Field icon={Globe} label="Country" value={p.country} />
                  <Field icon={User} label="Currency" value={p.preferred_currency} />
                  <Field icon={Clock} label="Last seen" value={p.last_seen_at ? fmtDateTime(p.last_seen_at) : null} />
                  {u.banned && u.banReason && <Field icon={Ban} label="Block reason" value={u.banReason} />}
                </div>
              </Card>

              {/* Latest session */}
              {a ? (
                <Card title="Latest session & device">
                  <div className="divide-y divide-gray-50">
                    {ua && <Field icon={Monitor} label="Device" value={`${ua.device} · ${ua.os} · ${ua.browser}`} />}
                    <Field icon={Wifi} label="IP (v4)" value={a.ipv4} copyable />
                    <Field icon={Wifi} label="IP (v6)" value={a.ipv6} copyable />
                    <Field icon={Globe} label="ISP" value={a.isp} />
                    <Field icon={Globe} label="Network" value={a.org} />
                    <Field icon={Clock} label="Timezone" value={a.timezone_id} />
                    <Field icon={Calendar} label="Recorded" value={`${a.event_type ? a.event_type.replace("_", " ") : "activity"} · ${fmtDateTime(a.created_at)}`} />
                    {risky && (
                      <div className="flex items-center gap-2 px-4 py-3 bg-amber-50">
                        <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
                        <span className="text-[12.5px] font-semibold text-amber-700">{[a.is_vpn && "VPN", a.is_proxy && "Proxy", a.is_tor && "Tor"].filter(Boolean).join(" · ")} detected</span>
                      </div>
                    )}
                  </div>
                </Card>
              ) : (
                <Card title="Latest session & device">
                  <p className="px-4 py-6 text-center text-[12.5px] text-[#6B7280]">No device/session activity in the last 7 days.</p>
                </Card>
              )}

              {/* Location + map */}
              {a && (place || hasCoords) && (
                <Card title="Location">
                  <div className="divide-y divide-gray-50">
                    <Field icon={MapPin} label="Place" value={[a.flag_emoji, place].filter(Boolean).join(" ")} />
                    <Field icon={MapPin} label="Postal" value={a.postal} />
                    {hasCoords && <Field icon={MapPin} label="Coordinates" value={`${lat!.toFixed(4)}, ${lon!.toFixed(4)}`} copyable />}
                  </div>
                  {hasCoords && (
                    <div className="p-3">
                      <div className="rounded-xl overflow-hidden border border-gray-100">
                        <iframe title="Customer location" src={mapSrc} className="w-full h-52 block" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                      </div>
                      <a href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=12/${lat}/${lon}`} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-[12.5px] font-semibold text-[#FF561E] hover:underline">Open larger map →</a>
                    </div>
                  )}
                </Card>
              )}

              {/* Orders */}
              <Card title={`Plans & orders (${data!.stats.total})`}>
                {data!.orders.length === 0 ? (
                  <p className="px-4 py-6 text-center text-[12.5px] text-[#6B7280]">No orders yet.</p>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {data!.orders.map((o) => (
                      <Link key={o.id} href={`/admin/dashboard/orders/${o.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-semibold text-[#1A1D20] truncate">{o.bundle_name || o.country || "eSIM Plan"}</p>
                          <p className="text-[11.5px] text-[#6B7280] truncate">{[o.data_amount, o.validity].filter(Boolean).join(" · ") || fmtDate(o.created_at)}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[13px] font-bold text-[#1A1D20]">${parseFloat(o.price).toFixed(2)}</p>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${statusPill(o.status)}`}>{o.status.replace("_", " ")}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                      </Link>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </>
        )}
      </main>
    </>
  );
}
