"use client";

import { useEffect, useState } from "react";
import {
  X,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Wallet,
  Gift,
  ShoppingBag,
  User,
  Calendar,
  Copy,
  Check,
  ChevronDown,
  CreditCard,
  Database,
  Hash,
} from "lucide-react";
import toast from "react-hot-toast";

interface OrderRow {
  id: number;
  order_reference: string;
  bundle_name: string | null;
  country: string | null;
  data_amount: string | null;
  validity: string | null;
  price: string;
  status: string;
  created_at: string;
}

interface CustomerData {
  user: { id: string; name: string | null; email: string | null; createdAt: string } | null;
  profile: { phone?: string | null; country?: string | null; preferred_currency?: string | null };
  wallet: { balanceUsd: number };
  referral: { balanceUsd: number; friendsReferred: number; earnedUsd: number } | null;
  orders: OrderRow[];
  stats: { total: number; spent: number };
}

function statusPill(status: string) {
  const map: Record<string, string> = {
    completed: "bg-emerald-50 text-emerald-600",
    pending: "bg-amber-50 text-amber-600",
    pending_verification: "bg-amber-50 text-amber-600",
    failed: "bg-red-50 text-red-500",
    refunded: "bg-gray-100 text-gray-500",
  };
  return map[status] || "bg-gray-100 text-gray-500";
}

const usd = (n: number) => `$${(n || 0).toFixed(2)}`;

function fmtData(mb?: number | null): string {
  if (mb == null) return "—";
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
  return `${Math.round(mb)} MB`;
}

function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(String(iso).replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

/* ------------------------------------------------------------------ */
/* Copyable value                                                      */
/* ------------------------------------------------------------------ */

function CopyValue({ value, mono }: { value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Copied");
      setTimeout(() => setCopied(false), 1200);
    } catch {
      toast.error("Could not copy");
    }
  };
  return (
    <button onClick={copy} title="Click to copy" className={`group inline-flex items-center gap-1.5 min-w-0 text-left ${mono ? "font-mono" : ""}`}>
      <span className="text-[13px] font-semibold text-[#1A1D20] truncate">{value}</span>
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <Copy className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#FF561E] shrink-0" />}
    </button>
  );
}

/** A field row that hides itself when the value is empty (unless `always`). */
function Field({
  icon: Icon,
  label,
  value,
  copyable,
  always,
}: {
  icon: typeof Mail;
  label: string;
  value?: string | null;
  copyable?: boolean;
  always?: boolean;
}) {
  const has = value != null && String(value).trim() !== "";
  if (!has && !always) return null;
  const shown = has ? String(value) : "Not provided";
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Icon className="w-4 h-4 text-[#FF561E] shrink-0" />
      <span className="text-[12px] text-[#6B7280] w-20 shrink-0">{label}</span>
      {copyable && has ? (
        <CopyValue value={shown} />
      ) : (
        <span className={`text-[13px] font-semibold truncate ${has ? "text-[#1A1D20]" : "text-gray-400"}`}>{shown}</span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Accordion section                                                   */
/* ------------------------------------------------------------------ */

function Section({
  icon: Icon,
  title,
  subtitle,
  defaultOpen,
  children,
}: {
  icon: typeof Mail;
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  return (
    <div className="rounded-2xl border border-gray-100 overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
        <div className="w-8 h-8 rounded-lg bg-[#FFF4F0] flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-[#FF561E]" />
        </div>
        <div className="min-w-0 flex-1 text-left">
          <p className="text-[13.5px] font-bold text-[#1A1D20]">{title}</p>
          {subtitle && <p className="text-[11.5px] text-[#6B7280] truncate">{subtitle}</p>}
        </div>
        <ChevronDown className={`w-4 h-4 text-[#6B7280] shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="border-t border-gray-50">{children}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Per-order detail (lazy loaded)                                      */
/* ------------------------------------------------------------------ */

interface FullOrder {
  order_reference: string;
  bundle_name?: string | null;
  country?: string | null;
  data_amount?: string | null;
  validity?: string | null;
  status: string;
  iccid?: string | null;
  monty_order_id?: string | null;
  bundle_expiry_date?: string | null;
  price: string;
  cost_price?: string | null;
  currency?: string | null;
  display_currency?: string | null;
  discount_amount?: string | null;
  referral_credit_used?: string | null;
  payment_source?: string | null;
  payment_method_type?: string | null;
  card_brand?: string | null;
  card_last4?: string | null;
  receipt_url?: string | null;
  created_at: string;
}
interface Consumption {
  data_allocated?: number;
  data_used?: number;
  unlimited?: boolean;
  plan_status?: string;
  bundle_expiry_date?: string;
}

function OrderDetail({ orderId }: { orderId: number }) {
  const [data, setData] = useState<{ order: FullOrder; consumption: Consumption | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch(`/api/admin/orders/${orderId}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active) setData(d);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 text-[#FF561E] animate-spin" />
      </div>
    );
  }
  if (!data?.order) return <p className="px-4 py-4 text-[12.5px] text-[#6B7280]">Details unavailable.</p>;

  const o = data.order;
  const c = data.consumption;
  const used = c?.data_used ?? 0;
  const allocated = c?.data_allocated ?? 0;
  const remaining = Math.max(0, allocated - used);

  return (
    <div className="px-4 py-3 bg-gray-50/60 space-y-3">
      {/* eSIM / plan */}
      <div>
        <p className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wide mb-1.5">eSIM & plan</p>
        <div className="rounded-xl bg-white border border-gray-100 divide-y divide-gray-50">
          <Field icon={Database} label="Data" value={o.data_amount} />
          <Field icon={Calendar} label="Validity" value={o.validity} />
          <Field icon={Calendar} label="Expires" value={fmtDate(c?.bundle_expiry_date || o.bundle_expiry_date)} />
          {o.iccid ? <Field icon={Hash} label="ICCID" value={o.iccid} copyable /> : null}
          <Field icon={Hash} label="Ref" value={o.order_reference} copyable />
        </div>
      </div>

      {/* Data usage */}
      {c && (
        <div>
          <p className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wide mb-1.5">Data usage</p>
          <div className="rounded-xl bg-white border border-gray-100 p-3">
            {c.plan_status && (
              <span className="inline-block mb-2 px-2 py-0.5 rounded-full bg-[#FFF4F0] text-[#FF561E] text-[10px] font-bold capitalize">{c.plan_status}</span>
            )}
            {c.unlimited ? (
              <p className="text-[13px] font-semibold text-[#1A1D20]">Unlimited data</p>
            ) : (
              <>
                <div className="flex items-center justify-between text-[12.5px] mb-1">
                  <span className="text-[#6B7280]">Used</span>
                  <span className="font-semibold text-[#1A1D20]">{fmtData(used)} / {fmtData(allocated)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full bg-[#FF561E]" style={{ width: `${allocated > 0 ? Math.min(100, (used / allocated) * 100) : 0}%` }} />
                </div>
                <div className="flex items-center justify-between text-[12.5px] mt-1.5">
                  <span className="text-[#6B7280]">Remaining</span>
                  <span className="font-semibold text-[#1A1D20]">{fmtData(remaining)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Payment */}
      <div>
        <p className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wide mb-1.5">Payment</p>
        <div className="rounded-xl bg-white border border-gray-100 divide-y divide-gray-50">
          <Field icon={CreditCard} label="Method" value={paymentLabel(o)} />
          <Field icon={CreditCard} label="Amount" value={usd(Number(o.price))} />
          {Number(o.discount_amount) > 0 ? <Field icon={CreditCard} label="Discount" value={usd(Number(o.discount_amount))} /> : null}
          {Number(o.referral_credit_used) > 0 ? <Field icon={Gift} label="Referral" value={usd(Number(o.referral_credit_used))} /> : null}
          <Field icon={Calendar} label="Ordered" value={fmtDate(o.created_at)} />
        </div>
        {o.receipt_url && (
          <a href={o.receipt_url} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-[12.5px] font-semibold text-[#FF561E] hover:underline">
            View receipt →
          </a>
        )}
      </div>
    </div>
  );
}

function paymentLabel(o: FullOrder): string {
  const src = (o.payment_source || o.payment_method_type || "").toLowerCase();
  const map: Record<string, string> = { stripe: "Card (Stripe)", paypal: "PayPal", wallet: "Wallet", bank_transfer: "Bank transfer" };
  let label = map[src] || o.payment_source || o.payment_method_type || "—";
  if (o.card_brand && o.card_last4) label += ` · ${o.card_brand} ****${o.card_last4}`;
  return label;
}

/* ------------------------------------------------------------------ */
/* Drawer                                                              */
/* ------------------------------------------------------------------ */

export default function CustomerDetailsDrawer({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [data, setData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [openOrder, setOpenOrder] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/admin/support/customer/${encodeURIComponent(userId)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active) setData(d);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  const u = data?.user;
  const p = data?.profile || {};

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <aside className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h3 className="text-[15px] font-bold text-[#1A1D20]">Customer details</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200">
            <X className="w-4 h-4 text-[#1A1D20]" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-7 h-7 text-[#FF561E] animate-spin" />
          </div>
        ) : !u ? (
          <div className="p-6 text-center text-[13px] text-[#6B7280]">Customer record not found.</div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Identity */}
            <div className="flex items-center gap-3 px-1">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FF561E] to-[#FF7A45] flex items-center justify-center text-white text-[20px] font-bold shrink-0">
                {(u.name || u.email || "?").trim().charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-[16px] font-bold text-[#1A1D20] truncate">{u.name ? u.name.toUpperCase() : "Customer"}</p>
                <p className="text-[12px] text-[#6B7280]">Joined {fmtDate(u.createdAt)}</p>
              </div>
            </div>

            {/* Contact & personal — mobile always shown; empty fields hidden */}
            <Section icon={User} title="Contact & personal" defaultOpen>
              <div className="divide-y divide-gray-50">
                <Field icon={Mail} label="Email" value={u.email} copyable />
                <Field icon={Phone} label="Mobile" value={p.phone} copyable always />
                <Field icon={MapPin} label="Country" value={p.country} />
                <Field icon={User} label="Currency" value={p.preferred_currency} />
              </div>
            </Section>

            {/* Wallet & referral */}
            <Section icon={Wallet} title="Wallet & credit" subtitle={`${usd(data!.wallet.balanceUsd)} wallet`}>
              <div className="divide-y divide-gray-50">
                <Field icon={Wallet} label="Wallet" value={usd(data!.wallet.balanceUsd)} />
                <Field icon={Gift} label="Referral" value={usd(data!.referral?.balanceUsd || 0)} />
                <Field icon={Gift} label="Friends" value={String(data!.referral?.friendsReferred ?? 0)} />
                <Field icon={Gift} label="Earned" value={usd(data!.referral?.earnedUsd || 0)} />
              </div>
            </Section>

            {/* Plans / orders — click a plan to load its details */}
            <Section icon={ShoppingBag} title="Plans & orders" subtitle={`${data!.stats.total} orders · ${usd(data!.stats.spent)} spent`} defaultOpen>
              {data!.orders.length === 0 ? (
                <p className="px-4 py-4 text-[12.5px] text-[#6B7280]">No orders yet.</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {data!.orders.map((o) => (
                    <div key={o.id}>
                      <button onClick={() => setOpenOrder(openOrder === o.id ? null : o.id)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left">
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-semibold text-[#1A1D20] truncate">{o.bundle_name || o.country || "eSIM Plan"}</p>
                          <p className="text-[11.5px] text-[#6B7280] truncate">{[o.data_amount, o.validity].filter(Boolean).join(" · ") || fmtDate(o.created_at)}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[13px] font-bold text-[#1A1D20]">${parseFloat(o.price).toFixed(2)}</p>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${statusPill(o.status)}`}>{o.status.replace("_", " ")}</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-gray-300 shrink-0 transition-transform ${openOrder === o.id ? "rotate-180" : ""}`} />
                      </button>
                      {openOrder === o.id && <OrderDetail orderId={o.id} />}
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </div>
        )}
      </aside>
    </div>
  );
}
