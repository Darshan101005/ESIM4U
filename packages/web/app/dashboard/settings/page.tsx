"use client";

import DashboardTopbar from "@/components/dashboard/topbar";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, DollarSign, LogOut, ShieldCheck, LifeBuoy, Mail, UserRound, Copy, Check } from "lucide-react";
import toast from "react-hot-toast";
import { signOutAndClear, authClient } from "@/lib/auth-client";
import { useCurrency } from "@/lib/currency-context";
import { SUPPORTED_CURRENCIES } from "@/lib/fx";
import SelectMenu from "@/components/admin/select-menu";
import { Link2 } from "lucide-react";

/** Official Telegram mark. */
function TelegramLogo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="shrink-0" aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill="#229ED9" />
      <path
        fill="#fff"
        d="M5.49 11.78 16.2 7.3c.5-.18.94.12.78.88l-1.82 8.58c-.13.6-.5.75-1 .47l-2.76-2.04-1.33 1.28c-.15.15-.27.27-.55.27l.2-2.83 5.14-4.65c.22-.2-.05-.31-.35-.11l-6.35 4-2.74-.86c-.6-.19-.6-.6.13-.9z"
      />
    </svg>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { currency, setCurrency } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [email, setEmail] = useState("");
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleAccountId, setGoogleAccountId] = useState<string | null>(null);
  const [linkBusy, setLinkBusy] = useState(false);

  // Telegram connect
  const [tg, setTg] = useState<{ enabled: boolean; linked: boolean; username: string | null; botUsername: string | null } | null>(null);
  const [tgCode, setTgCode] = useState("");
  const [tgDeepLink, setTgDeepLink] = useState<string | null>(null);
  const [tgBusy, setTgBusy] = useState(false);
  const [tgCopied, setTgCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error();
      const d = await res.json();
      setEmail(d.user?.email || "");
    } catch {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAccounts = useCallback(async () => {
    try {
      const res = await authClient.listAccounts();
      const list = (res.data || []) as { id: string; providerId: string }[];
      const google = list.find((a) => a.providerId === "google");
      setGoogleConnected(!!google);
      setGoogleAccountId(google?.id ?? null);
    } catch {}
  }, []);

  const loadTelegram = useCallback(async () => {
    try {
      const res = await fetch("/api/telegram/link-code");
      if (!res.ok) return;
      setTg(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    load();
    loadAccounts();
    loadTelegram();
  }, [load, loadAccounts, loadTelegram]);

  const generateTgCode = async () => {
    setTgBusy(true);
    try {
      const res = await fetch("/api/telegram/link-code", { method: "POST" });
      const d = await res.json();
      if (!res.ok) throw new Error();
      setTgCode(d.code);
      setTgDeepLink(d.deepLink || null);
    } catch {
      toast.error("Couldn't generate a code");
    } finally {
      setTgBusy(false);
    }
  };

  const copyTgCode = async () => {
    if (!tgCode) return;
    try {
      await navigator.clipboard.writeText(tgCode);
      setTgCopied(true);
      setTimeout(() => setTgCopied(false), 1800);
    } catch {
      toast.error("Copy failed");
    }
  };

  const disconnectTg = async () => {
    try {
      const res = await fetch("/api/telegram/link-code", { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Telegram disconnected");
      setTgCode("");
      setTgDeepLink(null);
      loadTelegram();
    } catch {
      toast.error("Couldn't disconnect");
    }
  };

  const connectGoogle = async () => {
    setLinkBusy(true);
    try {
      // Redirects to Google, then back to Settings with the account linked.
      await authClient.linkSocial({ provider: "google", callbackURL: "/dashboard/settings" });
    } catch {
      toast.error("Could not connect Google");
      setLinkBusy(false);
    }
  };

  const disconnectGoogle = async () => {
    if (!googleAccountId) {
      toast.error("Google account not found. Try refreshing the page.");
      return;
    }
    setLinkBusy(true);
    try {
      // Better Auth 1.7: unlink selects by the local account row id (from
      // listAccounts), not by providerId.
      const res = await authClient.unlinkAccount({ accountId: googleAccountId });
      if (res.error) throw new Error();
      toast.success("Google disconnected");
      await loadAccounts();
    } catch {
      toast.error("Could not disconnect. Make sure you have a password set so you can still sign in.");
    } finally {
      setLinkBusy(false);
    }
  };

  const signOut = async () => {
    setSigningOut(true);
    await signOutAndClear();
    router.push("/login");
  };

  const labelCls = "block text-[13px] font-medium text-[#6B7280] mb-2";

  return (
    <>
      <DashboardTopbar title="Settings" />
      <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8 max-w-3xl mx-auto w-full">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#FF561E] animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Personal details live on the Profile page */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
              <div className="flex items-center gap-2 mb-2">
                <UserRound className="w-5 h-5 text-[#FF561E]" />
                <h3 className="text-[16px] font-bold text-[#1A1D20]">Personal details</h3>
              </div>
              <p className="text-[13px] text-[#6B7280] mb-4">Update your name, mobile number, date of birth and gender on your profile.</p>
              <Link
                href="/dashboard/profile"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-gray-200 text-[14px] font-bold text-[#1A1D20] hover:border-[#FF561E] hover:text-[#FF561E] transition-colors"
              >
                <UserRound className="w-4 h-4" /> Edit profile
              </Link>
            </div>

            {/* Billing / currency — applies instantly across the site */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
              <div className="flex items-center gap-2 mb-5">
                <DollarSign className="w-5 h-5 text-[#FF561E]" />
                <h3 className="text-[16px] font-bold text-[#1A1D20]">Billing Preferences</h3>
              </div>
              <label className={labelCls}>Display Currency</label>
              <div className="max-w-xs">
                <SelectMenu
                  value={currency}
                  onChange={(v) => {
                    setCurrency(v as (typeof SUPPORTED_CURRENCIES)[number]);
                    toast.success("Currency updated");
                  }}
                  options={SUPPORTED_CURRENCIES.map((c) => ({ value: c, label: c }))}
                />
              </div>
              <p className="text-[12px] text-[#6B7280] mt-2">Prices across the site load in this currency each time you visit.</p>
            </div>

            {/* Connected accounts */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
              <div className="flex items-center gap-2 mb-5">
                <Link2 className="w-5 h-5 text-[#FF561E]" />
                <h3 className="text-[16px] font-bold text-[#1A1D20]">Connected accounts</h3>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <svg width="22" height="22" viewBox="0 0 24 24" className="shrink-0">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-[#1A1D20]">Google</p>
                    <p className="text-[12px] text-[#6B7280]">{googleConnected ? "Connected — sign in with Google" : "Not connected"}</p>
                  </div>
                </div>
                {googleConnected ? (
                  <button
                    onClick={disconnectGoogle}
                    disabled={linkBusy}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-[13px] font-bold text-[#6B7280] hover:text-red-500 hover:border-red-200 transition-colors disabled:opacity-60 shrink-0"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={connectGoogle}
                    disabled={linkBusy}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FF561E] text-white text-[13px] font-bold hover:bg-[#E04B18] transition-colors disabled:opacity-60 shrink-0"
                  >
                    Connect
                  </button>
                )}
              </div>
              {googleConnected && (
                <p className="text-[11.5px] text-[#6B7280] mt-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Your Google account is linked to {email}.
                </p>
              )}

              {/* Telegram */}
              {tg?.enabled && (
                <div className="mt-3">
                  <div className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <TelegramLogo />
                      <div className="min-w-0">
                        <p className="text-[14px] font-semibold text-[#1A1D20]">Telegram</p>
                        <p className="text-[12px] text-[#6B7280] truncate">
                          {tg.linked ? (tg.username ? `Connected — @${tg.username}` : "Connected") : "Not connected"}
                        </p>
                      </div>
                    </div>
                    {tg.linked ? (
                      <button
                        onClick={disconnectTg}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-[13px] font-bold text-[#6B7280] hover:text-red-500 hover:border-red-200 transition-colors shrink-0"
                      >
                        Disconnect
                      </button>
                    ) : (
                      <button
                        onClick={generateTgCode}
                        disabled={tgBusy}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#229ED9] text-white text-[13px] font-bold hover:bg-[#1c8ec2] transition-colors disabled:opacity-60 shrink-0"
                      >
                        {tgBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Connect"}
                      </button>
                    )}
                  </div>

                  {/* Generated one-time code */}
                  {!tg.linked && tgCode && (
                    <div className="mt-3 rounded-xl border border-[#229ED9]/20 bg-[#229ED9]/5 p-4">
                      <p className="text-[12px] text-[#6B7280] mb-2">Your one-time link code (valid 15 minutes):</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 px-4 py-3 rounded-xl bg-white border border-gray-200 font-mono text-[22px] font-bold tracking-[0.3em] text-[#1A1D20] text-center">
                          {tgCode}
                        </div>
                        <button
                          onClick={copyTgCode}
                          className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-[#FF561E] text-white text-[13px] font-bold hover:bg-[#E04B18] transition-colors shrink-0"
                        >
                          {tgCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          {tgCopied ? "Copied" : "Copy"}
                        </button>
                      </div>
                      <p className="text-[12.5px] text-[#6B7280] mt-3 leading-relaxed">
                        In the bot, send <code className="px-1.5 py-0.5 rounded bg-white border border-gray-200 font-mono text-[#1A1D20]">/link {tgCode}</code>
                        {tgDeepLink ? (
                          <>
                            {" "}or{" "}
                            <a href={tgDeepLink} target="_blank" rel="noopener noreferrer" className="text-[#229ED9] font-semibold underline">
                              tap here to open Telegram
                            </a>
                            .
                          </>
                        ) : (
                          "."
                        )}
                      </p>
                      <button onClick={generateTgCode} disabled={tgBusy} className="text-[12.5px] font-semibold text-[#FF561E] hover:underline mt-2 disabled:opacity-60">
                        {tgBusy ? "Generating…" : "Generate a new code"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Account & security */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
              <div className="flex items-center gap-2 mb-5">
                <ShieldCheck className="w-5 h-5 text-[#FF561E]" />
                <h3 className="text-[16px] font-bold text-[#1A1D20]">Account &amp; Security</h3>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <Mail className="w-4 h-4 text-[#6B7280] shrink-0" />
                  <span className="text-[14px] font-medium text-[#1A1D20] truncate">{email}</span>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-semibold shrink-0">Verified</span>
              </div>
              <button
                onClick={signOut}
                disabled={signingOut}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-red-50 text-red-500 border border-red-100 text-[14px] font-bold hover:bg-red-100 transition-colors disabled:opacity-70"
              >
                {signingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                Sign Out
              </button>
            </div>

            {/* Help */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
              <div className="flex items-center gap-2 mb-4">
                <LifeBuoy className="w-5 h-5 text-[#FF561E]" />
                <h3 className="text-[16px] font-bold text-[#1A1D20]">Help &amp; Support</h3>
              </div>
              <p className="text-[14px] text-[#6B7280] mb-3">Need help with your eSIM or an order? Reach our support team.</p>
              <a href="mailto:support@esim4u.uk" className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#FF561E] hover:text-[#E04B18] transition-colors">
                <Mail className="w-4 h-4" /> support@esim4u.uk
              </a>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
