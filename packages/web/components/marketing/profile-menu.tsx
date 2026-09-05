"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, LayoutDashboard, Loader2 } from "lucide-react";
import { signOutAndClear } from "@/lib/auth-client";

interface ProfileMenuProps {
  name?: string | null;
  email?: string | null;
}

/**
 * Landing/header profile control shown when the user is logged in.
 * Renders an avatar; on hover it reveals a dropdown with the user's
 * UPPERCASE name, email, an edit-profile link and a logout action.
 */
export default function ProfileMenu({ name, email }: ProfileMenuProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const displayName = (name || "Account").toUpperCase();
  const initial = (name || email || "?").trim().charAt(0).toUpperCase();

  const logout = async () => {
    setLoggingOut(true);
    try {
      await signOutAndClear();
      router.push("/");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  };

  return (
    <div className="relative group">
      {/* Avatar */}
      <button
        type="button"
        className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF561E] to-[#FF7A45] flex items-center justify-center text-white text-[15px] font-bold shadow-sm ring-2 ring-white/60 hover:ring-[#FF561E]/30 transition-all"
        aria-label="Account menu"
      >
        {initial}
      </button>

      {/* Hover bridge to keep dropdown open while moving the cursor */}
      <div className="absolute right-0 top-full pt-2 w-60 opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-150 z-50">
        <div className="bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.14)] border border-gray-100 overflow-hidden">
          {/* Name + email, two lines */}
          <div className="px-4 py-3.5 border-b border-gray-100">
            <p className="text-[14px] font-bold text-[#1A1D20] truncate">{displayName}</p>
            {email && <p className="text-[12px] text-[#6B7280] truncate mt-0.5">{email}</p>}
          </div>

          <div className="p-1.5">
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13.5px] font-semibold text-[#1A1D20] hover:bg-gray-50 transition-colors"
            >
              <LayoutDashboard className="w-[17px] h-[17px] text-[#FF561E]" />
              Dashboard
            </Link>
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13.5px] font-semibold text-[#1A1D20] hover:bg-gray-50 transition-colors"
            >
              <svg className="w-[17px] h-[17px] text-[#FF561E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Edit profile
            </Link>
          </div>

          <div className="p-1.5 border-t border-gray-100">
            <button
              type="button"
              onClick={logout}
              disabled={loggingOut}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13.5px] font-semibold text-red-500 hover:bg-red-50 transition-colors disabled:opacity-60"
            >
              {loggingOut ? <Loader2 className="w-[17px] h-[17px] animate-spin" /> : <LogOut className="w-[17px] h-[17px]" />}
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
