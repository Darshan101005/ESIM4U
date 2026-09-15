"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AdminTopbar from "@/components/admin/admin-topbar";
import {
  ArrowLeft, Loader2, Mail, Phone, MapPin, User, Calendar, Copy, Check, Cake, Users, Globe, Monitor,
  Wifi, ShieldAlert, Clock, BadgeCheck, Wallet, Gift, ShoppingBag, Ban, ShieldCheck, Trash2, ChevronRight, Pencil, X,
  ExternalLink, RotateCcw,
} from "lucide-react";
import toast from "react-hot-toast";
import ConfirmModal from "@/components/confirm-modal";
import SelectMenu from "@/components/admin/select-menu";
import { CURRENCY_SYMBOLS } from "@/lib/fx";

/* ---------------- helpers ---------------- */

const usd = (n: number) => `$${(n || 0).toFixed(2)}`;

const TOPUP_FILTERS = ["all", "completed", "pending", "failed", "cancelled", "refunded"] as const;
type TopupFilter = (typeof TOPUP_FILTERS)[number];

function topupPill(status: string): string {
  switch (status) {
    case "completed": return "bg-emerald-50 text-emerald-600";
    case "pending": return "bg-amber-50 text-amber-600";
    case "refunded": return "bg-gray-100 text-[#6B7280]";
    case "cancelled": return "bg-gray-100 text-[#6B7280]";
    default: return "bg-red-50 text-red-500"; // failed
  }
}

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
function Stat({ icon: Icon, label, value, onClick }: { icon: typeof Wallet; label: string; value: string; onClick?: () => void }) {
  const body = (
    <>
      <div className="w-9 h-9 rounded-xl bg-[#FFF4F0] flex items-center justify-center mb-2">
        <Icon className="w-[18px] h-[18px] text-[#FF561E]" />
      </div>
      <p className="text-[18px] font-bold text-[#1A1D20]">{value}</p>
      <p className="text-[11.5px] text-[#6B7280] flex items-center gap-1">
        {label}
        {onClick && <ChevronRight className="w-3.5 h-3.5 text-gray-300" />}
      </p>
    </>
  );
  const cls = "bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-4";
  if (onClick) {
    return (
      <button onClick={onClick} className={`${cls} text-left w-full hover:border-orange-200 hover:shadow-md transition-all`}>
        {body}
      </button>
    );
  }
  return <div className={cls}>{body}</div>;
}

/* ---------------- types ---------------- */

interface TopupRow {
  id: number;
  provider: string | null;
  amount_usd: string;
  display_currency: string | null;
  display_amount: string | null;
  display_rate: string | null;
  status: string;
  stripe_payment_intent: string | null;
  paypal_capture_id: string | null;
  receipt_url: string | null;
  created_at: string;
  deleted_scope?: string | null;
  deleted_at?: string | null;
  deleted_by?: string | null;
}

interface ReferralLedgerEntry {
  direction: "credit" | "debit";
  amount_usd: string;
  reason: string;
  description: string | null;
  created_at: string;
}

interface ReferralDetail {
  code: string;
  link: string;
  friendsReferred: number;
  qualifiedCount: number;
  balanceUsd: number;
  earnedUsd: number;
  spentUsd: number;
  history: ReferralLedgerEntry[];
}

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

  // Confirm modal (block / delete) — replaces native window.confirm().
  const [confirmAction, setConfirmAction] = useState<"block" | "delete" | null>(null);

  // Edit customer (name + personal details, NOT email).
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", date_of_birth: "", gender: "", country: "" });

  // Wallet top-ups management modal (opened from the Wallet balance stat card).
  const [walletOpen, setWalletOpen] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletTrash, setWalletTrash] = useState(false);
  const [walletFilter, setWalletFilter] = useState<TopupFilter>("all");
  const [walletBusyId, setWalletBusyId] = useState<number | null>(null);
  const [topupToDelete, setTopupToDelete] = useState<TopupRow | null>(null);
  const [walletData, setWalletData] = useState<{ balanceUsd: number; topups: TopupRow[] } | null>(null);

  // Referral details modal (opened from the Referral stat card) — read-only.
  const [referralOpen, setReferralOpen] = useState(false);
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralData, setReferralData] = useState<ReferralDetail | null>(null);

  const openReferral = useCallback(async () => {
    setReferralOpen(true);
    setReferralLoading(true);
    try {
      const res = await fetch(`/api/admin/referrals?userId=${encodeURIComponent(userId)}`, { cache: "no-store" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to load referrals");
      setReferralData(d);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load referrals");
      setReferralData(null);
    } finally {
      setReferralLoading(false);
    }
  }, [userId]);

  const loadWallet = useCallback(
    async (trash: boolean) => {
      setWalletTrash(trash);
      setWalletLoading(true);
      try {
        const res = await fetch(`/api/admin/wallet?userId=${encodeURIComponent(userId)}${trash ? "&trash=1" : ""}`, { cache: "no-store" });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || "Failed to load wallet");
        setWalletData({ balanceUsd: d.balanceUsd ?? 0, topups: d.topups || [] });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load wallet");
        setWalletData({ balanceUsd: 0, topups: [] });
      } finally {
        setWalletLoading(false);
      }
    },
    [userId]
  );

  const openWallet = useCallback(() => {
    setWalletOpen(true);
    setWalletFilter("all");
    loadWallet(false);
  }, [loadWallet]);

  const topupAction = async (id: number, payload: Record<string, unknown>) => {
    setWalletBusyId(id);
    try {
      const res = await fetch(`/api/admin/wallet/topups/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Action failed");
      toast.success("Updated");
      setTopupToDelete(null);
      await loadWallet(walletTrash);
      // Refresh the balance stat if the action changed it (e.g. refund).
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setWalletBusyId(null);
    }
  };

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
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error();
      setConfirmAction(null);
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

  const openEdit = () => {
    if (!data) return;
    setForm({
      name: data.user.name || "",
      phone: data.profile.phone || "",
      date_of_birth: data.profile.date_of_birth ? String(data.profile.date_of_birth).slice(0, 10) : "",
      gender: data.profile.gender || "",
      country: data.profile.country || "",
    });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          date_of_birth: form.date_of_birth,
          gender: form.gender,
          country: form.country,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Customer updated");
      setEditOpen(false);
      await load();
    } catch {
      toast.error("Could not save changes");
    } finally {
      setSaving(false);
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
                  <h2 className="text-[20px] font-bold text-[#1A1D20]">{u.name ? u.name.toUpperCase() : "Customer"}</h2>
                  {u.emailVerified && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-semibold"><BadgeCheck className="w-3.5 h-3.5" /> Verified</span>}
                  {u.banned && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-500 text-[11px] font-semibold"><Ban className="w-3.5 h-3.5" /> Blocked</span>}
                </div>
                <p className="text-[13px] text-[#6B7280] mt-0.5">{u.email} · Member since {fmtDate(u.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={openEdit} disabled={busy} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-[13px] font-bold text-[#6B7280] hover:text-[#FF561E] hover:border-orange-200 transition-colors disabled:opacity-60">
                  <Pencil className="w-4 h-4" /> Edit
                </button>
                {u.banned ? (
                  <button onClick={() => doAction("unblock")} disabled={busy} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-[13px] font-bold text-[#6B7280] hover:text-emerald-600 hover:border-emerald-200 transition-colors disabled:opacity-60">
                    <ShieldCheck className="w-4 h-4" /> Unblock
                  </button>
                ) : (
                  <button onClick={() => setConfirmAction("block")} disabled={busy} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-[13px] font-bold text-[#6B7280] hover:text-amber-600 hover:border-amber-200 transition-colors disabled:opacity-60">
                    <Ban className="w-4 h-4" /> Block
                  </button>
                )}
                <button onClick={() => setConfirmAction("delete")} disabled={busy} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-50 border border-red-100 text-[13px] font-bold text-red-500 hover:bg-red-100 transition-colors disabled:opacity-60">
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </div>

            {/* Lifetime stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
              <Stat icon={ShoppingBag} label="Total orders" value={String(data!.stats.total)} />
              <Stat icon={ShoppingBag} label="Lifetime spend" value={usd(data!.stats.spent)} />
              <Stat icon={Wallet} label="Wallet balance" value={usd(data!.wallet.balanceUsd)} onClick={openWallet} />
              <Stat icon={Gift} label={`Referral · ${data!.referral?.friendsReferred || 0} friends`} value={usd(data!.referral?.balanceUsd || 0)} onClick={openReferral} />
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

      {/* Block / delete confirmation */}
      <ConfirmModal
        open={confirmAction === "block"}
        title="Block this customer?"
        message="They will be signed out immediately and unable to log in until you unblock them."
        confirmLabel="Block customer"
        danger={false}
        loading={busy}
        onConfirm={() => doAction("block")}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmModal
        open={confirmAction === "delete"}
        title="Delete this customer?"
        message="This permanently removes their login, profile and sessions. Order history is retained. This cannot be undone."
        confirmLabel="Delete customer"
        loading={busy}
        onConfirm={() => doAction("delete")}
        onCancel={() => setConfirmAction(null)}
      />

      {/* Wallet top-ups management */}
      {walletOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setWalletOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div className="min-w-0">
                <h3 className="text-[15px] font-bold text-[#1A1D20]">{walletTrash ? "Wallet recycle bin" : "Wallet top-ups"}</h3>
                <p className="text-[12px] text-[#6B7280]">Balance {walletData ? usd(walletData.balanceUsd) : "—"}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => loadWallet(!walletTrash)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-colors ${walletTrash ? "bg-[#FFF4F0] text-[#FF561E] border-[#FF561E]" : "border-gray-200 text-[#6B7280] hover:text-[#FF561E] hover:border-orange-200"}`}
                >
                  {walletTrash ? (<><ArrowLeft className="w-3.5 h-3.5" /> Back</>) : (<><Trash2 className="w-3.5 h-3.5" /> Recycle bin</>)}
                </button>
                <button
                  onClick={() => setWalletOpen(false)}
                  aria-label="Close"
                  className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <X className="w-4 h-4 text-[#1A1D20]" />
                </button>
              </div>
            </div>

            {!walletTrash && walletData && walletData.topups.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 px-5 pt-4">
                {TOPUP_FILTERS.map((f) => {
                  const n = f === "all" ? walletData.topups.length : walletData.topups.filter((t) => t.status === f).length;
                  const active = walletFilter === f;
                  return (
                    <button
                      key={f}
                      onClick={() => setWalletFilter(f)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11.5px] font-semibold border capitalize transition-colors ${active ? "bg-[#FFF4F0] text-[#FF561E] border-[#FF561E]" : "bg-white text-[#6B7280] border-gray-200 hover:text-[#FF561E] hover:border-orange-200"}`}
                    >
                      {f} <span className={active ? "text-[#FF561E]/70" : "text-gray-400"}>{n}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="p-5">
              {walletLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-7 h-7 text-[#FF561E] animate-spin" />
                </div>
              ) : !walletData || walletData.topups.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF4F0] flex items-center justify-center mx-auto mb-3">
                    <Wallet className="w-6 h-6 text-[#FF561E]" />
                  </div>
                  <p className="text-[14px] font-semibold text-[#1A1D20]">{walletTrash ? "Recycle bin is empty" : "No top-ups"}</p>
                  <p className="text-[12.5px] text-[#6B7280] mt-1">
                    {walletTrash ? "Deleted top-ups appear here for 30 days." : "This customer hasn't topped up their wallet."}
                  </p>
                </div>
              ) : (
                (() => {
                  const shown = walletTrash || walletFilter === "all" ? walletData.topups : walletData.topups.filter((t) => t.status === walletFilter);
                  if (shown.length === 0) {
                    return <p className="text-center py-8 text-[13px] text-[#6B7280] font-medium capitalize">No {walletFilter} top-ups.</p>;
                  }
                  return (
                    <div className="space-y-3">
                      {shown.map((t) => {
                        const amt =
                          t.display_currency && t.display_amount
                            ? `${CURRENCY_SYMBOLS[t.display_currency as keyof typeof CURRENCY_SYMBOLS] ?? ""}${Number(t.display_amount).toFixed(2)}`
                            : usd(Number(t.amount_usd));
                        const txnId = t.paypal_capture_id || t.stripe_payment_intent;
                        const busy = walletBusyId === t.id;
                        return (
                          <div key={t.id} className="rounded-xl border border-gray-100 p-4">
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-[13.5px] font-semibold text-[#1A1D20]">Wallet top-up</p>
                                <p className="text-[11.5px] text-[#6B7280]">
                                  {t.provider === "paypal" ? "PayPal" : "Card · Stripe"} · {fmtDateTime(t.created_at)}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[14px] font-bold text-emerald-600">+{amt}</span>
                                <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize ${topupPill(t.status)}`}>{t.status}</span>
                              </div>
                            </div>
                            {(txnId || t.receipt_url) && (
                              <div className="mt-2 flex flex-col gap-1 text-[11.5px]">
                                {txnId && (
                                  <p className="min-w-0">
                                    <span className="text-[#6B7280]">Txn ID: </span>
                                    <span className="font-mono font-semibold text-[#1A1D20] break-all">{txnId}</span>
                                  </p>
                                )}
                                {t.receipt_url && (
                                  <a href={t.receipt_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#FF561E] font-semibold w-fit">
                                    View receipt <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </div>
                            )}

                            <div className="mt-3 pt-3 border-t border-gray-50 flex flex-wrap items-center gap-2">
                              {walletTrash ? (
                                <>
                                  <button
                                    disabled={busy}
                                    onClick={() => topupAction(t.id, { action: "restore" })}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-[11.5px] font-semibold text-[#6B7280] hover:text-[#FF561E] hover:border-orange-200 disabled:opacity-50"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" /> Restore
                                  </button>
                                  <button
                                    disabled={busy}
                                    onClick={() => topupAction(t.id, { action: "purge" })}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 text-[11.5px] font-semibold text-red-500 hover:bg-red-50 disabled:opacity-50"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" /> Delete permanently
                                  </button>
                                </>
                              ) : (
                                <>
                                  {/* Valid transitions only: pending → failed/cancelled; completed → refunded. */}
                                  {(t.status === "pending"
                                    ? (["failed", "cancelled"] as const)
                                    : t.status === "completed"
                                      ? (["refunded"] as const)
                                      : ([] as const)
                                  ).map((s) => (
                                    <button
                                      key={s}
                                      disabled={busy}
                                      onClick={() => topupAction(t.id, { action: "mark", status: s })}
                                      className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-[11.5px] font-semibold text-[#6B7280] hover:text-[#FF561E] hover:border-orange-200 capitalize disabled:opacity-50"
                                    >
                                      Mark {s}
                                    </button>
                                  ))}
                                  <button
                                    disabled={busy}
                                    onClick={() => setTopupToDelete(t)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 text-[11.5px] font-semibold text-red-500 hover:bg-red-50 disabled:opacity-50 ml-auto"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                  </button>
                                </>
                              )}
                              {busy && <Loader2 className="w-4 h-4 animate-spin text-[#FF561E]" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      )}

      {/* Referral details (read-only) */}
      {referralOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setReferralOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div className="min-w-0">
                <h3 className="text-[15px] font-bold text-[#1A1D20]">Referral details</h3>
                <p className="text-[12px] text-[#6B7280]">Invite standing &amp; credit ledger</p>
              </div>
              <button
                onClick={() => setReferralOpen(false)}
                aria-label="Close"
                className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors shrink-0"
              >
                <X className="w-4 h-4 text-[#1A1D20]" />
              </button>
            </div>

            <div className="p-5">
              {referralLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-7 h-7 text-[#FF561E] animate-spin" />
                </div>
              ) : !referralData ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF4F0] flex items-center justify-center mx-auto mb-3">
                    <Gift className="w-6 h-6 text-[#FF561E]" />
                  </div>
                  <p className="text-[14px] font-semibold text-[#1A1D20]">No referral data</p>
                  <p className="text-[12.5px] text-[#6B7280] mt-1">Could not load this customer&apos;s referrals.</p>
                </div>
              ) : (
                <>
                  {/* Summary stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="rounded-xl border border-gray-100 p-3.5">
                      <p className="text-[11px] text-[#6B7280]">Credit balance</p>
                      <p className="text-[17px] font-bold text-[#1A1D20]">{usd(referralData.balanceUsd)}</p>
                    </div>
                    <div className="rounded-xl border border-gray-100 p-3.5">
                      <p className="text-[11px] text-[#6B7280]">Friends referred</p>
                      <p className="text-[17px] font-bold text-[#1A1D20]">
                        {referralData.friendsReferred}
                        <span className="text-[12px] font-semibold text-[#6B7280]"> · {referralData.qualifiedCount} qualified</span>
                      </p>
                    </div>
                    <div className="rounded-xl border border-gray-100 p-3.5">
                      <p className="text-[11px] text-[#6B7280]">Lifetime earned</p>
                      <p className="text-[15px] font-bold text-emerald-600">{usd(referralData.earnedUsd)}</p>
                    </div>
                    <div className="rounded-xl border border-gray-100 p-3.5">
                      <p className="text-[11px] text-[#6B7280]">Lifetime redeemed</p>
                      <p className="text-[15px] font-bold text-[#1A1D20]">{usd(referralData.spentUsd)}</p>
                    </div>
                  </div>

                  {/* Code + link */}
                  <div className="rounded-xl border border-gray-100 divide-y divide-gray-50 mb-4">
                    <div className="flex items-center gap-3 px-4 py-3">
                      <Gift className="w-4 h-4 text-[#FF561E] shrink-0" />
                      <span className="text-[12px] text-[#6B7280] w-20 shrink-0">Code</span>
                      <CopyValue value={referralData.code} />
                    </div>
                    <div className="flex items-center gap-3 px-4 py-3">
                      <ExternalLink className="w-4 h-4 text-[#FF561E] shrink-0" />
                      <span className="text-[12px] text-[#6B7280] w-20 shrink-0">Invite link</span>
                      <CopyValue value={referralData.link} />
                    </div>
                  </div>

                  {/* History */}
                  <p className="text-[12px] font-bold text-[#1A1D20] mb-2">Credit history</p>
                  {referralData.history.length === 0 ? (
                    <p className="text-center py-8 text-[13px] text-[#6B7280] font-medium">No referral activity yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {referralData.history.map((h, i) => {
                        const isCredit = h.direction === "credit";
                        return (
                          <div key={i} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-4 py-3">
                            <div className="min-w-0">
                              <p className="text-[13px] font-semibold text-[#1A1D20] truncate">
                                {h.description || (isCredit ? "Referral credit" : "Referral credit used")}
                              </p>
                              <p className="text-[11.5px] text-[#6B7280]">{fmtDateTime(h.created_at)}</p>
                            </div>
                            <span className={`text-[13.5px] font-bold shrink-0 ${isCredit ? "text-emerald-600" : "text-[#1A1D20]"}`}>
                              {isCredit ? "+" : "−"}{usd(Number(h.amount_usd))}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete top-up: choose scope (admin only vs everywhere) */}
      {topupToDelete && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => walletBusyId === null && setTopupToDelete(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-[16px] font-bold text-[#1A1D20] mb-1">Delete this top-up?</h3>
            <p className="text-[13px] text-[#6B7280] mb-4">
              It moves to the recycle bin for 30 days. Choose whether the customer can still see it.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => topupToDelete && topupAction(topupToDelete.id, { action: "soft_delete", scope: "admin" })}
                disabled={walletBusyId !== null}
                className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:border-orange-200 hover:bg-[#FFF4F0] transition-colors disabled:opacity-60"
              >
                <p className="text-[13.5px] font-bold text-[#1A1D20]">Delete for me (admin only)</p>
                <p className="text-[12px] text-[#6B7280]">Hidden from the admin panel. Customer still sees it.</p>
              </button>
              <button
                onClick={() => topupToDelete && topupAction(topupToDelete.id, { action: "soft_delete", scope: "all" })}
                disabled={walletBusyId !== null}
                className="w-full text-left px-4 py-3 rounded-xl border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-60"
              >
                <p className="text-[13.5px] font-bold text-red-600">Delete everywhere</p>
                <p className="text-[12px] text-[#6B7280]">Also removed from the customer&apos;s transactions.</p>
              </button>
            </div>
            <button
              onClick={() => walletBusyId === null && setTopupToDelete(null)}
              disabled={walletBusyId !== null}
              className="w-full mt-3 px-4 py-2.5 rounded-xl border border-gray-200 text-[13px] font-semibold text-[#6B7280] hover:bg-gray-50 transition-colors disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {editOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !saving && setEditOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => !saving && setEditOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-[#1A1D20]" />
            </button>

            <h3 className="text-[17px] font-bold text-[#1A1D20] mb-1">Edit customer</h3>
            <p className="text-[12.5px] text-[#6B7280] mb-5">Update the customer&apos;s name and personal details.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-[#6B7280] mb-1.5">Full name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Customer name"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F9FAFB] border border-gray-200 text-[13px] font-medium text-[#1A1D20] outline-none focus:border-[#FF561E] focus:ring-2 focus:ring-[#FF561E]/10 transition-all uppercase"
                />
                <p className="text-[11px] text-[#9CA3AF] mt-1">Names are stored and shown in uppercase.</p>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#6B7280] mb-1.5">Email</label>
                <input
                  value={u?.email || ""}
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-100 border border-gray-200 text-[13px] font-medium text-[#9CA3AF] outline-none cursor-not-allowed"
                />
                <p className="text-[11px] text-[#9CA3AF] mt-1">Email is the login and can&apos;t be changed here.</p>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#6B7280] mb-1.5">Mobile</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="e.g. +44 7700 900000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F9FAFB] border border-gray-200 text-[13px] font-medium text-[#1A1D20] outline-none focus:border-[#FF561E] focus:ring-2 focus:ring-[#FF561E]/10 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-[#6B7280] mb-1.5">Date of birth</label>
                  <input
                    type="date"
                    value={form.date_of_birth}
                    onChange={(e) => setForm((f) => ({ ...f, date_of_birth: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F9FAFB] border border-gray-200 text-[13px] font-medium text-[#1A1D20] outline-none focus:border-[#FF561E] focus:ring-2 focus:ring-[#FF561E]/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#6B7280] mb-1.5">Gender</label>
                  <SelectMenu
                    value={form.gender}
                    onChange={(v) => setForm((f) => ({ ...f, gender: v }))}
                    placeholder="Select"
                    options={[
                      { value: "Male", label: "Male" },
                      { value: "Female", label: "Female" },
                      { value: "Other", label: "Other" },
                      { value: "Prefer not to say", label: "Prefer not to say" },
                    ]}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#6B7280] mb-1.5">Country</label>
                <input
                  value={form.country}
                  onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                  placeholder="Country"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F9FAFB] border border-gray-200 text-[13px] font-medium text-[#1A1D20] outline-none focus:border-[#FF561E] focus:ring-2 focus:ring-[#FF561E]/10 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-2.5 mt-6">
              <button
                onClick={saveEdit}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 flex-1 px-4 py-2.5 rounded-xl text-[14px] font-bold text-white bg-[#FF561E] hover:bg-[#E04B18] transition-colors disabled:opacity-70"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save changes
              </button>
              <button
                onClick={() => !saving && setEditOpen(false)}
                disabled={saving}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-[14px] font-semibold text-[#6B7280] hover:bg-gray-50 transition-colors disabled:opacity-70"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
