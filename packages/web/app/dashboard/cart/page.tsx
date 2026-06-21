"use client";

import DashboardTopbar from "@/components/dashboard/topbar";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShoppingCart, Loader2, ArrowRight } from "lucide-react";
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
            <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-[15px] text-[#6B7280] font-medium mb-3">Your cart is empty</p>
            <Link href="/dashboard/browse" className="text-[13px] text-[#FF561E] font-semibold">
              Browse eSIM Plans
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              {items.map((item) => (
                <CartItem key={item.id} item={item} removing={removingId === item.id} onRemove={handleRemove} />
              ))}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 sticky top-24">
                <h3 className="text-[16px] font-bold text-[#1A1D20] mb-4">Order Summary</h3>
                <div className="space-y-2 mb-4">
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
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
