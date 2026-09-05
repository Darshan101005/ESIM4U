"use client";

import AdminTopbar from "@/components/admin/admin-topbar";
import SelectMenu from "@/components/admin/select-menu";
import { useEffect, useState, useCallback } from "react";
import { Loader2, Plus, Trash2, Megaphone, Pencil, X, Percent, DollarSign, Wallet, Link2, Copy, Check, CheckCircle2, Clock } from "lucide-react";
import toast from "react-hot-toast";

interface Affiliate {
  id: number;
  code: string;
  name: string;
  email: string | null;
  platform: string | null;
  contact: string | null;
  commission_rate: string;
  customer_discount_type: "percent" | "fixed";
  customer_discount_value: string;
  is_active: boolean;
  access_token: string | null;
  sales_count: number;
  total_sales: string;
  total_commission: string;
  total_paid: string;
  balance_owed: string;
}

interface Payout {
  id: number;
  amount: string;
  status: "pending" | "completed";
  method: string | null;
  note: string | null;
  paid_at: string | null;
  created_at: string;
}

const EMPTY = {
  id: 0,
  code: "",
  name: "",
  email: "",
  platform: "",
  contact: "",
  commission_rate: "",
  customer_discount_type: "percent" as "percent" | "fixed",
  customer_discount_value: "",
  is_active: true,
};

export default function AdminAffiliatePage() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Payout management
  const [payoutFor, setPayoutFor] = useState<Affiliate | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutStatus, setPayoutStatus] = useState<"pending" | "completed">("completed");
  const [payoutNote, setPayoutNote] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const refreshPayouts = useCallback(async (id: number) => {
    const res = await fetch(`/api/admin/affiliate/payouts?affiliateId=${id}`, { cache: "no-store" });
    const data = await res.json();
    setPayouts(data.payouts || []);
  }, []);

  const openPayouts = async (a: Affiliate) => {
    setPayoutFor(a);
    setPayouts([]);
    setPayoutAmount(Number(a.balance_owed) > 0 ? Number(a.balance_owed).toFixed(2) : "");
    setPayoutStatus("completed");
    setPayoutNote("");
    setPayoutLoading(true);
    try {
      await refreshPayouts(a.id);
    } catch {
      toast.error("Failed to load payouts");
    } finally {
      setPayoutLoading(false);
    }
  };

  const recordPayout = async () => {
    if (!payoutFor) return;
    const amt = Number(payoutAmount);
    if (!(amt > 0)) {
      toast.error("Enter a valid amount");
      return;
    }
    try {
      const res = await fetch("/api/admin/affiliate/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ affiliateId: payoutFor.id, amount: amt, status: payoutStatus, note: payoutNote || null }),
      });
      if (!res.ok) throw new Error();
      toast.success("Payout recorded");
      setPayoutAmount("");
      setPayoutNote("");
      await refreshPayouts(payoutFor.id);
      await load();
    } catch {
      toast.error("Failed to record payout");
    }
  };

  const togglePayout = async (p: Payout) => {
    if (!payoutFor) return;
    const next = p.status === "completed" ? "pending" : "completed";
    try {
      await fetch("/api/admin/affiliate/payouts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id, status: next }),
      });
      await refreshPayouts(payoutFor.id);
      await load();
    } catch {
      toast.error("Failed to update payout");
    }
  };

  const copyLink = (a: Affiliate) => {
    if (!a.access_token) return;
    const link = `${window.location.origin}/partner/${a.access_token}`;
    navigator.clipboard?.writeText(link).then(() => {
      setCopiedId(a.id);
      toast.success("Dashboard link copied");
      setTimeout(() => setCopiedId(null), 1600);
    });
  };

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/affiliate");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAffiliates(data.affiliates || []);
    } catch {
      toast.error("Failed to load affiliates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setForm({ ...EMPTY });
    setShowForm(true);
  };

  const openEdit = (a: Affiliate) => {
    setForm({
      id: a.id,
      code: a.code,
      name: a.name,
      email: a.email || "",
      platform: a.platform || "",
      contact: a.contact || "",
      commission_rate: String(a.commission_rate),
      customer_discount_type: a.customer_discount_type,
      customer_discount_value: String(a.customer_discount_value),
      is_active: a.is_active,
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.code.trim()) {
      toast.error("Code is required");
      return;
    }
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (form.commission_rate === "" || Number(form.commission_rate) < 0) {
      toast.error("Enter a valid commission rate");
      return;
    }
    setSaving(true);
    try {
      const isEdit = form.id > 0;
      const res = await fetch("/api/admin/affiliate", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, customer_discount_value: form.customer_discount_value || 0 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      toast.success(isEdit ? "Affiliate updated" : "Affiliate created");
      setShowForm(false);
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/affiliate?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setAffiliates((prev) => prev.filter((a) => a.id !== id));
      toast.success("Affiliate deleted");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <AdminTopbar title="Affiliates" />
      <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8 max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <p className="text-[14px] text-[#6B7280]">Codes for influencers / YouTubers — track their sales and commission owed.</p>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF561E] text-white text-[13px] font-bold hover:bg-[#E04B18] transition-colors shadow-sm shadow-orange-500/20"
          >
            <Plus className="w-4 h-4" /> New Affiliate
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#FF561E] animate-spin" />
          </div>
        ) : affiliates.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-[14px] text-[#6B7280] font-medium">No affiliates yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-5 py-3 text-[12px] font-semibold text-[#6B7280]">Affiliate</th>
                    <th className="px-5 py-3 text-[12px] font-semibold text-[#6B7280]">Code</th>
                    <th className="px-5 py-3 text-[12px] font-semibold text-[#6B7280]">Commission</th>
                    <th className="px-5 py-3 text-[12px] font-semibold text-[#6B7280] text-right">Sales</th>
                    <th className="px-5 py-3 text-[12px] font-semibold text-[#6B7280] text-right">Owed</th>
                    <th className="px-5 py-3 text-[12px] font-semibold text-[#6B7280]">Status</th>
                    <th className="px-5 py-3 text-[12px] font-semibold text-[#6B7280] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {affiliates.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50/40 transition-colors">
                      <td className="px-5 py-4">
                        <p className="text-[13px] font-semibold text-[#1A1D20]">{a.name}</p>
                        {a.platform && <p className="text-[11px] text-[#6B7280]">{a.platform}</p>}
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-[13px] text-[#1A1D20]">{a.code}</td>
                      <td className="px-5 py-4 text-[13px] font-semibold text-[#FF561E]">{a.commission_rate}%</td>
                      <td className="px-5 py-4 text-[13px] text-[#6B7280] text-right">
                        {a.sales_count} · ${parseFloat(a.total_sales || "0").toFixed(2)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <p className="text-[13px] font-bold text-[#1A1D20]">${parseFloat(a.balance_owed || "0").toFixed(2)}</p>
                        <p className="text-[11px] text-[#9CA3AF]">${parseFloat(a.total_paid || "0").toFixed(2)} paid</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold ${a.is_active ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-[#6B7280]"}`}>
                          {a.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => copyLink(a)} title="Copy affiliate's dashboard link" className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center hover:bg-[#FFF4F0] transition-colors">
                            {copiedId === a.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Link2 className="w-4 h-4 text-[#6B7280]" />}
                          </button>
                          <button onClick={() => openPayouts(a)} title="Payouts" className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center hover:bg-[#FFF4F0] transition-colors">
                            <Wallet className="w-4 h-4 text-[#6B7280]" />
                          </button>
                          <button onClick={() => openEdit(a)} title="Edit" className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center hover:bg-[#FFF4F0] transition-colors">
                            <Pencil className="w-4 h-4 text-[#6B7280]" />
                          </button>
                          <button onClick={() => remove(a.id)} disabled={deletingId === a.id} title="Delete" className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center hover:bg-red-50 transition-colors">
                            {deletingId === a.id ? <Loader2 className="w-4 h-4 text-[#6B7280] animate-spin" /> : <Trash2 className="w-4 h-4 text-[#6B7280]" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[18px] font-bold text-[#1A1D20]">{form.id > 0 ? "Edit Affiliate" : "New Affiliate"}</h3>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <X className="w-4 h-4 text-[#1A1D20]" />
              </button>
            </div>
            <div className="space-y-4">
              <Field label="Affiliate Name">
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John's Travel Channel" className="input-base" />
              </Field>
              <Field label="Email">
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="affiliate@example.com" className="input-base" />
              </Field>
              <Field label="Code">
                <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="JOHN10" className="input-base font-mono" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Platform (optional)">
                  <input value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} placeholder="YouTube" className="input-base" />
                </Field>
                <Field label="Contact (optional)">
                  <input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="email / handle" className="input-base" />
                </Field>
              </div>
              <Field label="Commission Rate (%)">
                <input type="number" min="0" step="0.01" value={form.commission_rate} onChange={(e) => setForm({ ...form, commission_rate: e.target.value })} placeholder="10" className="input-base" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Customer Discount Type">
                  <div className="flex rounded-xl border border-gray-200 overflow-hidden">
                    <button onClick={() => setForm({ ...form, customer_discount_type: "percent" })} className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-[13px] font-semibold ${form.customer_discount_type === "percent" ? "bg-[#FF561E] text-white" : "bg-white text-[#6B7280]"}`}>
                      <Percent className="w-3.5 h-3.5" /> %
                    </button>
                    <button onClick={() => setForm({ ...form, customer_discount_type: "fixed" })} className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-[13px] font-semibold ${form.customer_discount_type === "fixed" ? "bg-[#FF561E] text-white" : "bg-white text-[#6B7280]"}`}>
                      <DollarSign className="w-3.5 h-3.5" /> $
                    </button>
                  </div>
                </Field>
                <Field label="Customer Discount (0 = none)">
                  <input type="number" min="0" step="0.01" value={form.customer_discount_value} onChange={(e) => setForm({ ...form, customer_discount_value: e.target.value })} placeholder="0" className="input-base" />
                </Field>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 accent-[#FF561E]" />
                <span className="text-[13px] font-medium text-[#1A1D20]">Active</span>
              </label>
              <button onClick={save} disabled={saving} className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#FF561E] text-white text-[14px] font-bold hover:bg-[#E04B18] transition-colors disabled:opacity-70">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {form.id > 0 ? "Save Changes" : "Create Affiliate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {payoutFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setPayoutFor(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[18px] font-bold text-[#1A1D20]">Payouts</h3>
                <p className="text-[12px] text-[#6B7280]">{payoutFor.name} · {payoutFor.code}</p>
              </div>
              <button onClick={() => setPayoutFor(null)} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <X className="w-4 h-4 text-[#1A1D20]" />
              </button>
            </div>

            <div className="rounded-xl bg-[#FFF4F0] border border-orange-100 p-3 mb-4 flex items-center justify-between gap-2">
              <span className="text-[12px] text-[#6B7280] truncate">
                Dashboard link: <span className="font-mono text-[#1A1D20]">/partner/{payoutFor.access_token?.slice(0, 10)}…</span>
              </span>
              <button onClick={() => copyLink(payoutFor)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-orange-100 text-[12px] font-semibold text-[#FF561E] shrink-0">
                {copiedId === payoutFor.id ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="rounded-xl border border-gray-100 p-3 text-center">
                <p className="text-[16px] font-bold text-[#1A1D20]">${parseFloat(payoutFor.total_commission || "0").toFixed(2)}</p>
                <p className="text-[11px] text-[#6B7280]">Earned</p>
              </div>
              <div className="rounded-xl border border-gray-100 p-3 text-center">
                <p className="text-[16px] font-bold text-emerald-600">${parseFloat(payoutFor.total_paid || "0").toFixed(2)}</p>
                <p className="text-[11px] text-[#6B7280]">Paid</p>
              </div>
              <div className="rounded-xl border border-gray-100 p-3 text-center">
                <p className="text-[16px] font-bold text-[#FF561E]">${parseFloat(payoutFor.balance_owed || "0").toFixed(2)}</p>
                <p className="text-[11px] text-[#6B7280]">Owed</p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 p-4 mb-5">
              <p className="text-[13px] font-bold text-[#1A1D20] mb-3">Record a payout</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input type="number" min="0" step="0.01" value={payoutAmount} onChange={(e) => setPayoutAmount(e.target.value)} placeholder="Amount ($)" className="input-base sm:w-32" />
                <div className="sm:w-48">
                  <SelectMenu
                    value={payoutStatus}
                    onChange={(v) => setPayoutStatus(v as "pending" | "completed")}
                    options={[
                      { value: "completed", label: "Completed (paid)" },
                      { value: "pending", label: "Pending" },
                    ]}
                  />
                </div>
                <button onClick={recordPayout} className="px-4 py-2.5 rounded-xl bg-[#FF561E] text-white text-[13px] font-bold hover:bg-[#E04B18] transition-colors shrink-0">Add</button>
              </div>
              <input value={payoutNote} onChange={(e) => setPayoutNote(e.target.value)} placeholder="Note (optional, e.g. PayPal txn id)" className="input-base mt-2" />
            </div>

            <p className="text-[13px] font-bold text-[#1A1D20] mb-2">History</p>
            {payoutLoading ? (
              <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 text-[#FF561E] animate-spin" /></div>
            ) : payouts.length === 0 ? (
              <p className="text-[13px] text-[#6B7280] py-3">No payouts recorded yet.</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {payouts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-[13px] font-bold text-[#1A1D20]">${parseFloat(p.amount).toFixed(2)}</p>
                      <p className="text-[11px] text-[#9CA3AF]">
                        {p.status === "completed" && p.paid_at ? new Date(p.paid_at).toLocaleDateString() : new Date(p.created_at).toLocaleDateString()}
                        {p.note ? ` · ${p.note}` : ""}
                      </p>
                    </div>
                    <button onClick={() => togglePayout(p)} title="Toggle status" className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${p.status === "completed" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                      {p.status === "completed" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                      {p.status === "completed" ? "Completed" : "Pending"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        :global(.input-base) {
          width: 100%;
          padding: 0.625rem 1rem;
          border-radius: 0.75rem;
          border: 1px solid #e5e7eb;
          font-size: 14px;
          outline: none;
          transition: all 0.15s;
        }
        :global(.input-base:focus) {
          border-color: #ff561e;
          box-shadow: 0 0 0 2px rgba(255, 86, 30, 0.1);
        }
      `}</style>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] font-medium text-[#6B7280] mb-2">{label}</label>
      {children}
    </div>
  );
}
