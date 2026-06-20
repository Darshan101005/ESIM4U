"use client";

import DashboardTopbar from "@/components/dashboard/topbar";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ShieldCheck, CreditCard, Lock, CheckCircle2, Tag, X } from "lucide-react";
import toast from "react-hot-toast";
import { useCurrency } from "@/lib/currency-context";

interface CartItemData {
  id: number;
  bundle_code: string;
  bundle_name?: string;
  country?: string;
  country_code?: string;
  data_amount?: string;
  validity?: string;
  price: string;
  cost_price?: string;
  currency: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { currency, format } = useCurrency();
  const [items, setItems] = useState<CartItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  const [codeInput, setCodeInput] = useState("");
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [discountUsd, setDiscountUsd] = useState(0);
  const [validating, setValidating] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/cart");
      if (!res.ok) throw new Error();
      const data = await res.json();
      const cartItems = data.items || [];
      setItems(cartItems);
      if (cartItems.length === 0) router.replace("/dashboard/cart");
    } catch {
      toast.error("Failed to load checkout");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

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
    setPlacing(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: appliedCode || undefined,
          display_currency: currency,
          items: items.map((i) => ({
            bundle_code: i.bundle_code,
            bundle_name: i.bundle_name,
            country: i.country,
            country_code: i.country_code,
            data_amount: i.data_amount,
            validity: i.validity,
            price: parseFloat(i.price),
            cost_price: i.cost_price ? parseFloat(i.cost_price) : null,
            currency: "USD",
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");

      const orders = data.orders || [];
      const firstSuccess = orders.find((o: { id?: number; status?: string }) => o.id && o.status === "completed");
      const anyFailed = orders.some((o: { status?: string }) => o.status === "failed");

      if (firstSuccess) {
        toast.success("eSIM ready");
        router.push(`/dashboard/orders/${firstSuccess.id}`);
      } else if (anyFailed) {
        toast.error("Order could not be completed");
        router.push("/dashboard/orders");
      } else {
        router.push("/dashboard/orders");
      }
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
                <h3 className="text-[16px] font-bold text-[#1A1D20] mb-4">Review Order</h3>
                <div className="divide-y divide-gray-50">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-[14px] font-semibold text-[#1A1D20]">{item.bundle_name || item.country}</p>
                        <p className="text-[12px] text-[#6B7280]">
                          {item.data_amount}
                          {item.validity ? ` · ${item.validity}` : ""}
                        </p>
                      </div>
                      <span className="text-[14px] font-bold text-[#1A1D20]">{format(parseFloat(item.price))}</span>
                    </div>
                  ))}
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
                  <h3 className="text-[16px] font-bold text-[#1A1D20]">Payment</h3>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-[#6B7280] text-[11px] font-semibold">
                    <Lock className="w-3 h-3" /> Coming soon
                  </span>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-dashed border-gray-200 bg-gray-50/60 px-4 py-4">
                  <CreditCard className="w-5 h-5 text-gray-400" />
                  <p className="text-[13px] text-[#6B7280]">
                    Card payment will be enabled here soon. Your eSIM is issued instantly on order confirmation.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 sticky top-24">
                <h3 className="text-[16px] font-bold text-[#1A1D20] mb-4">Summary</h3>
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
                      <Loader2 className="w-4 h-4 animate-spin" /> Issuing eSIM...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Complete Order
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2 mt-4 text-[12px] text-[#6B7280]">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Instant eSIM delivery with QR code
                </div>
                {currency !== "USD" && (
                  <p className="text-[11px] text-[#6B7280] mt-2">
                    Prices shown in {currency} at today&apos;s rate. Billed amount is based on USD pricing.
                  </p>
                )}
                <Link href="/dashboard/cart" className="block text-center text-[13px] text-[#6B7280] font-medium mt-4 hover:text-[#FF561E]">
                  Back to Cart
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
