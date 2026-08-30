"use client";

import AdminTopbar from "@/components/admin/admin-topbar";
import { useEffect, useState, useCallback } from "react";
import { Loader2, User, Mail, Lock, Eye, EyeOff, Pencil, X } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);

  // Name
  const [name, setName] = useState("");
  const [savedName, setSavedName] = useState("");
  const [savingName, setSavingName] = useState(false);

  // Email
  const [email, setEmail] = useState("");
  const [savedEmail, setSavedEmail] = useState("");
  const [editingEmail, setEditingEmail] = useState(false);
  const [pwPrompt, setPwPrompt] = useState(false);
  const [emailPassword, setEmailPassword] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  // Password
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/me", { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setName(data.name || "");
      setSavedName(data.name || "");
      setEmail(data.email || "");
      setSavedEmail(data.email || "");
    } catch {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveName = async () => {
    const trimmed = name.trim();
    if (!trimmed) return toast.error("Name is required");
    setSavingName(true);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateName", name: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update name");
      setSavedName(trimmed);
      toast.success("Name updated");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update name");
    } finally {
      setSavingName(false);
    }
  };

  const openEmailPrompt = () => {
    const trimmed = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) return toast.error("Enter a valid email address");
    if (trimmed === savedEmail) return toast.error("This is already your email");
    setEmailPassword("");
    setPwPrompt(true);
  };

  const confirmEmail = async () => {
    if (!emailPassword) return toast.error("Enter your current password");
    setSavingEmail(true);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateEmail", email: email.trim().toLowerCase(), currentPassword: emailPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update email");
      setSavedEmail(email.trim().toLowerCase());
      setPwPrompt(false);
      setEditingEmail(false);
      setEmailPassword("");
      toast.success("Email updated");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update email");
    } finally {
      setSavingEmail(false);
    }
  };

  const cancelEmailEdit = () => {
    setEmail(savedEmail);
    setEditingEmail(false);
    setPwPrompt(false);
    setEmailPassword("");
  };

  const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  const savePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) return toast.error("All password fields are required");
    if (newPassword.length < 8) return toast.error("New password must be at least 8 characters");
    if (newPassword !== confirmPassword) return toast.error("Passwords not matching");
    setSavingPw(true);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "changePassword", oldPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change password");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setSavingPw(false);
    }
  };

  const inputCls =
    "w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 outline-none focus:border-[#FF561E] focus:ring-2 focus:ring-[#FF561E]/10 text-[14px] transition-all";
  const labelCls = "block text-[12px] font-semibold text-[#6B7280] mb-1.5";
  const btnCls =
    "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF561E] text-white text-[13px] font-bold hover:bg-[#E04B18] transition-colors shadow-sm shadow-orange-500/25 disabled:opacity-70";

  return (
    <>
      <AdminTopbar title="Settings" />
      <main className="flex-1 px-6 lg:px-8 py-6 lg:py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#FF561E] animate-spin" />
          </div>
        ) : (
          <div className="max-w-2xl mx-auto w-full space-y-6">
            {/* Name */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-8 h-8 rounded-lg bg-[#FFF4F0] flex items-center justify-center">
                  <User className="w-4 h-4 text-[#FF561E]" strokeWidth={2.4} />
                </span>
                <h2 className="text-[15px] font-bold text-[#1A1D20]">Profile Name</h2>
              </div>
              <label className={labelCls}>Name</label>
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              <div className="mt-4">
                <button onClick={saveName} disabled={savingName || !name.trim()} className={btnCls}>
                  {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Name"}
                </button>
              </div>
            </section>

            {/* Email */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-8 h-8 rounded-lg bg-[#FFF4F0] flex items-center justify-center">
                  <Mail className="w-4 h-4 text-[#FF561E]" strokeWidth={2.4} />
                </span>
                <h2 className="text-[15px] font-bold text-[#1A1D20]">Email Address</h2>
              </div>

              {!editingEmail ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 px-4 py-3">
                  <span className="text-[14px] text-[#1A1D20] font-medium truncate">{savedEmail}</span>
                  <button
                    onClick={() => setEditingEmail(true)}
                    title="Edit email"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFF4F0] text-[#FF561E] text-[12px] font-bold hover:bg-[#FFE7DC] transition-colors shrink-0"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                </div>
              ) : (
                <>
                  <label className={labelCls}>New email</label>
                  <input
                    className={inputCls}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@esim4u.uk"
                    autoFocus
                  />
                  <div className="mt-4 flex items-center gap-2">
                    <button onClick={openEmailPrompt} className={btnCls}>
                      Update Email
                    </button>
                    <button
                      onClick={cancelEmailEdit}
                      className="px-4 py-2.5 rounded-xl border border-gray-200 text-[13px] font-semibold text-[#6B7280] hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </section>

            {/* Password */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-8 h-8 rounded-lg bg-[#FFF4F0] flex items-center justify-center">
                  <Lock className="w-4 h-4 text-[#FF561E]" strokeWidth={2.4} />
                </span>
                <h2 className="text-[15px] font-bold text-[#1A1D20]">Change Password</h2>
              </div>

              <label className={labelCls}>Current password</label>
              <div className="relative">
                <input
                  className={`${inputCls} pr-11`}
                  type={showOld ? "text" : "password"}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter current password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowOld((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#FF561E]"
                >
                  {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <label className={`${labelCls} mt-4`}>New password</label>
              <div className="relative">
                <input
                  className={`${inputCls} pr-11`}
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#FF561E]"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <label className={`${labelCls} mt-4`}>Confirm new password</label>
              <input
                className={inputCls}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                autoComplete="new-password"
              />
              {passwordsMismatch && <p className="text-[12px] text-red-500 font-medium mt-1.5">Passwords not matching</p>}

              <div className="mt-4">
                <button onClick={savePassword} disabled={savingPw || passwordsMismatch} className={btnCls}>
                  {savingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : "Change Password"}
                </button>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Password prompt for email change */}
      {pwPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => !savingEmail && setPwPrompt(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <button
              onClick={() => !savingEmail && setPwPrompt(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4 text-[#1A1D20]" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-[#FFF4F0] flex items-center justify-center mb-3">
              <Lock className="w-5 h-5 text-[#FF561E]" strokeWidth={2.2} />
            </div>
            <h3 className="text-[16px] font-bold text-[#1A1D20] mb-1">Confirm it&apos;s you</h3>
            <p className="text-[13px] text-[#6B7280] mb-4">Enter your current password to change your email to <span className="font-semibold text-[#1A1D20]">{email.trim().toLowerCase()}</span>.</p>
            <input
              className={inputCls}
              type="password"
              value={emailPassword}
              onChange={(e) => setEmailPassword(e.target.value)}
              placeholder="Current password"
              autoComplete="current-password"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && confirmEmail()}
            />
            <div className="mt-4 flex items-center gap-2">
              <button onClick={confirmEmail} disabled={savingEmail} className={`${btnCls} flex-1`}>
                {savingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm & Update"}
              </button>
              <button
                onClick={() => !savingEmail && setPwPrompt(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-[13px] font-semibold text-[#6B7280] hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
