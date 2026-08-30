"use client";

import DashboardTopbar from "@/components/dashboard/topbar";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Loader2,
  Lock,
  ArrowRight,
  ArrowLeft,
  Tag,
  X,
  Wallet,
  Wifi,
  Clock,
  RadioTower,
  Copy,
  Check,
  Plus,
  Trash2,
  Landmark,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";
import Flag from "@/components/dashboard/flag";
import { useCurrency } from "@/lib/currency-context";
import { useCart } from "@/lib/cart-context";
import { DEFAULT_BANK_DETAILS, BANK_LOGO, BANK_PAY_CURRENCY, BankDetails } from "@/lib/bank-details";
import { CURRENCY_SYMBOLS } from "@/lib/fx";

function Pill({ icon: Icon, children }: { icon: typeof Wifi; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-100 text-[11.5px] font-semibold text-[#374151]">
      <Icon className="w-3.5 h-3.5 text-[#FF561E]" strokeWidth={2} />
      {children}
    </span>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-[12.5px] text-[#6B7280] shrink-0">{label}</span>
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[13px] font-semibold text-[#1A1D20] font-mono truncate">{value}</span>
        <button
          type="button"
          onClick={copy}
          className="w-6 h-6 rounded-md bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 hover:bg-gray-100 transition-colors"
          aria-label={`Copy ${label}`}
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#6B7280]" />}
        </button>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { currency, format, rates } = useCurrency();
  const { items, loading, clearCart } = useCart();
  const [placing, setPlacing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "paypal" | "wallet" | "bank">("stripe");

  const [walletBalanceUsd, setWalletBalanceUsd] = useState<number | null>(null);

  // Bank-transfer submission state.
  const [bankDetails, setBankDetails] = useState<BankDetails>(DEFAULT_BANK_DETAILS);
  const [btProofs, setBtProofs] = useState<string[]>([]);
  const [btTxnRef, setBtTxnRef] = useState("");
  const [btAmountPaid, setBtAmountPaid] = useState("");
  const [btSender, setBtSender] = useState("");
  const [btDate, setBtDate] = useState("");
  const [btNote, setBtNote] = useState("");

  const [codeInput, setCodeInput] = useState("");
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [discountUsd, setDiscountUsd] = useState(0);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    if (!loading && items.length === 0) router.replace("/dashboard/cart");
  }, [loading, items, router]);

  useEffect(() => {
    fetch("/api/wallet")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data.balanceUsd === "number") setWalletBalanceUsd(data.balanceUsd);
      })
      .catch(() => {});

    fetch("/api/bank-details")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.details) setBankDetails(data.details);
      })
      .catch(() => {});
  }, []);

  const subtotal = items.reduce((sum, i) => sum + parseFloat(i.price || "0"), 0);
  const finalTotal = Math.max(0, Math.round((subtotal - discountUsd) * 100) / 100);
  const walletCovers = walletBalanceUsd !== null && walletBalanceUsd + 1e-9 >= finalTotal;

  // Amount the customer should pay into the GBP bank account.
  const payCurrency = BANK_PAY_CURRENCY;
  const paySymbol = CURRENCY_SYMBOLS[payCurrency];
  const payAmount = rates ? Math.round(finalTotal * rates[payCurrency] * 100) / 100 : null;

  const MAX_PROOFS = 3;
  const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  const onPickFiles = (files: FileList | null) => {
    if (!files) return;
    const remaining = MAX_PROOFS - btProofs.length;
    if (remaining <= 0) {
      toast.error(`You can upload up to ${MAX_PROOFS} screenshots`);
      return;
    }
    Array.from(files)
      .slice(0, remaining)
      .forEach((file) => {
        if (!ALLOWED_TYPES.includes(file.type)) {
          toast.error("Only JPG, PNG or WebP images are allowed");
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error("Each image must be under 5MB");
          return;
        }
        const reader = new FileReader();
        reader.onload = () => setBtProofs((prev) => (prev.length < MAX_PROOFS ? [...prev, reader.result as string] : prev));
        reader.readAsDataURL(file);
      });
  };

  const applyCode = async () => {
    const code = codeInput.trim();
    if (!code) return;
    setValidating(true);
    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid code");
      setAppliedCode(data.code);
      setDiscountUsd(data.discountAmount || 0);
      toast.success(`Code applied: -${format(data.discountAmount || 0)}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setValidating(false);
    }
  };

  const removeCode = () => {
    setAppliedCode(null);
    setDiscountUsd(0);
    setCodeInput("");
  };

  const placeStripeOrder = async () => {
    setPlacing(true);
    try {
      const res = await fetch("/api/payments/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: appliedCode || undefined,
          display_currency: currency,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Could not start checkout");

      window.location.href = data.url;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Checkout failed");
      setPlacing(false);
    }
  };

  const placeWalletOrder = async () => {
    if (!walletCovers) {
      toast.error("Not enough wallet balance. Top up first.");
      return;
    }
    setPlacing(true);
    try {
      const res = await fetch("/api/payments/wallet/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: appliedCode || undefined,
          display_currency: currency,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.code === "INSUFFICIENT_FUNDS") {
          toast.error("Not enough wallet balance. Top up first.");
          setWalletBalanceUsd(typeof data.balanceUsd === "number" ? data.balanceUsd : walletBalanceUsd);
          setPlacing(false);
          return;
        }
        throw new Error(data.error || "Wallet payment failed");
      }

      clearCart();
      const orders: { id?: number; status?: string }[] = data.orders || [];
      const firstSuccess = orders.find((o) => o.id && o.status === "completed");
      if (firstSuccess) {
        toast.success("Paid with wallet! Your eSIM is ready.");
        router.replace(`/dashboard/orders/${firstSuccess.id}`);
      } else if (orders.length > 0) {
        toast.error("Payment taken, but eSIM activation needs attention. We refunded any failed items to your wallet.");
        router.replace("/dashboard/orders");
      } else {
        router.replace("/dashboard/orders");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Wallet payment failed");
      setPlacing(false);
    }
  };

  const placePaypalOrder = async () => {
    setPlacing(true);
    try {
      const res = await fetch("/api/payments/paypal/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: appliedCode || undefined, display_currency: currency }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Could not start PayPal checkout");
      window.location.href = data.url;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "PayPal checkout failed");
      setPlacing(false);
    }
  };

  const placeBankTransferOrder = async () => {
    if (btProofs.length === 0) {
      toast.error("Please upload at least one payment screenshot");
      return;
    }
    setPlacing(true);
    try {
      const res = await fetch("/api/payments/bank-transfer/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: appliedCode || undefined,
          display_currency: currency,
          txn_reference: btTxnRef || undefined,
          amount_paid: btAmountPaid || undefined,
          sender_name: btSender || undefined,
          payment_date: btDate || undefined,
          note: btNote || undefined,
          proofs: btProofs,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");

      clearCart();
      toast.success("Submitted. We'll verify your payment and activate your eSIM shortly.");
      router.replace("/dashboard/orders");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
      setPlacing(false);
    }
  };

  const placeOrder = () => {
    if (paymentMethod === "wallet") return placeWalletOrder();
    if (paymentMethod === "bank") return placeBankTransferOrder();
    if (paymentMethod === "paypal") return placePaypalOrder();
    return placeStripeOrder();
  };

  return (
    <>
      <DashboardTopbar title="Checkout" />
      <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#FF561E] animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[16px] font-bold text-[#1A1D20]">Review Order</h3>
                  <span className="text-[13px] font-medium text-[#6B7280]">{items.length} item{items.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {items.map((item) => {
                    const title = item.bundle_name || item.country || "eSIM Plan";
                    return (
                      <div key={item.id} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-9 rounded-md overflow-hidden border border-gray-100 shrink-0 relative">
                            <Flag code={item.country_code} name={item.country} className="w-full h-full" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[14px] font-semibold text-[#1A1D20] truncate">{title}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                              {item.data_amount && <Pill icon={Wifi}>{item.data_amount}</Pill>}
                              {item.validity && <Pill icon={Clock}>{item.validity}</Pill>}
                              <Pill icon={RadioTower}>4G / LTE</Pill>
                            </div>
                          </div>
                        </div>
                        <span className="text-[14px] font-bold text-[#1A1D20] shrink-0">{format(parseFloat(item.price))}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
                <h3 className="text-[16px] font-bold text-[#1A1D20] mb-4">Promo / Affiliate Code</h3>
                {appliedCode ? (
                  <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-emerald-600" />
                      <span className="text-[13px] font-semibold text-emerald-700 font-mono">{appliedCode}</span>
                      <span className="text-[12px] text-emerald-600">(-{format(discountUsd)})</span>
                    </div>
                    <button onClick={removeCode} className="w-7 h-7 rounded-lg bg-white border border-emerald-100 flex items-center justify-center">
                      <X className="w-3.5 h-3.5 text-emerald-600" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      value={codeInput}
                      onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                      placeholder="Enter code"
                      className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-gray-200 outline-none focus:border-[#FF561E] focus:ring-2 focus:ring-[#FF561E]/10 text-[14px] font-mono transition-all"
                    />
                    <button
                      onClick={applyCode}
                      disabled={validating || !codeInput.trim()}
                      className="px-5 py-2.5 rounded-xl bg-[#1A1D20] text-white text-[13px] font-bold hover:bg-black transition-colors disabled:opacity-50"
                    >
                      {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[16px] font-bold text-[#1A1D20]">Payment Method</h3>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-semibold">
                    <Lock className="w-3 h-3" /> Secure
                  </span>
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("stripe")}
                    className={`w-full flex items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                      paymentMethod === "stripe" ? "border-[#FF561E] bg-[#FFF4F0]/50 ring-1 ring-[#FF561E]/30" : "border-gray-200 hover:border-orange-200"
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentMethod === "stripe" ? "border-[#FF561E]" : "border-gray-300"}`}>
                      {paymentMethod === "stripe" && <span className="w-2.5 h-2.5 rounded-full bg-[#FF561E]" />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <Image src="/assets/stripe.svg" alt="Stripe" width={96} height={40} className="h-6 w-auto object-contain" />
                      <p className="text-[12.5px] text-[#6B7280] mt-2">Pay by card, Google Pay, Apple Pay and more.</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("paypal")}
                    className={`w-full flex items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                      paymentMethod === "paypal" ? "border-[#FF561E] bg-[#FFF4F0]/50 ring-1 ring-[#FF561E]/30" : "border-gray-200 hover:border-orange-200"
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentMethod === "paypal" ? "border-[#FF561E]" : "border-gray-300"}`}>
                      {paymentMethod === "paypal" && <span className="w-2.5 h-2.5 rounded-full bg-[#FF561E]" />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <Image src="/assets/paypal.webp" alt="PayPal" width={96} height={40} className="h-6 w-auto object-contain" />
                      <p className="text-[12.5px] text-[#6B7280] mt-2">Pay securely with your PayPal balance, card or bank.</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("bank")}
                    className={`w-full flex items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                      paymentMethod === "bank" ? "border-[#FF561E] bg-[#FFF4F0]/50 ring-1 ring-[#FF561E]/30" : "border-gray-200 hover:border-orange-200"
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentMethod === "bank" ? "border-[#FF561E]" : "border-gray-300"}`}>
                      {paymentMethod === "bank" && <span className="w-2.5 h-2.5 rounded-full bg-[#FF561E]" />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <Image src={BANK_LOGO} alt={bankDetails.bankName} width={96} height={40} className="h-6 w-auto object-contain" />
                      <p className="text-[12.5px] text-[#6B7280] mt-2">Pay directly by bank transfer, then upload your payment proof.</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-[#FF561E]/10 text-[#FF561E] text-[10px] font-bold shrink-0">
                      Direct Bank Transfer
                    </span>
                  </button>

                  {paymentMethod === "bank" && (
                    <div className="rounded-xl border border-gray-200 p-4 space-y-4">
                      <div className="rounded-lg bg-[#FFF4F0] border border-[#FFE0D2] p-3 flex items-center justify-between">
                        <div>
                          <p className="text-[11.5px] text-[#C2410C] font-semibold">Amount to transfer</p>
                          <p className="text-[20px] font-bold text-[#FF561E] leading-tight">
                            {payAmount === null ? `${paySymbol}…` : `${paySymbol}${payAmount.toFixed(2)}`}
                          </p>
                        </div>
                        <span className="text-[11px] text-[#6B7280] font-medium">≈ {format(finalTotal)}</span>
                      </div>

                      <div className="rounded-lg border border-gray-100 px-3">
                        <CopyRow label="Account name" value={bankDetails.accountName} />
                        <CopyRow label="Account holder" value={bankDetails.accountHolder} />
                        <CopyRow label="Bank" value={bankDetails.bankName} />
                        <CopyRow label="Sort code" value={bankDetails.sortCode} />
                        <CopyRow label="Account number" value={bankDetails.accountNumber} />
                        {bankDetails.swift && <CopyRow label="SWIFT / BIC" value={bankDetails.swift} />}
                        {bankDetails.iban && <CopyRow label="IBAN" value={bankDetails.iban} />}
                      </div>

                      <div className="space-y-2 text-[12px] text-[#6B7280]">
                        <div className="flex items-start gap-2">
                          <Info className="w-4 h-4 text-[#FF561E] shrink-0 mt-0.5" />
                          <p>Transfer the amount shown above, then upload your payment screenshot below. Once we verify your payment, your eSIM will be activated, usually within a few hours.</p>
                        </div>
                        <ul className="pl-6 space-y-1 list-disc marker:text-[#FF561E]">
                          <li>
                            <span className="font-semibold text-[#374151]">Domestic Transfer (United Kingdom):</span> Use the{" "}
                            <span className="font-semibold">Account Holder</span>, <span className="font-semibold">Sort Code</span> and{" "}
                            <span className="font-semibold">Account Number</span>.
                          </li>
                          <li>
                            <span className="font-semibold text-[#374151]">International Remittance (Outside the UK):</span> Use the{" "}
                            <span className="font-semibold">Account Holder</span>, <span className="font-semibold">Account Number</span>,{" "}
                            <span className="font-semibold">IBAN</span>, <span className="font-semibold">SWIFT/BIC</span> and{" "}
                            <span className="font-semibold">Bank Name</span>.
                          </li>
                        </ul>
                      </div>

                      <div>
                        <label className="block text-[13px] font-semibold text-[#1A1D20] mb-2">
                          Payment screenshot <span className="text-red-500">*</span>{" "}
                          <span className="font-normal text-[#6B7280]">(up to {MAX_PROOFS} · JPG, PNG, WebP)</span>
                        </label>
                        <div className="flex flex-wrap gap-3">
                          {btProofs.map((src, i) => (
                            <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={src} alt={`Payment proof ${i + 1}`} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setBtProofs((prev) => prev.filter((_, idx) => idx !== i))}
                                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                                aria-label="Remove image"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          {btProofs.length < MAX_PROOFS && (
                            <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-[#FF561E] text-[#6B7280] hover:text-[#FF561E] transition-colors">
                              <Plus className="w-5 h-5" />
                              <span className="text-[10px] font-semibold">Add</span>
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                  onPickFiles(e.target.files);
                                  e.target.value = "";
                                }}
                              />
                            </label>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          value={btTxnRef}
                          onChange={(e) => setBtTxnRef(e.target.value)}
                          placeholder="Transaction / reference no. (optional)"
                          className="w-full px-3 py-2.5 rounded-xl bg-white border border-gray-200 outline-none focus:border-[#FF561E] focus:ring-2 focus:ring-[#FF561E]/10 text-[13.5px] transition-all"
                        />
                        <input
                          value={btAmountPaid}
                          onChange={(e) => setBtAmountPaid(e.target.value)}
                          placeholder="Amount paid (optional)"
                          className="w-full px-3 py-2.5 rounded-xl bg-white border border-gray-200 outline-none focus:border-[#FF561E] focus:ring-2 focus:ring-[#FF561E]/10 text-[13.5px] transition-all"
                        />
                        <input
                          value={btSender}
                          onChange={(e) => setBtSender(e.target.value)}
                          placeholder="Sender name (optional)"
                          className="w-full px-3 py-2.5 rounded-xl bg-white border border-gray-200 outline-none focus:border-[#FF561E] focus:ring-2 focus:ring-[#FF561E]/10 text-[13.5px] transition-all"
                        />
                        <input
                          type="date"
                          value={btDate}
                          onChange={(e) => setBtDate(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl bg-white border border-gray-200 outline-none focus:border-[#FF561E] focus:ring-2 focus:ring-[#FF561E]/10 text-[13.5px] text-[#6B7280] transition-all"
                        />
                      </div>
                      <textarea
                        value={btNote}
                        onChange={(e) => setBtNote(e.target.value)}
                        placeholder="Note to our team (optional)"
                        rows={2}
                        className="w-full px-3 py-2.5 rounded-xl bg-white border border-gray-200 outline-none focus:border-[#FF561E] focus:ring-2 focus:ring-[#FF561E]/10 text-[13.5px] transition-all resize-none"
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("wallet")}
                    className={`w-full flex items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                      paymentMethod === "wallet" ? "border-[#FF561E] bg-[#FFF4F0]/50 ring-1 ring-[#FF561E]/30" : "border-gray-200 hover:border-orange-200"
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentMethod === "wallet" ? "border-[#FF561E]" : "border-gray-300"}`}>
                      {paymentMethod === "wallet" && <span className="w-2.5 h-2.5 rounded-full bg-[#FF561E]" />}
                    </span>
                    <div className="w-9 h-9 rounded-lg bg-[#FFF4F0] flex items-center justify-center shrink-0">
                      <Wallet className="w-5 h-5 text-[#FF561E]" strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold text-[#1A1D20]">eSIM4U Wallet</p>
                      <p className="text-[12.5px] text-[#6B7280] mt-0.5">
                        Balance: {walletBalanceUsd === null ? "…" : format(walletBalanceUsd)}
                      </p>
                    </div>
                    {walletBalanceUsd !== null && !walletCovers && (
                      <Link
                        href="/dashboard/topup"
                        onClick={(e) => e.stopPropagation()}
                        className="px-2.5 py-1 rounded-full bg-[#FF561E]/10 text-[#FF561E] text-[10px] font-bold shrink-0 hover:bg-[#FF561E]/20"
                      >
                        Top up
                      </Link>
                    )}
                  </button>

                  {paymentMethod === "wallet" && walletBalanceUsd !== null && !walletCovers && (
                    <p className="text-[12px] text-red-500 font-medium pl-1">
                      Your balance is short by {format(finalTotal - walletBalanceUsd)}. Top up to pay with your wallet.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 sticky top-24">
                <h3 className="text-[16px] font-bold text-[#1A1D20] mb-4">Summary</h3>
                <div className="flex items-center justify-between text-[14px] mb-2">
                  <span className="text-[#6B7280]">Items</span>
                  <span className="font-semibold text-[#1A1D20]">{items.length}</span>
                </div>
                <div className="flex items-center justify-between text-[14px] mb-2">
                  <span className="text-[#6B7280]">Subtotal</span>
                  <span className="font-semibold text-[#1A1D20]">{format(subtotal)}</span>
                </div>
                {discountUsd > 0 && (
                  <div className="flex items-center justify-between text-[14px] mb-2">
                    <span className="text-emerald-600">Discount</span>
                    <span className="font-semibold text-emerald-600">-{format(discountUsd)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 mb-5">
                  <span className="text-[15px] font-bold text-[#1A1D20]">Total</span>
                  <span className="text-[20px] font-bold text-[#FF561E]">{format(finalTotal)}</span>
                </div>

                <button
                  onClick={placeOrder}
                  disabled={
                    placing ||
                    (paymentMethod === "wallet" && !walletCovers) ||
                    (paymentMethod === "bank" && btProofs.length === 0)
                  }
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#FF561E] text-white text-[14px] font-bold hover:bg-[#E04B18] transition-colors shadow-sm shadow-orange-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {placing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />{" "}
                      {paymentMethod === "wallet" ? "Processing..." : paymentMethod === "bank" ? "Submitting..." : "Redirecting..."}
                    </>
                  ) : paymentMethod === "wallet" ? (
                    <>
                      Pay {format(finalTotal)} with Wallet <Wallet className="w-4 h-4" />
                    </>
                  ) : paymentMethod === "bank" ? (
                    <>
                      Submit for Verification <Landmark className="w-4 h-4" />
                    </>
                  ) : paymentMethod === "paypal" ? (
                    <>
                      Continue to PayPal <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Continue to Payment <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                {paymentMethod === "bank" && btProofs.length === 0 && (
                  <p className="text-[11.5px] text-[#6B7280] text-center mt-2">Upload a payment screenshot to submit.</p>
                )}

                <div className="flex items-center justify-center gap-2 mt-4 text-[12px] text-[#6B7280]">
                  <Lock className="w-3.5 h-3.5 text-emerald-500" />
                  Payments are encrypted and secure.
                </div>
                <Link href="/dashboard/cart" className="flex items-center justify-center gap-1.5 text-[13px] text-[#6B7280] font-medium mt-4 hover:text-[#FF561E]">
                  <ArrowLeft className="w-4 h-4" /> Back to Cart
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
