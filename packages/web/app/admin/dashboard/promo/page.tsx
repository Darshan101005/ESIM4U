"use client";

import AdminTopbar from "@/components/admin/admin-topbar";
import { useEffect, useState, useCallback } from "react";
import { Loader2, Plus, Trash2, Ticket, Pencil, X, Percent, DollarSign } from "lucide-react";
import toast from "react-hot-toast";

interface Promo {
  id: number;
  code: string;
  description: string | null;
  discount_type: "percent" | "fixed";
  discount_value: string;
  max_discount: string | null;
  usage_limit: number | null;
  used_count: number;
  expiry_date: string | null;
  is_active: boolean;
}

const EMPTY = {
  id: 0,
  code: "",
  description: "",
  discount_type: "percent" as "percent" | "fixed",
  discount_value: "",
  max_discount: "",
  usage_limit: "",
  expiry_date: "",
  is_active: true,
};

export default function AdminPromoPage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/promo");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPromos(data.promos || []);
    } catch {
      toast.error("Failed to load promo codes");
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

  const openEdit = (p: Promo) => {
    setForm({
      id: p.id,
      code: p.code,
      description: p.description || "",
      discount_type: p.discount_type,
      discount_value: String(p.discount_value),
      max_discount: p.max_discount ? String(p.max_discount) : "",
      usage_limit: p.usage_limit != null ? String(p.usage_limit) : "",
      expiry_date: p.expiry_date ? p.expiry_date.slice(0, 10) : "",
      is_active: p.is_active,
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.code.trim()) {
      toast.error("Code is required");
      return;
    }
    if (!form.discount_value || Number(form.discount_value) <= 0) {
      toast.error("Enter a valid discount value");
      return;
    }
    setSaving(true);
    try {
      const isEdit = form.id > 0;
      const res = await fetch("/api/admin/promo", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          expiry_date: form.expiry_date || null,
          usage_limit: form.usage_limit === "" ? null : form.usage_limit,
          max_discount: form.max_discount === "" ? null : form.max_discount,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      toast.success(isEdit ? "Promo updated" : "Promo created");
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
      const res = await fetch(`/api/admin/promo?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setPromos((prev) => prev.filter((p) => p.id !== id));
      toast.success("Promo deleted");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <AdminTopbar title="Promo Codes" />
      <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-[14px] text-[#6B7280]">Discount codes for your customers at checkout.</p>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF561E] text-white text-[13px] font-bold hover:bg-[#E04B18] transition-colors shadow-sm shadow-orange-500/20"
          >
            <Plus className="w-4 h-4" /> New Promo Code
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#FF561E] animate-spin" />
          </div>
        ) : promos.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-[14px] text-[#6B7280] font-medium">No promo codes yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-5 py-3 text-[12px] font-semibold text-[#6B7280]">Code</th>
                    <th className="px-5 py-3 text-[12px] font-semibold text-[#6B7280]">Discount</th>
                    <th className="px-5 py-3 text-[12px] font-semibold text-[#6B7280]">Usage</th>
                    <th className="px-5 py-3 text-[12px] font-semibold text-[#6B7280]">Expiry</th>
                    <th className="px-5 py-3 text-[12px] font-semibold text-[#6B7280]">Status</th>
                    <th className="px-5 py-3 text-[12px] font-semibold text-[#6B7280] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {promos.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/40 transition-colors">
                      <td className="px-5 py-4">
                        <span className="font-mono font-bold text-[13px] text-[#1A1D20]">{p.code}</span>
                        {p.description && <p className="text-[11px] text-[#6B7280]">{p.description}</p>}
                      </td>
                      <td className="px-5 py-4 text-[13px] font-semibold text-[#FF561E]">
                        {p.discount_type === "percent" ? `${p.discount_value}%` : `$${p.discount_value}`}
                      </td>
                      <td className="px-5 py-4 text-[13px] text-[#6B7280]">
                        {p.used_count}
                        {p.usage_limit != null ? ` / ${p.usage_limit}` : ""}
                      </td>
                      <td className="px-5 py-4 text-[13px] text-[#6B7280]">
                        {p.expiry_date ? new Date(p.expiry_date).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold ${p.is_active ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-[#6B7280]"}`}>
                          {p.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(p)} className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center hover:bg-[#FFF4F0] transition-colors">
                            <Pencil className="w-4 h-4 text-[#6B7280]" />
                          </button>
                          <button onClick={() => remove(p.id)} disabled={deletingId === p.id} className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center hover:bg-red-50 transition-colors">
                            {deletingId === p.id ? <Loader2 className="w-4 h-4 text-[#6B7280] animate-spin" /> : <Trash2 className="w-4 h-4 text-[#6B7280]" />}
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
              <h3 className="text-[18px] font-bold text-[#1A1D20]">{form.id > 0 ? "Edit Promo" : "New Promo Code"}</h3>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <X className="w-4 h-4 text-[#1A1D20]" />
              </button>
            </div>
            <div className="space-y-4">
              <Field label="Code">
                <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SUMMER10" className="input-base font-mono" />
              </Field>
              <Field label="Description (optional)">
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Summer sale" className="input-base" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Type">
                  <div className="flex rounded-xl border border-gray-200 overflow-hidden">
                    <button onClick={() => setForm({ ...form, discount_type: "percent" })} className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-[13px] font-semibold ${form.discount_type === "percent" ? "bg-[#FF561E] text-white" : "bg-white text-[#6B7280]"}`}>
                      <Percent className="w-3.5 h-3.5" /> %
                    </button>
                    <button onClick={() => setForm({ ...form, discount_type: "fixed" })} className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-[13px] font-semibold ${form.discount_type === "fixed" ? "bg-[#FF561E] text-white" : "bg-white text-[#6B7280]"}`}>
                      <DollarSign className="w-3.5 h-3.5" /> $
                    </button>
                  </div>
                </Field>
                <Field label={`Value ${form.discount_type === "percent" ? "(%)" : "($)"}`}>
                  <input type="number" min="0" step="0.01" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} className="input-base" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Max discount $ (optional)">
                  <input type="number" min="0" step="0.01" value={form.max_discount} onChange={(e) => setForm({ ...form, max_discount: e.target.value })} placeholder="No cap" className="input-base" />
                </Field>
                <Field label="Usage limit (optional)">
                  <input type="number" min="1" value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: e.target.value })} placeholder="Unlimited" className="input-base" />
                </Field>
              </div>
              <Field label="Expiry date (optional)">
                <input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} className="input-base" />
              </Field>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 accent-[#FF561E]" />
                <span className="text-[13px] font-medium text-[#1A1D20]">Active</span>
              </label>
              <button onClick={save} disabled={saving} className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#FF561E] text-white text-[14px] font-bold hover:bg-[#E04B18] transition-colors disabled:opacity-70">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {form.id > 0 ? "Save Changes" : "Create Promo"}
              </button>
            </div>
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
