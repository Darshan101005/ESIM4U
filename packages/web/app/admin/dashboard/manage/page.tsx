"use client";

import AdminTopbar from "@/components/admin/admin-topbar";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Pencil, Trash2, Pause, Play, ShieldCheck, UserCog, X, Search, Eye, EyeOff } from "lucide-react";
import ConfirmModal from "@/components/confirm-modal";
import toast from "react-hot-toast";

interface TgAdmin {
  username: string;
  name: string | null;
  created_at: string;
}

/** Official Telegram mark. */
function TelegramLogo({ size = 20 }: { size?: number }) {
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

function TelegramAdminsSection() {
  const [list, setList] = useState<TgAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/telegram-admins", { cache: "no-store" });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setList(d.admins || []);
    } catch {
      // stays empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    const u = username.trim().replace(/^@+/, "");
    if (!u) {
      toast.error("Enter a Telegram username");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch("/api/admin/telegram-admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, name: name.trim() || null }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed");
      toast.success("Telegram admin added");
      setUsername("");
      setName("");
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add");
    } finally {
      setAdding(false);
    }
  };

  const remove = async (u: string) => {
    setBusy(u);
    try {
      const res = await fetch("/api/admin/telegram-admins", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u }),
      });
      if (!res.ok) throw new Error();
      toast.success("Removed");
      await load();
    } catch {
      toast.error("Failed to remove");
    } finally {
      setBusy(null);
    }
  };

  const inputCls =
    "w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 outline-none focus:border-[#FF561E] focus:ring-2 focus:ring-[#FF561E]/10 text-[14px] transition-all";

  return (
    <section className="mt-8 bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
      <div className="flex items-center gap-2 mb-1">
        <TelegramLogo />
        <h2 className="text-[16px] font-bold text-[#1A1D20]">Telegram Admin Management</h2>
      </div>
      <p className="text-[13px] text-[#6B7280] mb-5">
        Add a Telegram <span className="font-semibold">@username</span> here to let that person sign in to the admin bridge
        from the bot.
      </p>

      <div className="flex flex-col sm:flex-row gap-2 mb-5">
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280] text-[14px] font-medium">@</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="telegram_username"
            className={`${inputCls} pl-8`}
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name (optional)"
          className={`${inputCls} sm:max-w-[200px]`}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <button
          onClick={add}
          disabled={adding}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF561E] text-white text-[13px] font-bold hover:bg-[#E04B18] transition-colors shadow-sm shadow-orange-500/25 disabled:opacity-70 shrink-0"
        >
          {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-[#6B7280] text-[14px]">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      ) : list.length === 0 ? (
        <p className="text-[13px] text-[#6B7280]">No Telegram admins yet.</p>
      ) : (
        <div className="space-y-2">
          {list.map((t) => (
            <div key={t.username} className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-[#EAF6FC] flex items-center justify-center shrink-0">
                  <TelegramLogo size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-[#1A1D20] truncate">@{t.username}</p>
                  {t.name && <p className="text-[12px] text-[#6B7280] truncate">{t.name}</p>}
                </div>
              </div>
              <button
                onClick={() => remove(t.username)}
                disabled={busy === t.username}
                title="Remove"
                className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-[#6B7280] hover:text-red-500 hover:border-red-200 transition-colors disabled:opacity-50 shrink-0"
              >
                {busy === t.username ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

interface Admin {
  id: number;
  email: string;
  name: string;
  role: "super_admin" | "admin";
  is_active: boolean;
  created_at: string;
}

type Filter = "all" | "active" | "inactive";

const EMPTY_FORM = { id: 0, name: "", email: "", password: "", role: "admin" as "admin" | "super_admin" };

export default function ManageAdminsPage() {
  const router = useRouter();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [currentAdminId, setCurrentAdminId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [toRemove, setToRemove] = useState<Admin | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/manage", { cache: "no-store" });
      if (res.status === 403) {
        toast.error("Super admin access only");
        router.replace("/admin/dashboard");
        return;
      }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAdmins(data.admins || []);
      setCurrentAdminId(data.currentAdminId ?? null);
    } catch {
      toast.error("Failed to load admins");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setForm({ ...EMPTY_FORM });
    setModalMode("add");
    setShowPw(false);
    setModalOpen(true);
  };

  const openEdit = (a: Admin) => {
    setForm({ id: a.id, name: a.name, email: a.email, password: "", role: a.role });
    setModalMode("edit");
    setShowPw(false);
    setModalOpen(true);
  };

  const save = async () => {
    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    if (!name) { toast.error("Name is required"); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { toast.error("Enter a valid email address"); return; }
    if (modalMode === "add" && form.password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (modalMode === "edit" && form.password.length > 0 && form.password.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }

    setSaving(true);
    try {
      let res: Response;
      if (modalMode === "add") {
        res = await fetch("/api/admin/manage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password: form.password, role: form.role }),
        });
      } else {
        const payload: Record<string, unknown> = { name, email, role: form.role };
        if (form.password.length > 0) payload.password = form.password;
        res = await fetch(`/api/admin/manage/${form.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save admin");
      toast.success(modalMode === "add" ? "Admin enrolled" : "Admin updated");
      setModalOpen(false);
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save admin");
    } finally {
      setSaving(false);
    }
  };

  const togglePause = async (a: Admin) => {
    setBusyId(a.id);
    try {
      const res = await fetch(`/api/admin/manage/${a.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !a.is_active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success(a.is_active ? "Admin paused" : "Admin activated");
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (a: Admin) => {
    setBusyId(a.id);
    try {
      const res = await fetch(`/api/admin/manage/${a.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");
      setToRemove(null);
      if (data.selfDeleted) {
        // You deleted your own account — end the session and go to login.
        toast.success("Your admin account was deleted");
        try { await fetch("/api/admin/logout", { method: "POST" }); } catch {}
        router.push("/admin");
        return;
      }
      toast.success("Admin deleted");
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setBusyId(null);
    }
  };

  const counts = useMemo(() => {
    return {
      all: admins.length,
      active: admins.filter((a) => a.is_active).length,
      inactive: admins.filter((a) => !a.is_active).length,
    };
  }, [admins]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return admins.filter((a) => {
      if (filter === "active" && !a.is_active) return false;
      if (filter === "inactive" && a.is_active) return false;
      if (!q) return true;
      return a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q) || String(a.id).includes(q);
    });
  }, [admins, filter, search]);

  const inputCls =
    "w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 outline-none focus:border-[#FF561E] focus:ring-2 focus:ring-[#FF561E]/10 text-[14px] transition-all";
  const labelCls = "block text-[12px] font-semibold text-[#6B7280] mb-1.5";

  return (
    <>
      <AdminTopbar title="Manage Admins" />
      <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8 max-w-6xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <p className="text-[14px] text-[#6B7280]">Enroll and manage admin accounts and their roles.</p>
          <button
            onClick={openAdd}
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#FF561E] text-white text-[13px] font-bold hover:bg-[#E04B18] transition-colors shadow-sm shadow-orange-500/25 shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Admin
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or ID..."
              className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 outline-none focus:border-[#FF561E] focus:ring-2 focus:ring-[#FF561E]/10 text-[14px] transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            {(["all", "active", "inactive"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold border transition-colors capitalize ${
                  filter === f
                    ? "bg-[#FFF4F0] text-[#FF561E] border-[#FF561E]"
                    : "bg-white text-[#6B7280] border-gray-200 hover:text-[#FF561E] hover:border-orange-200"
                }`}
              >
                {f}
                <span className={`text-[11px] font-bold ${filter === f ? "text-[#FF561E]/70" : "text-gray-400"}`}>{counts[f]}</span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#FF561E] animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <p className="text-[14px] text-[#6B7280] font-medium">No admins match.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((a) => {
              const isSelf = a.id === currentAdminId;
              const isSuper = a.role === "super_admin";
              return (
                <div
                  key={a.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 text-white text-[15px] font-bold ${
                        isSuper ? "bg-gradient-to-br from-[#FF561E] to-[#FF7A45]" : "bg-gradient-to-br from-slate-500 to-slate-600"
                      }`}
                    >
                      {(a.name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[15px] font-bold text-[#1A1D20] truncate">{a.name}</p>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isSuper ? "bg-[#FFF4F0] text-[#FF561E]" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {isSuper ? <ShieldCheck className="w-3 h-3" /> : <UserCog className="w-3 h-3" />}
                          {isSuper ? "Super Admin" : "Admin"}
                        </span>
                        {isSelf && <span className="text-[10px] font-bold text-[#6B7280] bg-gray-100 px-2 py-0.5 rounded-full">You</span>}
                      </div>
                      <p className="text-[12.5px] text-[#6B7280] truncate">{a.email}</p>
                      <p className="text-[11px] text-gray-400">
                        ID: #{a.id} · Created {new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        a.is_active ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-[#6B7280]"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${a.is_active ? "bg-emerald-500" : "bg-gray-400"}`} />
                      {a.is_active ? "Active" : "Paused"}
                    </span>

                    <button
                      onClick={() => togglePause(a)}
                      disabled={busyId === a.id || isSelf}
                      title={isSelf ? "You can't pause yourself" : a.is_active ? "Pause" : "Activate"}
                      className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-[#6B7280] hover:text-amber-600 hover:border-amber-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {busyId === a.id ? <Loader2 className="w-4 h-4 animate-spin" /> : a.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => openEdit(a)}
                      title="Edit"
                      className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-[#6B7280] hover:text-[#FF561E] hover:border-orange-200 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setToRemove(a)}
                      disabled={busyId === a.id}
                      title={isSelf ? "Delete my account" : "Delete"}
                      className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-[#6B7280] hover:text-red-500 hover:border-red-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Telegram admins allowlist */}
        <TelegramAdminsSection />
      </main>

      {/* Add / Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => !saving && setModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <button
              onClick={() => !saving && setModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4 text-[#1A1D20]" />
            </button>
            <h3 className="text-[17px] font-bold text-[#1A1D20] mb-5">{modalMode === "add" ? "Enroll New Admin" : "Edit Admin"}</h3>

            <label className={labelCls}>Name</label>
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" />

            <label className={`${labelCls} mt-4`}>Email</label>
            <input className={inputCls} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="admin@esim4u.uk" />

            <label className={`${labelCls} mt-4`}>{modalMode === "add" ? "Password" : "Reset password (optional)"}</label>
            <div className="relative">
              <input
                className={`${inputCls} pr-11`}
                type={showPw ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={modalMode === "add" ? "At least 8 characters" : "Leave blank to keep current"}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#FF561E]"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <label className={`${labelCls} mt-4`}>Role</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, role: "admin" })}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[13px] font-semibold transition-colors ${
                  form.role === "admin" ? "border-[#FF561E] bg-[#FFF4F0] text-[#FF561E]" : "border-gray-200 text-[#6B7280] hover:border-gray-300"
                }`}
              >
                <UserCog className="w-4 h-4" /> Admin
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, role: "super_admin" })}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[13px] font-semibold transition-colors ${
                  form.role === "super_admin" ? "border-[#FF561E] bg-[#FFF4F0] text-[#FF561E]" : "border-gray-200 text-[#6B7280] hover:border-gray-300"
                }`}
              >
                <ShieldCheck className="w-4 h-4" /> Super Admin
              </button>
            </div>

            <div className="mt-6 flex items-center gap-2">
              <button
                onClick={save}
                disabled={saving}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF561E] text-white text-[13px] font-bold hover:bg-[#E04B18] transition-colors shadow-sm shadow-orange-500/25 disabled:opacity-70"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : modalMode === "add" ? "Enroll Admin" : "Save Changes"}
              </button>
              <button
                onClick={() => !saving && setModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-[13px] font-semibold text-[#6B7280] hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!toRemove}
        title="Delete this admin?"
        message={
          toRemove
            ? toRemove.id === currentAdminId
              ? `This will delete your own admin account ("${(toRemove.name || "You").toUpperCase()}") and sign you out immediately. This cannot be undone.`
              : `"${(toRemove.name || "This admin").toUpperCase()}" will lose access immediately. This cannot be undone.`
            : undefined
        }
        confirmLabel="Delete admin"
        loading={busyId !== null && toRemove !== null && busyId === toRemove.id}
        onConfirm={() => toRemove && remove(toRemove)}
        onCancel={() => setToRemove(null)}
      />
    </>
  );
}
