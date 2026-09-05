"use client";

import AdminTopbar from "@/components/admin/admin-topbar";
import { useEffect, useState, useCallback } from "react";
import {
  Loader2,
  Landmark,
  Check,
  X,
  PauseCircle,
  RotateCcw,
  ExternalLink,
  Hash,
  User,
  Calendar,
  StickyNote,
  CreditCard,
  Pencil,
} from "lucide-react";
import toast from "react-hot-toast";

interface BankDetailsForm {
  accountName: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  sortCode: string;
  swift: string;
  iban: string;
}

const EMPTY_BANK_FORM: BankDetailsForm = {
  accountName: "",
  bankName: "",
  accountHolder: "",
  accountNumber: "",
  sortCode: "",
  swift: "",
  iban: "",
};

type BtStatus = "pending_verification" | "processing" | "completed" | "rejected" | "on_hold" | "failed";

interface BtOrder {
  id: number;
  order_reference: string;
  bundle_name?: string;
  country?: string;
  data_amount?: string;
  validity?: string;
  price: string;
  status: string;
}

interface BankTransfer {
  id: number;
  reference: string;
  user_email: string;
  customer_name: string | null;
  amount_usd: string;
  display_currency: string;
  display_amount: string;
  txn_reference: string | null;
  amount_paid: string | null;
  sender_name: string | null;
  payment_date: string | null;
  note: string | null;
  proof_urls: string[];
  status: BtStatus;
  admin_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  orders: BtOrder[];
}

const FILTERS: { value: BtStatus | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "pending_verification", label: "Pending Verification" },
  { value: "on_hold", label: "On Hold" },
  { value: "processing", label: "Processing" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_META: Record<BtStatus, { label: string; cls: string }> = {
  pending_verification: { label: "Pending Verification", cls: "bg-amber-50 text-amber-600" },
  processing: { label: "Processing", cls: "bg-blue-50 text-blue-600" },
  completed: { label: "Completed", cls: "bg-emerald-50 text-emerald-600" },
  rejected: { label: "Rejected", cls: "bg-red-50 text-red-500" },
  on_hold: { label: "On Hold", cls: "bg-gray-100 text-[#6B7280]" },
  failed: { label: "Failed", cls: "bg-red-50 text-red-500" },
};

const CURRENCY_SYMBOL: Record<string, string> = { USD: "$", EUR: "€", GBP: "£" };

function money(currency: string, amount: string) {
  const sym = CURRENCY_SYMBOL[currency] || "";
  return `${sym}${Number(amount).toFixed(2)}`;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return iso;
  }
}

export default function VerifyPaymentsPage() {
  const [transfers, setTransfers] = useState<BankTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<BtStatus | "">("");
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<BankDetailsForm>(EMPTY_BANK_FORM);
  const [editLoading, setEditLoading] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const openEdit = async () => {
    setEditOpen(true);
    setEditLoading(true);
    try {
      const res = await fetch("/api/admin/bank-details", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data.details) setEditForm(data.details);
    } catch {
      toast.error("Could not load bank details");
    } finally {
      setEditLoading(false);
    }
  };

  const saveEdit = async () => {
    setSavingEdit(true);
    try {
      const res = await fetch("/api/admin/bank-details", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save");
      toast.success("Bank details updated");
      setEditOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSavingEdit(false);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter) params.set("status", filter);
      const res = await fetch(`/api/admin/bank-transfers?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTransfers(data.transfers || []);
    } catch {
      setTransfers([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const runAction = async (id: number, action: "approve" | "reject" | "on_hold" | "retry") => {
    if ((action === "reject" || action === "on_hold") && !notes[id]?.trim()) {
      // Note optional but encouraged; proceed regardless.
    }
    setBusy(id);
    try {
      const res = await fetch("/api/admin/bank-transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, note: notes[id] || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");

      const meta = STATUS_META[data.status as BtStatus];
      if (action === "approve" || action === "retry") {
        if (data.status === "completed") toast.success("Approved. eSIM provisioned and QR is ready.");
        else if (data.status === "failed") toast.error("Approved, but provisioning failed for some items. Use Retry.");
        else toast.success("Processing.");
      } else {
        toast.success(meta ? meta.label : "Updated");
      }
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <AdminTopbar title="Verify Payments" />
      <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8 max-w-5xl mx-auto w-full">
        <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f.value || "all"}
                onClick={() => setFilter(f.value)}
                className={`px-4 py-2 rounded-xl text-[13px] font-semibold transition-all ${
                  filter === f.value ? "bg-[#FF561E] text-white shadow-sm" : "bg-white border border-gray-200 text-[#6B7280] hover:text-[#FF561E]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button
            onClick={openEdit}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-[13px] font-semibold text-[#1A1D20] hover:border-[#FF561E] hover:text-[#FF561E] transition-colors shrink-0"
          >
            <Pencil className="w-4 h-4" /> Edit Bank Account Details
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#FF561E] animate-spin" />
          </div>
        ) : transfers.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <Landmark className="w-12 h-12 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-[14px] text-[#6B7280] font-medium">No bank transfers to show</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transfers.map((t) => {
              const meta = STATUS_META[t.status];
              const canReview = t.status === "pending_verification" || t.status === "on_hold";
              const canRetry = t.status === "failed";
              const isBusy = busy === t.id;
              return (
                <div key={t.id} className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[14px] font-bold text-[#1A1D20]">{t.customer_name ? t.customer_name.toUpperCase() : "Customer"}</span>
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold ${meta.cls}`}>{meta.label}</span>
                      </div>
                      <p className="text-[12.5px] text-[#6B7280] mt-0.5">{t.user_email}</p>
                      <p className="text-[11.5px] text-[#9CA3AF] font-mono mt-0.5">{t.reference} · {formatDate(t.created_at)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[11px] text-[#6B7280]">Expected</p>
                      <p className="text-[18px] font-bold text-[#FF561E] leading-tight">{money(t.display_currency, t.display_amount)}</p>
                    </div>
                  </div>

                  {/* Proof images */}
                  <div className="flex flex-wrap gap-3 mt-4">
                    {t.proof_urls.length === 0 ? (
                      <p className="text-[12px] text-[#9CA3AF]">No screenshot uploaded.</p>
                    ) : (
                      t.proof_urls.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 group"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`Proof ${i + 1}`} className="w-full h-full object-cover" />
                          <span className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                            <ExternalLink className="w-4 h-4 text-white opacity-0 group-hover:opacity-100" />
                          </span>
                        </a>
                      ))
                    )}
                  </div>

                  {/* Customer-entered details */}
                  {(t.txn_reference || t.amount_paid || t.sender_name || t.payment_date || t.note) && (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl bg-gray-50/60 border border-gray-100 p-3">
                      {t.txn_reference && (
                        <Detail icon={Hash} label="Transaction / reference" value={t.txn_reference} />
                      )}
                      {t.amount_paid && <Detail icon={CreditCard} label="Amount paid (stated)" value={t.amount_paid} />}
                      {t.sender_name && <Detail icon={User} label="Sender name" value={t.sender_name} />}
                      {t.payment_date && <Detail icon={Calendar} label="Payment date" value={t.payment_date} />}
                      {t.note && <Detail icon={StickyNote} label="Customer note" value={t.note} full />}
                    </div>
                  )}

                  {/* Linked eSIMs */}
                  <div className="mt-4">
                    <p className="text-[12px] font-semibold text-[#6B7280] mb-2">eSIMs in this order ({t.orders.length})</p>
                    <div className="space-y-1.5">
                      {t.orders.map((o) => (
                        <div key={o.id} className="flex items-center justify-between text-[12.5px]">
                          <span className="text-[#1A1D20] font-medium truncate">{o.bundle_name || o.country || "eSIM Plan"}</span>
                          <span className="text-[#6B7280] capitalize shrink-0">{o.status.replace(/_/g, " ")}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Admin note + actions */}
                  {t.admin_note && (
                    <p className="mt-3 text-[12px] text-[#6B7280]">
                      <span className="font-semibold">Admin note:</span> {t.admin_note}
                    </p>
                  )}

                  {(canReview || canRetry) && (
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                      <textarea
                        value={notes[t.id] || ""}
                        onChange={(e) => setNotes((prev) => ({ ...prev, [t.id]: e.target.value }))}
                        placeholder="Optional note (shown to your team; add a reason when rejecting or holding)"
                        rows={2}
                        className="w-full px-3 py-2.5 rounded-xl bg-white border border-gray-200 outline-none focus:border-[#FF561E] focus:ring-2 focus:ring-[#FF561E]/10 text-[13px] transition-all resize-none"
                      />
                      <div className="flex flex-wrap gap-2">
                        {(canReview || canRetry) && (
                          <button
                            onClick={() => runAction(t.id, canRetry ? "retry" : "approve")}
                            disabled={isBusy}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-[13px] font-bold hover:bg-emerald-600 transition-colors disabled:opacity-60"
                          >
                            {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : canRetry ? <RotateCcw className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                            {canRetry ? "Retry Provisioning" : "Approve & Provision"}
                          </button>
                        )}
                        {t.status === "pending_verification" && (
                          <button
                            onClick={() => runAction(t.id, "on_hold")}
                            disabled={isBusy}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-[#6B7280] text-[13px] font-bold hover:text-[#1A1D20] hover:border-gray-300 transition-colors disabled:opacity-60"
                          >
                            <PauseCircle className="w-4 h-4" /> Put On Hold
                          </button>
                        )}
                        <button
                          onClick={() => runAction(t.id, "reject")}
                          disabled={isBusy}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-red-200 text-red-500 text-[13px] font-bold hover:bg-red-50 transition-colors disabled:opacity-60"
                        >
                          <X className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {editOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !savingEdit && setEditOpen(false)} />
            <div className="relative bg-white rounded-2xl border border-gray-100 shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
                <h3 className="text-[15px] font-bold text-[#1A1D20]">Edit Bank Account Details</h3>
                <button
                  onClick={() => !savingEdit && setEditOpen(false)}
                  className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                >
                  <X className="w-4 h-4 text-[#1A1D20]" />
                </button>
              </div>
              {editLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-[#FF561E] animate-spin" />
                </div>
              ) : (
                <div className="p-5 space-y-3">
                  <BankField label="Account name" value={editForm.accountName} onChange={(v) => setEditForm((f) => ({ ...f, accountName: v }))} />
                  <BankField label="Bank name" value={editForm.bankName} onChange={(v) => setEditForm((f) => ({ ...f, bankName: v }))} />
                  <BankField label="Account holder" value={editForm.accountHolder} onChange={(v) => setEditForm((f) => ({ ...f, accountHolder: v }))} />
                  <BankField label="Account number" value={editForm.accountNumber} onChange={(v) => setEditForm((f) => ({ ...f, accountNumber: v }))} />
                  <BankField label="Sort code" value={editForm.sortCode} onChange={(v) => setEditForm((f) => ({ ...f, sortCode: v }))} />
                  <BankField label="SWIFT / BIC" value={editForm.swift} onChange={(v) => setEditForm((f) => ({ ...f, swift: v }))} />
                  <BankField label="IBAN" value={editForm.iban} onChange={(v) => setEditForm((f) => ({ ...f, iban: v }))} />
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={saveEdit}
                      disabled={savingEdit}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF561E] text-white text-[13px] font-bold hover:bg-[#E04B18] transition-colors disabled:opacity-60"
                    >
                      {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save Changes
                    </button>
                    <button
                      onClick={() => setEditOpen(false)}
                      disabled={savingEdit}
                      className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-[#6B7280] text-[13px] font-bold hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}

function BankField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-[12.5px] font-semibold text-[#1A1D20] mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl bg-white border border-gray-200 outline-none focus:border-[#FF561E] focus:ring-2 focus:ring-[#FF561E]/10 text-[13.5px] transition-all"
      />
      {hint && <p className="text-[11px] text-[#9CA3AF] mt-1">{hint}</p>}
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
  full,
}: {
  icon: typeof Hash;
  label: string;
  value: string;
  full?: boolean;
}) {
  return (
    <div className={`flex items-start gap-2.5 ${full ? "sm:col-span-2" : ""}`}>
      <Icon className="w-4 h-4 text-[#6B7280] shrink-0 mt-0.5" strokeWidth={2} />
      <div className="min-w-0">
        <p className="text-[11px] text-[#6B7280]">{label}</p>
        <p className="text-[12.5px] font-semibold text-[#1A1D20] break-words">{value}</p>
      </div>
    </div>
  );
}
