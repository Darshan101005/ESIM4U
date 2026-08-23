"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import DashboardTopbar from "@/components/dashboard/topbar";

export default function TopUpSuccessPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [message, setMessage] = useState("Adding funds to your wallet...");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const sessionId = new URLSearchParams(window.location.search).get("session_id");
    if (!sessionId) {
      router.replace("/dashboard/topup");
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/wallet/topup/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not confirm your top-up");

        toast.success("Wallet topped up successfully.");
        router.replace("/dashboard/topup");
      } catch (e) {
        setStatus("error");
        setMessage(e instanceof Error ? e.message : "Something went wrong");
      }
    })();
  }, [router]);

  return (
    <>
      <DashboardTopbar title="Top Up" />
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
                onClick={() => router.replace("/dashboard/topup")}
                className="mt-5 px-5 py-2.5 rounded-xl bg-[#FF561E] text-white text-[14px] font-bold hover:bg-[#E04B18] transition-colors"
              >
                Back to Wallet
              </button>
            </>
          )}
        </div>
      </main>
    </>
  );
}
