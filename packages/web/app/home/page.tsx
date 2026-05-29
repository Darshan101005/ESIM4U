"use client";

import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { useEffect, useState } from "react";

export default function HomePage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-10 h-10 border-4 border-[#FF561E] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!session) return null;

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <div className="h-screen w-full bg-gray-50 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-[#FF561E]/[0.03]" />
      <div className="absolute bottom-[-15%] left-[-8%] w-[500px] h-[500px] rounded-full bg-[#FF561E]/[0.02]" />
      <div
        className={`flex flex-col items-center gap-6 transition-all duration-700 ease-out ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        <div className="w-16 h-16 rounded-2xl bg-[#FF561E] flex items-center justify-center shadow-lg shadow-orange-500/20">
          <span className="text-white text-2xl font-bold">e</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-[#1A1D20] tracking-tight">
          Welcome, {session.user.name}!
        </h1>
        <p className="text-[#6B7280] text-[15px] font-medium">
          You are successfully logged in.
        </p>
        <button
          onClick={handleSignOut}
          className="px-8 py-3 rounded-xl bg-[#FF561E] text-white font-bold text-[15px] hover:shadow-lg hover:shadow-orange-500/25 transition-all duration-300 active:scale-[0.98]"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
