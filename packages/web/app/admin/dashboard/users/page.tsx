"use client";

import AdminTopbar from "@/components/admin/admin-topbar";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Users, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Search, Ban, ChevronRight as Arrow } from "lucide-react";

interface AppUser {
  id: string;
  name: string | null;
  email: string;
  emailVerified: boolean;
  createdAt: string;
  banned: boolean;
  last_seen_at: string | null;
  order_count: number;
  total_spent: number;
}

type Counts = Record<string, number>;

const SEGMENTS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "leads", label: "Leads" },
  { key: "verified", label: "Verified" },
  { key: "unverified", label: "Unverified" },
  { key: "blocked", label: "Blocked" },
];

function lastSeenLabel(iso: string | null): string {
  if (!iso) return "Never";
  const d = new Date(String(iso).replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime();
  const day = 86400000;
  if (diff < day) return "Today";
  if (diff < 2 * day) return "Yesterday";
  const days = Math.floor(diff / day);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [counts, setCounts] = useState<Counts>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [segment, setSegment] = useState("all");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const limit = 20;

  // Debounce the search box.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit), segment });
      if (debounced) params.set("search", debounced);
      const res = await fetch(`/api/admin/users?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
      setCounts(data.counts || {});
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page, segment, debounced]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <>
      <AdminTopbar title="Customers" />
      <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8 max-w-6xl mx-auto w-full">
        {/* Search */}
        <div className="relative mb-4 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name or email…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 outline-none focus:border-[#FF561E] focus:ring-2 focus:ring-[#FF561E]/10 text-[14px] transition-all"
          />
        </div>

        {/* Segment filters */}
        <div className="flex items-center gap-2 flex-wrap mb-5">
          {SEGMENTS.map((s) => {
            const active = segment === s.key;
            const count = counts[s.key];
            return (
              <button
                key={s.key}
                onClick={() => {
                  setSegment(s.key);
                  setPage(1);
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[12.5px] font-semibold transition-all ${
                  active ? "bg-[#FF561E] text-white shadow-sm" : "bg-white border border-gray-200 text-[#6B7280] hover:text-[#FF561E] hover:border-orange-200"
                }`}
              >
                {s.label}
                {count != null && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${active ? "bg-white/25 text-white" : "bg-gray-100 text-[#6B7280]"}`}>{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#FF561E] animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-[14px] text-[#6B7280] font-medium">No customers match this view</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="px-5 py-3 text-[12px] font-semibold text-[#6B7280]">Name</th>
                      <th className="px-5 py-3 text-[12px] font-semibold text-[#6B7280]">Email</th>
                      <th className="px-5 py-3 text-[12px] font-semibold text-[#6B7280]">Last seen</th>
                      <th className="px-5 py-3 text-[12px] font-semibold text-[#6B7280] text-right">Orders</th>
                      <th className="px-5 py-3 text-[12px] font-semibold text-[#6B7280] text-right">Spend</th>
                      <th className="px-5 py-3 text-[12px] font-semibold text-[#6B7280] text-right">Status</th>
                      <th className="px-3 py-3 w-8" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        onClick={() => router.push(`/admin/dashboard/users/${user.id}`)}
                        className="group hover:bg-gray-50/40 transition-colors cursor-pointer"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF561E] to-[#FF7A45] flex items-center justify-center shrink-0">
                              <span className="text-white text-[13px] font-bold">{(user.name || user.email).charAt(0).toUpperCase()}</span>
                            </div>
                            <span className="text-[13px] font-semibold text-[#1A1D20]">{user.name ? user.name.toUpperCase() : "—"}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-[13px] text-[#6B7280] max-w-[220px] truncate">{user.email}</td>
                        <td className="px-5 py-4 text-[13px] text-[#6B7280]">{lastSeenLabel(user.last_seen_at)}</td>
                        <td className="px-5 py-4 text-[13px] font-semibold text-[#1A1D20] text-right">{user.order_count}</td>
                        <td className="px-5 py-4 text-[13px] font-bold text-[#1A1D20] text-right">${(user.total_spent || 0).toFixed(2)}</td>
                        <td className="px-5 py-4 text-right">
                          {user.banned ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-500 text-[11px] font-semibold">
                              <Ban className="w-3 h-3" /> Blocked
                            </span>
                          ) : user.emailVerified ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 inline" />
                          ) : (
                            <XCircle className="w-4 h-4 text-gray-300 inline" />
                          )}
                        </td>
                        <td className="px-3 py-4 text-right">
                          <Arrow className="w-4 h-4 text-gray-300 group-hover:text-[#FF561E] inline transition-colors" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <p className="text-[13px] text-[#6B7280]">
                Page {page} of {totalPages} · {total} customers
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center disabled:opacity-40 hover:bg-gray-50">
                  <ChevronLeft className="w-4 h-4 text-[#1A1D20]" />
                </button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center disabled:opacity-40 hover:bg-gray-50">
                  <ChevronRight className="w-4 h-4 text-[#1A1D20]" />
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}
