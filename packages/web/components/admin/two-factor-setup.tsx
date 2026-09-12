"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, ShieldCheck, Smartphone, Copy, Check, KeyRound } from "lucide-react";
import toast from "react-hot-toast";
import ConfirmModal from "@/components/confirm-modal";

/** Slide toggle matching the admin styling. */
function SlideToggle({ on, onClick, disabled }: { on: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative rounded-full transition-colors shrink-0 disabled:opacity-50 ${on ? "bg-[#FF561E]" : "bg-gray-300"}`}
      style={{ height: "26px", width: "48px" }}
      aria-pressed={on}
    >
      <span className={`absolute top-0.5 left-0.5 w-[22px] h-[22px] rounded-full bg-white shadow-sm transition-transform ${on ? "translate-x-[22px]" : ""}`} />
    </button>
  );
}

/**
 * Two-factor authentication control for the signed-in admin's own account.
 * Enabling reveals a QR + seed to scan, then a code to confirm; disabling asks
 * for confirmation. Lives on the profile settings page so every admin (not just
 * super admins) can manage it.
 */
export default function TwoFactorSetup() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [setup, setSetup] = useState<{ secret: string; qrDataUrl: string } | null>(null);
  const [code, setCode] = useState("");
  const [starting, setStarting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDisable, setShowDisable] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/2fa", { cache: "no-store" });
      if (!res.ok) return;
      const d = await res.json();
      setEnabled(Boolean(d.enabled));
    } catch {
      // leave as unknown
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const startSetup = async () => {
    setStarting(true);
    try {
      const res = await fetch("/api/admin/2fa/setup", { method: "POST" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to start setup");
      setSetup({ secret: d.secret, qrDataUrl: d.qrDataUrl });
      setCode("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to start setup");
    } finally {
      setStarting(false);
    }
  };

  const confirmEnable = async () => {
    if (code.length !== 6) {
      toast.error("Enter the 6-digit code");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/2fa/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to enable");
      toast.success("Two-factor authentication enabled");
      setSetup(null);
      setCode("");
      setEnabled(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to enable");
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/2fa/disable", { method: "POST" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to disable");
      toast.success("Two-factor authentication disabled");
      setEnabled(false);
      setShowDisable(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to disable");
    } finally {
      setBusy(false);
    }
  };

  const onToggle = () => {
    if (enabled) setShowDisable(true);
    else if (!setup) startSetup();
  };

  const copySeed = async () => {
    if (!setup) return;
    try {
      await navigator.clipboard.writeText(setup.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy");
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-2 min-w-0">
          <span className="w-8 h-8 rounded-lg bg-[#FFF4F0] flex items-center justify-center shrink-0">
            <KeyRound className="w-4 h-4 text-[#FF561E]" strokeWidth={2.4} />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-[15px] font-bold text-[#1A1D20]">Two-Factor Authentication</h2>
              {enabled !== null && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    enabled ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-[#6B7280]"
                  }`}
                >
                  {enabled ? "On" : "Off"}
                </span>
              )}
            </div>
            <p className="text-[13px] text-[#6B7280] mt-0.5">
              Add a one-time code from an authenticator app, required after your password at sign-in.
            </p>
          </div>
        </div>
        {enabled === null ? (
          <Loader2 className="w-5 h-5 text-[#FF561E] animate-spin shrink-0 mt-1" />
        ) : (
          <SlideToggle on={enabled} onClick={onToggle} disabled={starting || busy} />
        )}
      </div>

      {/* Setup panel (while enabling) */}
      {setup && !enabled && (
        <div className="mt-5 rounded-xl border border-gray-100 bg-[#FAFAFA] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Smartphone className="w-4 h-4 text-[#FF561E]" />
            <p className="text-[13.5px] font-bold text-[#1A1D20]">Scan to add eSIM4U Admin</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-5">
            <div className="rounded-xl bg-white border border-gray-200 p-3 shrink-0 self-start">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={setup.qrDataUrl} alt="2FA QR code" className="w-40 h-40 block" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] text-[#6B7280] mb-2">
                Open Google Authenticator, Authy or 1Password, scan the QR, or enter this setup key manually:
              </p>
              <div className="flex items-center gap-2 mb-4">
                <code className="flex-1 min-w-0 break-all rounded-lg bg-white border border-gray-200 px-3 py-2 text-[12.5px] font-mono text-[#1A1D20]">
                  {setup.secret}
                </code>
                <button
                  onClick={copySeed}
                  title="Copy key"
                  className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-[#6B7280] hover:text-[#FF561E] hover:border-orange-200 transition-colors shrink-0"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <label className="block text-[12px] font-semibold text-[#6B7280] mb-1.5">Enter the 6-digit code to confirm</label>
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyDown={(e) => e.key === "Enter" && confirmEnable()}
                  placeholder="000000"
                  className="w-40 px-3 py-2.5 rounded-xl bg-white border border-gray-200 outline-none focus:border-[#FF561E] focus:ring-2 focus:ring-[#FF561E]/10 text-[15px] font-mono tracking-[0.3em] transition-all"
                />
                <button
                  onClick={confirmEnable}
                  disabled={busy || code.length !== 6}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF561E] text-white text-[13px] font-bold hover:bg-[#E04B18] transition-colors disabled:opacity-60"
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />} Enable
                </button>
                <button
                  onClick={() => {
                    setSetup(null);
                    setCode("");
                  }}
                  disabled={busy}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-[13px] font-semibold text-[#6B7280] hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={showDisable}
        title="Turn off two-factor authentication?"
        message="Your account will be protected by password only. You can turn 2FA back on any time, but you'll need to scan a new QR code."
        confirmLabel="Turn off 2FA"
        loading={busy}
        onConfirm={disable}
        onCancel={() => setShowDisable(false)}
      />
    </section>
  );
}
