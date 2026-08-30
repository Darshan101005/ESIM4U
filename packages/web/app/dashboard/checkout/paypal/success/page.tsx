"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import DashboardTopbar from "@/components/dashboard/topbar";
import { useCart } from "@/lib/cart-context";

export default function PaypalSuccessPage() {
  const router = useRouter();
  const { clearCart } = useCart();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [message, setMessage] = useState("Confirming your PayPal payment...");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    // PayPal returns the order id as the `token` query param.
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("token");
    if (!orderId) {
      router.replace("/dashboard/checkout");
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/payments/paypal/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_id: orderId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not confirm your payment");

        clearCart();
        const orders: { id?: number; status?: string }[] = data.orders || [];
        const firstSuccess = orders.find((o) => o.id && o.status === "completed");
        if (firstSuccess) {
          toast.success("Payment successful! Your eSIM is ready.");
          router.replace(`/dashboard/orders/${firstSuccess.id}`);
        } else if (orders.length > 0) {
          toast.error("Payment received, but activation needs attention. Any failed items were refunded.");
          router.replace("/dashboard/orders");
        } else {
          router.replace("/dashboard/orders");
        }
      } catch (e) {
        setStatus("error");
        setMessage(e instanceof Error ? e.message : "Something went wrong");
      }
    })();
  }, [router, clearCart]);

  return (
    <>
      <DashboardTopbar title="Payment" />
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="text-center max-w-sm">
          {status === "loading" ? (
            <>
              <Loader2 className="w-10 h-10 text-[#FF561E] animate-spin mx-auto mb-4" />
              <p className="text-[15px] font-semibold text-[#1A1D20]">{message}</p>
              <p className="text-[13px] text-[#6B7280] mt-1">Please keep this window open.</p>
            </>
          ) : (
            <>
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-[15px] font-semibold text-[#1A1D20]">{message}</p>
              <button
                onClick={() => router.replace("/dashboard/orders")}
                className="mt-5 px-5 py-2.5 rounded-xl bg-[#FF561E] text-white text-[14px] font-bold hover:bg-[#E04B18] transition-colors"
              >
                Go to Orders
              </button>
            </>
          )}
        </div>
      </main>
    </>
  );
}
