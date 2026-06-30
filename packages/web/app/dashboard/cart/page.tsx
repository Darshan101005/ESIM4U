"use client";

import DashboardTopbar from "@/components/dashboard/topbar";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShoppingCart, Loader2, ArrowRight, Plus, Tag, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import CartItem from "@/components/dashboard/cart-item";
import { useCurrency } from "@/lib/currency-context";
import { useCart } from "@/lib/cart-context";

export default function CartPage() {
  const router = useRouter();
  const { items, loading, removeItem } = useCart();
  const [removingId, setRemovingId] = useState<number | null>(null);
  const { format } = useCurrency();

  const handleRemove = async (id: number) => {
    setRemovingId(id);
    const ok = await removeItem(id);
    if (!ok) toast.error("Failed to remove item");
    setRemovingId(null);
  };

  const total = items.reduce((sum, i) => sum + parseFloat(i.price || "0"), 0);

  return (
    <>
      <DashboardTopbar title="Cart" />
      <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#FF561E] animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <div className="w-16 h-16 rounded-2xl bg-[#FFF4F0] flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-8 h-8 text-[#FF561E]" strokeWidth={1.5} />
            </div>
            <p className="text-[16px] font-bold text-[#1A1D20] mb-1">Your cart is empty</p>
            <p className="text-[13px] text-[#6B7280] mb-5">Browse plans for 200+ destinations and get connected instantly.</p>
            <Link
              href="/dashboard/browse"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF561E] text-white text-[14px] font-bold hover:bg-[#E04B18] transition-colors"
            >
              Browse eSIM Plans <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-[18px] font-bold text-[#1A1D20]">
                Your Cart <span className="text-[14px] font-medium text-[#6B7280]">({items.length} item{items.length !== 1 ? "s" : ""})</span>
              </h2>

              <div className="space-y-3">
                {items.map((item) => (
                  <CartItem key={item.id} item={item} removing={removingId === item.id} onRemove={handleRemove} />
                ))}
              </div>

              <Link
                href="/dashboard/browse"
                className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl border border-dashed border-[#FF561E]/40 text-[13px] font-semibold text-[#FF561E] hover:bg-[#FFF4F0]/50 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add More
              </Link>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 sticky top-24">
                <h3 className="text-[16px] font-bold text-[#1A1D20] mb-4">Order Summary</h3>
                <div className="space-y-2.5 mb-4">
                  <div className="flex items-center justify-between text-[14px]">
                    <span className="text-[#6B7280]">Items</span>
                    <span className="font-semibold text-[#1A1D20]">{items.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-[14px]">
                    <span className="text-[#6B7280]">Subtotal</span>
                    <span className="font-semibold text-[#1A1D20]">{format(total)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 mb-5">
                  <span className="text-[15px] font-bold text-[#1A1D20]">Total</span>
                  <span className="text-[20px] font-bold text-[#FF561E]">{format(total)}</span>
                </div>
                <button
                  onClick={() => router.push("/dashboard/checkout")}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#FF561E] text-white text-[14px] font-bold hover:bg-[#E04B18] transition-colors shadow-sm shadow-orange-500/20"
                >
                  Proceed to Checkout <ArrowRight className="w-4 h-4" />
                </button>

                <div className="flex items-center justify-center gap-2 mt-4 text-[12px] text-[#6B7280]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Secure payment.
                </div>
                <div className="flex items-center justify-center gap-2 mt-2 text-[12px] text-[#6B7280]">
                  <Tag className="w-3.5 h-3.5 text-[#FF561E]" />
                  Have a promo code? Apply it at checkout.
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
