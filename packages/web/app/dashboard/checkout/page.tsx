"use client";

import DashboardTopbar from "@/components/dashboard/topbar";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Loader2, Lock, ArrowRight, ArrowLeft, Tag, X, Wallet, Wifi, Clock, RadioTower } from "lucide-react";
import toast from "react-hot-toast";
import Flag from "@/components/dashboard/flag";
import { useCurrency } from "@/lib/currency-context";
import { useCart } from "@/lib/cart-context";

function Pill({ icon: Icon, children }: { icon: typeof Wifi; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-100 text-[11.5px] font-semibold text-[#374151]">
      <Icon className="w-3.5 h-3.5 text-[#FF561E]" strokeWidth={2} />
      {children}
    </span>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { currency, format } = useCurrency();
  const { items, loading } = useCart();
  const [placing, setPlacing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "wallet">("stripe");

  const [codeInput, setCodeInput] = useState("");
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [discountUsd, setDiscountUsd] = useState(0);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    if (!loading && items.length === 0) router.replace("/dashboard/cart");
  }, [loading, items, router]);

  const subtotal = items.reduce((sum, i) => sum + parseFloat(i.price || "0"), 0);
  const finalTotal = Math.max(0, Math.round((subtotal - discountUsd) * 100) / 100);

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

  const placeOrder = async () => {
    if (paymentMethod !== "stripe") return;
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
                      <p className="text-[12.5px] text-[#6B7280] mt-2">Pay by card, Google Pay, Apple Pay, PayPal and more.</p>
                    </div>
                  </button>

                  <div className="w-full flex items-center gap-4 rounded-xl border border-gray-200 p-4 opacity-70">
                    <span className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0" />
                    <div className="w-9 h-9 rounded-lg bg-[#FFF4F0] flex items-center justify-center shrink-0">
                      <Wallet className="w-5 h-5 text-[#FF561E]" strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold text-[#1A1D20]">eSIM4U Wallet</p>
                      <p className="text-[12.5px] text-[#6B7280] mt-0.5">Balance: {format(0)}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-gray-100 text-[#6B7280] text-[10px] font-bold shrink-0">Coming soon</span>
                  </div>
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
                  disabled={placing}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#FF561E] text-white text-[14px] font-bold hover:bg-[#E04B18] transition-colors shadow-sm shadow-orange-500/20 disabled:opacity-70"
                >
                  {placing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Redirecting...
                    </>
                  ) : (
                    <>
                      Continue to Payment <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

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
