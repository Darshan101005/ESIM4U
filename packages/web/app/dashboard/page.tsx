"use client";

import DashboardTopbar from "@/components/dashboard/topbar";
import HeroCarousel from "@/components/dashboard/hero-carousel";
import DestinationsCarousel from "@/components/dashboard/destinations-carousel";
import { Skeleton } from "@/components/dashboard/skeleton";
import { useCachedSession } from "@/lib/auth-client";
import { useCurrency } from "@/lib/currency-context";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Smartphone,
  ShoppingBag,
  Wallet,
  CreditCard,
  ArrowRight,
  Globe,
  BookOpen,
  LifeBuoy,
  Zap,
  ShieldCheck,
  Headphones,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";

interface StatTone {
  icon: LucideIcon;
  iconWrap: string;
  iconColor: string;
  wave: string;
}

interface Order {
  id: number;
  bundle_name?: string;
  country?: string;
  country_code?: string;
  data_amount?: string;
  price: string;
  status: string;
  created_at: string;
}

interface Destination {
  name: string;
  iso3: string;
  image: string;
  fromPrice: number | null;
}

function DecoWave({ id, color }: { id: string; color: string }) {
  const gid = `wave-${id}`;
  const bid = `blur-${id}`;
  return (
    <svg
      className="absolute bottom-0 left-0 w-full h-[28%] pointer-events-none"
      viewBox="0 0 400 44"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.20" />
          <stop offset="100%" stopColor={color} stopOpacity="0.015" />
        </linearGradient>
        <filter id={bid} x="-10%" y="-10%" width="120%" height="140%">
          <feGaussianBlur stdDeviation="1.4" />
        </filter>
      </defs>
      <path
        d="M0 26 C70 12 130 30 210 22 C280 15 340 8 400 20 L400 44 L0 44 Z"
        fill={`url(#${gid})`}
        filter={`url(#${bid})`}
      />
      <path
        d="M0 32 C80 22 140 34 220 28 C290 23 350 26 400 30 L400 44 L0 44 Z"
        fill={`url(#${gid})`}
        opacity="0.55"
        filter={`url(#${bid})`}
      />
    </svg>
  );
}

function statusIcon(status: string) {
  if (status === "completed") return <CheckCircle2 className="w-4 h-4 text-emerald-500" strokeWidth={2.5} />;
  if (status === "failed") return <XCircle className="w-4 h-4 text-red-500" strokeWidth={2.5} />;
  return <Clock className="w-4 h-4 text-amber-500" strokeWidth={2.5} />;
}

const QUICK_ACTIONS = [
  { label: "Top Up", hint: "Add balance", href: "/dashboard/topup", icon: Wallet, tint: "bg-[#FFF4F0] text-[#FF561E]" },
  { label: "My eSIMs", hint: "View your eSIMs", href: "/dashboard/esims", icon: Smartphone, tint: "bg-emerald-50 text-emerald-600" },
  { label: "Installation Guide", hint: "Step-by-step help", href: "/dashboard/support", icon: BookOpen, tint: "bg-violet-50 text-violet-600" },
  { label: "Help & Support", hint: "Get assistance", href: "/dashboard/support", icon: LifeBuoy, tint: "bg-sky-50 text-sky-600" },
];

const FEATURES = [
  { title: "Instant Delivery", desc: "Get your eSIM instantly after purchase", icon: Zap, tint: "text-[#FF561E]" },
  { title: "Global Coverage", desc: "200+ countries and regions covered", icon: Globe, tint: "text-emerald-500" },
  { title: "Secure Checkout", desc: "Your data is protected end to end", icon: ShieldCheck, tint: "text-violet-500" },
  { title: "24/7 Support", desc: "We are here to help anytime", icon: Headphones, tint: "text-sky-500" },
];

export default function DashboardPage() {
  const { data: session, isPending } = useCachedSession();
  const { format } = useCurrency();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);

  const user = session?.user as { name?: string } | undefined;

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
      return;
    }
    if (session) {
      fetch("/api/orders")
        .then((res) => res.json())
        .then((data) => setOrders(data.orders || []))
        .catch(() => {})
        .finally(() => setLoading(false));
      fetch("/api/popular-destinations")
        .then((res) => res.json())
        .then((data) => setDestinations(data.destinations || []))
        .catch(() => {});
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-[#FF561E] border-t-transparent rounded-full" />
      </div>
    );
  }
  if (!session) return null;

  const completedOrders = orders.filter((o) => o.status === "completed");
  const totalSpent = completedOrders.reduce((sum, o) => sum + parseFloat(o.price || "0"), 0);

  const stats: (StatTone & { label: string; value: string; hint: string })[] = [
    { label: "Active eSIMs", value: String(completedOrders.length), hint: completedOrders.length ? `${completedOrders.length} active` : "No active eSIMs", icon: Smartphone, iconWrap: "bg-violet-50", iconColor: "text-violet-500", wave: "#8B5CF6" },
    { label: "Total Orders", value: String(orders.length), hint: "All time orders", icon: ShoppingBag, iconWrap: "bg-emerald-50", iconColor: "text-emerald-500", wave: "#10B981" },
    { label: "Total Spent", value: format(totalSpent), hint: "All time spending", icon: CreditCard, iconWrap: "bg-pink-50", iconColor: "text-pink-500", wave: "#EC4899" },
  ];

  return (
    <>
      <DashboardTopbar />
      <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8">
        <div className="mb-8">
          <p className="text-[14px] text-[#6B7280] font-medium">Welcome back,</p>
          <h2 className="text-[26px] lg:text-[30px] font-bold text-[#1A1D20] tracking-tight">{user?.name || "Traveller"}</h2>
          <p className="text-[14px] text-[#6B7280] font-medium mt-1">Here&apos;s what&apos;s happening with your eSIM activity today.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5 mb-7">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="relative overflow-hidden bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                {loading ? (
                  <div>
                    <div className="flex items-center gap-2.5 mb-4">
                      <Skeleton className="w-10 h-10 rounded-xl" />
                      <Skeleton className="h-3.5 w-24" />
                    </div>
                    <Skeleton className="h-7 w-16 mb-2.5" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                ) : (
                  <>
                    <DecoWave id={s.label.replace(/\s+/g, "")} color={s.wave} />
                    <div className="relative z-10">
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className={`w-10 h-10 rounded-xl ${s.iconWrap} flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 ${s.iconColor}`} strokeWidth={2} />
                        </div>
                        <span className="text-[13px] font-semibold text-[#6B7280]">{s.label}</span>
                      </div>
                      <p className="text-[26px] font-bold text-[#1A1D20] leading-none">{s.value}</p>
                      <p className="text-[12px] text-[#6B7280] mt-2">{s.hint}</p>
                    </div>
                  </>
                )}
              </div>
            );
          })}

          <div className="relative overflow-hidden bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            {loading ? (
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <Skeleton className="w-10 h-10 rounded-xl" />
                  <Skeleton className="h-3.5 w-24" />
                </div>
                <Skeleton className="h-7 w-16 mb-2.5" />
                <Skeleton className="h-3 w-28" />
              </div>
            ) : (
              <>
                <DecoWave id="Wallet" color="#FF561E" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-[#FFF4F0] flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-[#FF561E]" strokeWidth={2} />
                      </div>
                      <span className="text-[13px] font-semibold text-[#6B7280]">Wallet Balance</span>
                    </div>
                    <Link
                      href="/dashboard/topup"
                      className="px-3 py-1.5 rounded-lg bg-[#FFF4F0] text-[#FF561E] text-[12px] font-bold hover:bg-[#FFE7DC] transition-colors"
                    >
                      Top Up
                    </Link>
                  </div>
                  <p className="text-[26px] font-bold text-[#1A1D20] leading-none">{format(0)}</p>
                  <p className="text-[12px] text-[#6B7280] mt-2">Available balance</p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-7">
          <div className="lg:col-span-2">
            <HeroCarousel />
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
            <h3 className="text-[16px] font-bold text-[#1A1D20] mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {QUICK_ACTIONS.map((a) => {
                const Icon = a.icon;
                return (
                  <Link
                    key={a.label}
                    href={a.href}
                    className="group rounded-xl border border-gray-100 p-3.5 hover:border-orange-100 hover:shadow-sm transition-all"
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2.5 ${a.tint}`}>
                      <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
                    </div>
                    <p className="text-[13px] font-bold text-[#1A1D20] leading-tight">{a.label}</p>
                    <p className="text-[11px] text-[#6B7280] mt-0.5">{a.hint}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-7">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-bold text-[#1A1D20]">My Data Usage</h3>
              {completedOrders.length > 0 && (
                <Link href="/dashboard/esims" className="text-[13px] font-semibold text-[#FF561E] hover:text-[#E04B18] flex items-center gap-1">
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-[60px] rounded-xl" />
                ))}
              </div>
            ) : completedOrders.length === 0 ? (
              <div className="py-10 text-center">
                <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                  <Smartphone className="w-6 h-6 text-gray-300" strokeWidth={1.5} />
                </div>
                <p className="text-[15px] font-semibold text-[#1A1D20]">No active eSIMs</p>
                <p className="text-[13px] text-[#6B7280] mt-1 mb-4">Purchase an eSIM plan to see your data usage here.</p>
                <Link href="/dashboard/browse" className="inline-flex px-5 py-2.5 rounded-xl border border-[#FF561E]/40 text-[#FF561E] text-[13px] font-bold hover:bg-[#FF561E] hover:text-white transition-colors">
                  Browse eSIM Plans
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {completedOrders.slice(0, 4).map((o) => (
                  <Link key={o.id} href={`/dashboard/orders/${o.id}`} className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-100 hover:border-orange-100 hover:bg-gray-50/50 transition-all">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-[#FFF4F0] flex items-center justify-center">
                        <Smartphone className="w-4 h-4 text-[#FF561E]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-[#1A1D20] truncate">{o.bundle_name || o.country}</p>
                        <p className="text-[11px] text-[#6B7280]">{o.data_amount || "eSIM"}</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#FF561E]">
                      View usage <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-bold text-[#1A1D20]">Recent Orders</h3>
              <Link href="/dashboard/orders" className="text-[13px] font-semibold text-[#FF561E] hover:text-[#E04B18] flex items-center gap-1">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {loading ? (
              <div className="space-y-3 py-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="space-y-1.5">
                      <Skeleton className="h-3.5 w-28" />
                      <Skeleton className="h-2.5 w-16" />
                    </div>
                    <Skeleton className="h-3.5 w-12" />
                  </div>
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="py-10 text-center">
                <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                  <ShoppingBag className="w-6 h-6 text-gray-300" strokeWidth={1.5} />
                </div>
                <p className="text-[15px] font-semibold text-[#1A1D20]">No orders yet</p>
                <p className="text-[13px] text-[#6B7280] mt-1">Your purchases will appear here.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {orders.slice(0, 5).map((o) => (
                  <Link key={o.id} href={`/dashboard/orders/${o.id}`} className="flex items-center justify-between py-2.5 hover:bg-gray-50/50 rounded-lg px-2 -mx-2 transition-colors">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-[#1A1D20] truncate">{o.bundle_name || o.country || "eSIM Plan"}</p>
                      <p className="text-[11px] text-[#6B7280]">{new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[13px] font-bold text-[#1A1D20]">{format(parseFloat(o.price))}</span>
                      {statusIcon(o.status)}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mb-7">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[16px] font-bold text-[#1A1D20]">Popular Destinations</h3>
              <p className="text-[13px] text-[#6B7280]">Explore our most popular travel destinations.</p>
            </div>
            <Link href="/dashboard/browse" className="text-[13px] font-semibold text-[#FF561E] hover:text-[#E04B18] flex items-center gap-1 shrink-0">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {destinations.length === 0 ? (
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="w-[200px] h-[200px] rounded-2xl shrink-0" />
              ))}
            </div>
          ) : (
            <DestinationsCarousel destinations={destinations} />
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                  <Icon className={`w-5 h-5 ${f.tint}`} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[14px] font-bold text-[#1A1D20]">{f.title}</p>
                  <p className="text-[12px] text-[#6B7280] mt-0.5 leading-snug">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
