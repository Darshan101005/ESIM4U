"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="h-screen w-full flex items-center justify-center bg-gray-50">
      <div className="animate-spin w-10 h-10 border-4 border-[#FF561E] border-t-transparent rounded-full" />
    </div>
  );
}
