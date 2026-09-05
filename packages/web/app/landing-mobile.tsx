"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Globe, QrCode, Plane, Tag, Zap, ShieldCheck, Headphones, Smartphone,
  RadioTower, Search, ChevronRight, ArrowRight, X, Menu, CheckCircle2,
  XCircle, Wifi, Gift, Star, Quote, PhoneCall, Rocket, Users,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { authClient, signOutAndClear, getCachedUser, fetchAndCacheUser } from '@/lib/auth-client';
import { flagUrl } from '@/lib/flags';

const Flag = dynamic<any>(() => import('react-flagpack').then(m => m.default || m), { ssr: false });

const destinations = [
  { name: 'Australia', image: 'australia.png', iso3: 'AUS' },
  { name: 'Brazil', image: 'brazil.png', iso3: 'BRA' },
  { name: 'Canada', image: 'canada.png', iso3: 'CAN' },
  { name: 'England', image: 'england.png', iso3: 'GBR' },
  { name: 'France', image: 'france.png', iso3: 'FRA' },
  { name: 'Japan', image: 'japan.png', iso3: 'JPN' },
  { name: 'Malaysia', image: 'malaysia.png', iso3: 'MYS' },
  { name: 'Singapore', image: 'singapore.png', iso3: 'SGP' },
  { name: 'Switzerland', image: 'switzerland.png', iso3: 'CHE' },
  { name: 'Turkey', image: 'turkey.png', iso3: 'TUR' },
  { name: 'UAE', image: 'uae.png', iso3: 'ARE' },
  { name: 'United States', image: 'usa.png', iso3: 'USA' },
];

const countriesList = [
  { name: 'India', flag: 'IN', iso3: 'IND' },
  { name: 'United Kingdom', flag: 'GBR', iso3: 'GBR' },
  { name: 'Greece', flag: 'GR', iso3: 'GRC' },
  { name: 'Turkey', flag: 'TR', iso3: 'TUR' },
  { name: 'Germany', flag: 'DE', iso3: 'DEU' },
  { name: 'Switzerland', flag: 'CH', iso3: 'CHE' },
  { name: 'France', flag: 'FR', iso3: 'FRA' },
  { name: 'Italy', flag: 'IT', iso3: 'ITA' },
  { name: 'United States', flag: 'US', iso3: 'USA' },
  { name: 'Thailand', flag: 'TH', iso3: 'THA' },
];

const regionsList = [
  { name: 'North America', image: 'north america_map.png', code: 'na' },
  { name: 'Europe', image: 'europe_map.png', code: 'eu' },
  { name: 'Asia', image: 'asia_map.png', code: 'as' },
  { name: 'Africa', image: 'africa_map.png', code: 'af' },
  { name: 'Middle East & North Africa', image: 'middle east &north africa_map.png', code: 'me' },
  { name: 'South America', image: 'southamerica_map.png', code: 'sa' },
];

const reviews = [
  { name: 'Daniel K.', country: 'United Kingdom', flag: 'GBR', rating: 5, text: 'eSIM4U made my trip so much easier! I had internet the moment I landed. Super fast and reliable.' },
  { name: 'Sophia L.', country: 'France', flag: 'FRA', rating: 4, text: 'Installation was quick and easy. Great coverage across Europe, highly recommended!' },
  { name: 'Yuto M.', country: 'Japan', flag: 'JPN', rating: 5, text: 'I used eSIM4U in Japan and it worked perfectly. No SIM swap, no hassle, just seamless connection.' },
  { name: 'Aarav S.', country: 'India', flag: 'IND', rating: 4, text: 'Activated my eSIM before the flight and was online instantly in Delhi. Brilliant service.' },
  { name: 'Emma W.', country: 'Australia', flag: 'AUS', rating: 5, text: 'Used it across three countries on one trip. Switching was effortless and the speed was great.' },
];

const howSteps = [
  { step: '01', title: 'Choose Destination', desc: 'Select your destination and pick the perfect eSIM plan for your trip.', icon: <Globe className="w-8 h-8 text-[#FF561E]" strokeWidth={1.5} /> },
  { step: '02', title: 'Scan & Install', desc: 'Receive your eSIM QR code instantly and install it in just a few taps.', icon: <QrCode className="w-8 h-8 text-[#FF561E]" strokeWidth={1.5} /> },
  { step: '03', title: 'Connect & Go', desc: 'Turn on your eSIM and stay connected the moment you land.', icon: <Plane className="w-8 h-8 text-[#FF561E]" strokeWidth={1.5} /> },
];

const whyFeatures = [
  { title: 'Global Coverage', desc: 'Connected in 200+ countries.', icon: <Globe className="w-7 h-7 text-[#FF561E]" strokeWidth={2} /> },
  { title: 'Affordable Plans', desc: 'Budget-friendly for every trip.', icon: <Tag className="w-7 h-7 text-[#FF561E]" strokeWidth={2} /> },
  { title: 'Instant Activation', desc: 'Connect in minutes, not hours.', icon: <Zap className="w-7 h-7 text-[#FF561E]" strokeWidth={2} /> },
  { title: 'Secure & Reliable', desc: 'Trusted global partners.', icon: <ShieldCheck className="w-7 h-7 text-[#FF561E]" strokeWidth={2} /> },
  { title: '24/7 Support', desc: 'Help whenever you need it.', icon: <Headphones className="w-7 h-7 text-[#FF561E]" strokeWidth={2} /> },
  { title: 'eSIM Compatible', desc: 'Works with 99% of devices.', icon: <Smartphone className="w-7 h-7 text-[#FF561E]" strokeWidth={2} /> },
];

const comparison = [
  { feature: 'Global Coverage', icon: <Globe className="w-5 h-5 text-[#FF561E]" strokeWidth={1.8} />, esim4u: '200+ Countries', competitors: { Airalo: true, Holafly: true, Saily: true } },
  { feature: '24/7 Live Support', icon: <Headphones className="w-5 h-5 text-[#FF561E]" strokeWidth={1.8} />, esim4u: 'Always available', competitors: { Airalo: true, Holafly: true, Saily: true } },
  { feature: 'Money Back Guarantee', icon: <ShieldCheck className="w-5 h-5 text-[#FF561E]" strokeWidth={1.8} />, esim4u: '30 Days', competitors: { Airalo: false, Holafly: false, Saily: false } },
  { feature: 'Share via Hotspot', icon: <Wifi className="w-5 h-5 text-[#FF561E]" strokeWidth={1.8} />, esim4u: 'Supported', competitors: { Airalo: true, Holafly: true, Saily: false } },
  { feature: 'Free VPN Access', icon: <Gift className="w-5 h-5 text-[#FF561E]" strokeWidth={1.8} />, esim4u: 'Included free', competitors: { Airalo: false, Holafly: false, Saily: false } },
];

const referSteps = [
  { n: '1', title: 'Share Your Code', desc: 'Send your referral link to friends anywhere.', img: 'step1.png' },
  { n: '2', title: 'They Join eSIM4U', desc: 'Your friend signs up and buys their first eSIM.', img: 'step2.png' },
  { n: '3', title: 'You Both Earn $3', desc: 'Credit is added automatically to both accounts.', img: 'step3.png' },
];

type Tab = 'Countries' | 'Regions' | 'Global';

export default function LandingMobile() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('Countries');
  const [startingLoading, setStartingLoading] = useState(false);
  const [prices, setPrices] = useState<{ countries: Record<string, number | null>; regions: Record<string, number | null>; global: number | null } | null>(null);
  const [authUser, setAuthUser] = useState<{ name?: string; email?: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    fetch('/api/landing-prices')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d && !d.error) setPrices(d); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    // Show cached auth instantly for returning users, then confirm.
    const cached = getCachedUser();
    if (cached) { setAuthUser(cached); setAuthChecked(true); }
    fetchAndCacheUser()
      .then((u) => { setAuthUser(u); setAuthChecked(true); })
      .catch(() => setAuthChecked(true));
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  // Auto-scrolling destinations carousel (loops seamlessly, pauses on touch).
  const destScrollRef = useRef<HTMLDivElement | null>(null);
  const destPausedRef = useRef(false);
  const destResumeTimer = useRef<number | null>(null);
  const loopedDestinations = useMemo(() => [...destinations, ...destinations], []);

  useEffect(() => {
    const el = destScrollRef.current;
    if (!el) return;
    let raf = 0;
    const tick = () => {
      if (el && !destPausedRef.current) {
        el.scrollLeft += 0.5;
        const half = el.scrollWidth / 2;
        if (half > 0 && el.scrollLeft >= half) {
          el.scrollLeft -= half;
        }
      }
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, []);

  const pauseDestCarousel = useCallback(() => {
    destPausedRef.current = true;
    if (destResumeTimer.current) window.clearTimeout(destResumeTimer.current);
    destResumeTimer.current = window.setTimeout(() => {
      destPausedRef.current = false;
    }, 2500);
  }, []);

  const priceText = useCallback((val: number | null | undefined) => {
    if (!prices) return <span className="skeleton inline-block h-[13px] w-[72px] rounded align-middle" />;
    if (val == null) return 'From US$—';
    return `From US$${val.toFixed(2)}`;
  }, [prices]);

  const goProtected = useCallback(async (target: string) => {
    try {
      const result = await authClient.getSession();
      const session = (result as { data?: { user?: unknown } | null })?.data;
      router.push(session?.user ? target : `/login?redirect=${encodeURIComponent(target)}`);
    } catch {
      router.push(`/login?redirect=${encodeURIComponent(target)}`);
    }
  }, [router]);

  const handleGetStarted = useCallback(async () => {
    if (startingLoading) return;
    setStartingLoading(true);
    try {
      const result = await authClient.getSession();
      const session = (result as { data?: { user?: unknown } | null })?.data;
      router.push(session?.user ? '/dashboard' : '/signup');
    } catch {
      router.push('/signup');
    }
  }, [router, startingLoading]);

  const scrollToId = useCallback((id: string) => {
    setMenuOpen(false);
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }, []);

  const tabList = useMemo(() => {
    if (activeTab === 'Countries') {
      return countriesList.map((c) => ({
        key: c.iso3,
        name: c.name,
        price: priceText(prices?.countries[c.iso3]),
        onClick: () => goProtected(`/dashboard/browse/${c.iso3}?name=${encodeURIComponent(c.name)}`),
        media: (
          <div className="w-11 h-8 rounded-md overflow-hidden border border-gray-100 shrink-0 relative">
            <Flag code={c.flag} size="l" hasBorder={false} hasBorderRadius={false} className="country-flag" />
          </div>
        ),
      }));
    }
    if (activeTab === 'Regions') {
      return regionsList.map((r) => ({
        key: r.code,
        name: r.name,
        price: priceText(prices?.regions[r.code]),
        onClick: () => goProtected(`/dashboard/browse/region/${r.code}?name=${encodeURIComponent(r.name)}`),
        media: (
          <div className="w-12 h-8 rounded-md overflow-hidden border border-gray-100 shrink-0 relative bg-[#FFF4F0]">
            <Image src={`/assets/Regions/${r.image}`} alt={r.name} fill className="object-cover" />
          </div>
        ),
      }));
    }
    return [{
      key: 'global',
      name: 'Global',
      price: priceText(prices?.global),
      onClick: () => goProtected('/dashboard/browse?tab=global'),
      media: (
        <div className="w-12 h-8 rounded-md overflow-hidden border border-gray-100 shrink-0 relative bg-[#FFF4F0]">
          <Image src="/assets/Regions/world_map.png" alt="Global" fill className="object-cover" />
        </div>
      ),
    }];
  }, [activeTab, prices, priceText, goProtected]);

  return (
    <div className="w-full bg-white font-sans overflow-x-hidden">
      {/* ===== Sticky Header ===== */}
      <header className="sticky top-0 z-40 w-full bg-white/85 backdrop-blur-xl border-b border-gray-100">
        <div className="flex items-center justify-between px-5 h-16">
          <Link href="/" className="flex items-center">
            <Image src="/assets/esim4u-logo.png" alt="eSIM4U" width={110} height={34} className="object-contain w-[104px]" priority />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className={`transition-opacity duration-200 ${authChecked ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              {authUser ? (
                <Link href="/dashboard" className="px-4 py-2 rounded-full text-white font-semibold text-[13px] bg-[#FF561E] shadow-sm">
                  Dashboard
                </Link>
              ) : (
                <Link href="/login" className="px-4 py-2 rounded-full text-[#FF561E] font-semibold text-[13px] border border-orange-100 bg-orange-50/60">
                  Log in
                </Link>
              )}
            </div>
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[#FFF4F0] border border-orange-100"
            >
              <Menu className="w-5 h-5 text-[#FF561E]" />
            </button>
          </div>
        </div>
      </header>

      {/* ===== Slide-over Menu ===== */}
      <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
        <div className={`absolute right-0 top-0 bottom-0 w-[82%] max-w-[320px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex items-center justify-between px-5 h-16 border-b border-gray-100">
            <Image src="/assets/esim4u-logo.png" alt="eSIM4U" width={100} height={30} className="object-contain" />
            <button onClick={() => setMenuOpen(false)} aria-label="Close menu" className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center">
              <X className="w-5 h-5 text-[#1A1D20]" />
            </button>
          </div>
          <nav className="flex flex-col px-4 py-4 gap-1">
            <button onClick={() => scrollToId('m-how')} className="py-3 px-3 text-[15px] font-medium text-[#1A1D20] text-left rounded-xl active:bg-gray-50">How It Works</button>
            <button onClick={() => scrollToId('m-destinations')} className="py-3 px-3 text-[15px] font-medium text-[#1A1D20] text-left rounded-xl active:bg-gray-50">Destinations</button>
            <button onClick={() => scrollToId('m-compare')} className="py-3 px-3 text-[15px] font-medium text-[#1A1D20] text-left rounded-xl active:bg-gray-50">Why eSIM4U</button>
            <Link href="/about-us" onClick={() => setMenuOpen(false)} className="py-3 px-3 text-[15px] font-medium text-[#1A1D20] rounded-xl active:bg-gray-50">About Us</Link>
            <Link href="/faq" onClick={() => setMenuOpen(false)} className="py-3 px-3 text-[15px] font-medium text-[#1A1D20] rounded-xl active:bg-gray-50">FAQs</Link>
          </nav>
          <div className="mt-auto px-4 pb-6 flex flex-col gap-3">
            {authUser ? (
              <>
                <div className="px-1 pb-1 text-center">
                  <p className="text-[14px] font-bold text-[#1A1D20] truncate">{(authUser.name || 'Account').toUpperCase()}</p>
                  {authUser.email && <p className="text-[12px] text-[#6B7280] truncate">{authUser.email}</p>}
                </div>
                <Link href="/dashboard" className="w-full py-3 rounded-full bg-[#FF561E] text-white font-semibold text-[14px] text-center shadow-lg shadow-orange-500/20">Go to Dashboard</Link>
                <Link href="/dashboard/profile" className="w-full py-3 rounded-full border border-[#FF561E] text-[#FF561E] font-semibold text-[14px] text-center">My Profile</Link>
                <button
                  type="button"
                  onClick={async () => { await signOutAndClear(); router.push('/'); router.refresh(); }}
                  className="w-full py-3 rounded-full border border-red-200 text-red-500 font-semibold text-[14px] text-center"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="w-full py-3 rounded-full border border-[#FF561E] text-[#FF561E] font-semibold text-[14px] text-center">Log in</Link>
                <Link href="/signup" className="w-full py-3 rounded-full bg-[#FF561E] text-white font-semibold text-[14px] text-center shadow-lg shadow-orange-500/20">Sign up</Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ===== Hero (fills the first screen) ===== */}
      <section className="relative w-full px-5 py-10 flex flex-col justify-center min-h-[calc(100svh-4rem)]" style={{ background: 'linear-gradient(160deg, #FFF8F5 0%, #FFEDE6 55%, #FFE0D5 100%)' }}>
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/70 border border-orange-100 shadow-sm mb-5">
            <span className="text-[#FF561E] text-[12px] font-semibold tracking-wide">Global Travel eSIM</span>
          </div>
          <h1 className="text-[38px] leading-[1.1] font-semibold text-[#1A1D20] tracking-[-0.02em] mb-4">
            Stay Connected<br />
            Everywhere, <span className="text-[#FF561E] font-serif italic font-normal">Anytime.</span>
          </h1>
          <p className="text-[15px] leading-[1.6] text-[#5E6673] font-medium mb-7 max-w-[340px]">
            Travel smarter with instant eSIM activation in 200+ countries worldwide.
          </p>
          <div className="w-full flex flex-col gap-3 max-w-[340px]">
            <button onClick={handleGetStarted} disabled={startingLoading} className="w-full inline-flex items-center justify-center px-7 py-4 rounded-full bg-[#FF561E] text-white font-semibold text-[16px] shadow-xl shadow-orange-500/25 gap-2 active:scale-[0.98] transition-transform disabled:opacity-80">
              Get Started
              <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
            </button>
            <button onClick={() => scrollToId('m-where-next')} className="w-full inline-flex items-center justify-center px-7 py-4 rounded-full bg-white text-[#FF561E] font-semibold text-[16px] border border-orange-100 shadow-sm gap-2 active:scale-[0.98] transition-transform">
              Explore Plans
            </button>
          </div>
        </div>
      </section>

      {/* ===== Stats strip ===== */}
      <section className="w-full px-5 pt-10 relative z-10">
        <div className="grid grid-cols-3 gap-3 bg-white rounded-[22px] border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-5">
          {[
            { icon: <Globe className="w-5 h-5 text-[#FF561E]" strokeWidth={2.5} />, value: '200+', label: 'Countries' },
            { icon: <RadioTower className="w-5 h-5 text-[#FF561E]" strokeWidth={2.5} />, value: '500+', label: 'Networks' },
            { icon: <Zap className="w-5 h-5 text-[#FF561E]" strokeWidth={2.5} />, value: '4G/5G', label: 'High Speed' },
          ].map((s, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-[#FFF4F0] flex items-center justify-center mb-2">{s.icon}</div>
              <span className="text-[18px] font-bold text-[#FF561E] leading-none mb-1">{s.value}</span>
              <span className="text-[12px] text-[#6B7280] font-medium">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ===== How it works ===== */}
      <section id="m-how" className="scroll-mt-20 w-full px-5 pt-14 pb-4">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-orange-50 border border-orange-100 mb-4">
            <span className="text-[#FF561E] text-[12px] font-semibold">How eSIM4U Works</span>
          </div>
          <h2 className="text-[28px] leading-[1.15] font-semibold text-[#1A1D20] tracking-tight">
            Travel Connected in<br />
            <span className="text-[#FF561E] font-serif italic font-medium">3 Simple Steps</span>
          </h2>
        </div>
        <div className="flex flex-col gap-4">
          {howSteps.map((item) => (
            <div key={item.step} className="relative flex items-center gap-4 bg-white rounded-[20px] p-4 pr-5 border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
              <div className="relative shrink-0">
                <div className="w-16 h-16 rounded-[18px] bg-[#FFF4F0] flex items-center justify-center">{item.icon}</div>
                <span className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-[#FF561E] text-white text-[12px] font-bold flex items-center justify-center shadow-md shadow-orange-500/30">{item.step}</span>
              </div>
              <div className="flex flex-col">
                <h3 className="text-[16px] font-bold text-[#1A1D20] mb-1">{item.title}</h3>
                <p className="text-[13px] leading-[1.55] text-[#6B7280] font-medium">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Why choose ===== */}
      <section className="w-full px-5 pt-12 pb-4">
        <div className="w-full bg-[#FFF4F0] rounded-[28px] px-5 py-10">
          <h2 className="text-[24px] leading-tight font-semibold text-[#1A1D20] mb-8 tracking-tight text-center">
            Why Travelers Choose <span className="text-[#FF561E] font-serif italic font-medium">eSIM4U</span>
          </h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8">
            {whyFeatures.map((f, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-white shadow-sm border border-orange-50 flex items-center justify-center mb-3">{f.icon}</div>
                <h3 className="text-[14px] font-bold text-[#1A1D20] mb-1">{f.title}</h3>
                <p className="text-[12px] leading-[1.5] text-[#6B7280] font-medium">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Popular destinations ===== */}
      <section id="m-destinations" className="scroll-mt-20 w-full pt-12 pb-4">
        <div className="px-5 mb-5 text-center">
          <h2 className="text-[26px] leading-tight font-semibold text-[#1A1D20] tracking-tight mb-2">
            Browse Popular <span className="text-[#FF561E] font-serif italic font-medium">Destinations</span>
          </h2>
          <p className="text-[14px] text-[#6B7280] font-medium">Explore top travel destinations.</p>
        </div>
        <div
          ref={destScrollRef}
          onTouchStart={pauseDestCarousel}
          onTouchMove={pauseDestCarousel}
          onPointerDown={pauseDestCarousel}
          className="w-full overflow-x-auto hide-scrollbar"
        >
          <div className="flex gap-4 px-5 pb-2">
            {loopedDestinations.map((dest, i) => (
              <div
                key={`${dest.iso3}-${i}`}
                onClick={() => goProtected(`/dashboard/browse/${dest.iso3}?name=${encodeURIComponent(dest.name)}`)}
                className="shrink-0 w-[150px] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col active:scale-[0.98] transition-transform"
              >
                <div className="relative w-full aspect-square bg-[#FFF4F0] flex items-center justify-center">
                  <Image src={`/assets/Locations/${dest.image}`} alt={dest.name} fill className="object-contain" />
                </div>
                <div className="p-3.5 flex flex-col">
                  <h3 className="text-[15px] font-bold text-[#1A1D20] mb-1">{dest.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-[#FF561E] font-semibold">{priceText(prices?.countries[dest.iso3])}</span>
                    <ArrowRight className="w-4 h-4 text-[#FF561E]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Where to next (tabs) ===== */}
      <section id="m-where-next" className="scroll-mt-20 w-full px-5 pt-12 pb-4">
        <div className="w-full bg-[#FFF4F0] rounded-[28px] px-4 py-8">
          <h2 className="text-[24px] leading-tight font-semibold text-[#1A1D20] mb-2 tracking-tight text-center">
            Where are you traveling <span className="text-[#FF561E] font-serif italic font-medium">next?</span>
          </h2>
          <p className="text-[13px] text-[#6B7280] font-medium mb-6 text-center px-2">Pick a destination, then choose a plan that fits.</p>

          <div className="flex items-center bg-white rounded-full p-1.5 shadow-sm border border-orange-50 mb-4">
            {(['Countries', 'Regions', 'Global'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`flex-1 px-3 py-2 rounded-full font-semibold text-[13px] transition-colors ${activeTab === t ? 'bg-[#FF561E] text-white shadow-sm' : 'text-[#1A1D20]'}`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="relative mb-5">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab.toLowerCase()}`}
              className="w-full pl-11 pr-4 py-3 rounded-full bg-white border border-gray-100 shadow-sm outline-none focus:border-[#FF561E] focus:ring-1 focus:ring-[#FF561E]/20 text-[14px]"
            />
          </div>

          <div className="flex flex-col gap-3 mb-6">
            {tabList.map((row) => (
              <div key={row.key} onClick={row.onClick} className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-gray-100 shadow-sm active:scale-[0.99] transition-transform cursor-pointer">
                <div className="flex items-center gap-3.5 min-w-0">
                  {row.media}
                  <div className="flex flex-col min-w-0">
                    <span className="text-[14px] font-bold text-[#1A1D20] truncate">{row.name}</span>
                    <span className="text-[12px] text-[#FF561E] font-medium">{row.price}</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" />
              </div>
            ))}
          </div>

          <button onClick={() => goProtected('/dashboard/browse')} className="w-full inline-flex items-center justify-center px-6 py-3.5 rounded-full bg-[#FF561E] text-white font-semibold text-[15px] gap-2 shadow-md shadow-orange-500/20 active:scale-[0.98] transition-transform">
            View all destinations
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ===== Coverage ===== */}
      <section className="w-full px-5 pt-12 pb-2">
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-orange-50 border border-orange-100 mb-4">
            <span className="text-[#FF561E] text-[12px] font-semibold">Global Coverage</span>
          </div>
          <h2 className="text-[26px] leading-tight font-semibold text-[#1A1D20] tracking-tight mb-3">
            Stay Connected in<br />
            <span className="text-[#FF561E] font-serif italic font-medium">200+ Countries</span>
          </h2>
          <p className="text-[14px] leading-[1.6] text-[#6B7280] font-medium max-w-[340px] mb-4">
            Reliable, high-speed data coverage across 200+ countries and regions worldwide.
          </p>
          <div className="relative w-full aspect-[16/12] max-w-[440px]">
            <Image src="/assets/continets.gif" alt="Global Coverage Map" fill className="object-contain mix-blend-multiply" unoptimized />
          </div>
        </div>
      </section>

      {/* ===== VPN / Open internet ===== */}
      <section className="w-full px-5 pt-10 pb-4">
        <div className="w-full bg-[#FFF4F0] rounded-[28px] px-5 py-10">
          <div className="text-center mb-8">
            <h2 className="text-[23px] leading-[1.25] font-semibold text-[#1A1D20] tracking-tight mb-3">
              Free VPN for a Truly <span className="text-[#FF561E] font-serif italic font-medium">Open Internet</span>
            </h2>
            <p className="text-[14px] leading-[1.6] text-[#6B7280] font-medium">
              In some regions, calls on WhatsApp, FaceTime and Skype may not work. Every plan includes free VPN so you <span className="font-bold text-[#FF561E]">connect freely, everywhere.</span>
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {[
              { title: 'Open Internet Access', desc: 'Browse without restrictions, anywhere you go.', icon: <Wifi className="w-6 h-6 text-[#FF561E]" strokeWidth={1.5} /> },
              { title: 'Unblock Calling Apps', desc: 'Smooth WhatsApp, FaceTime, Skype & Zoom calls.', icon: <PhoneCall className="w-6 h-6 text-[#FF561E]" strokeWidth={1.5} /> },
              { title: 'Fast & Reliable', desc: 'High-speed VPN servers optimized for travel.', icon: <Rocket className="w-6 h-6 text-[#FF561E]" strokeWidth={1.5} /> },
              { title: 'Works in More Places', desc: 'Stay connected where access is usually limited.', icon: <Globe className="w-6 h-6 text-[#FF561E]" strokeWidth={1.5} /> },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 bg-white rounded-2xl p-4 border border-orange-50">
                <div className="w-12 h-12 rounded-full bg-[#FFF4F0] flex items-center justify-center shrink-0">{item.icon}</div>
                <div className="flex flex-col">
                  <h3 className="text-[15px] font-bold text-[#1A1D20] mb-0.5">{item.title}</h3>
                  <p className="text-[12.5px] leading-[1.5] text-[#6B7280] font-medium">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Comparison (mobile cards) ===== */}
      <section id="m-compare" className="scroll-mt-20 w-full px-5 pt-12 pb-4">
        <div className="text-center mb-7">
          <h2 className="text-[24px] leading-tight font-semibold text-[#1A1D20] tracking-tight mb-2">
            eSIM4U vs. Other <span className="text-[#FF561E] font-serif italic font-medium">eSIM Services</span>
          </h2>
          <p className="text-[13px] text-[#6B7280] font-medium px-2">Better connection, better support, better value.</p>
        </div>
        <div className="flex flex-col gap-3">
          {comparison.map((row, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="flex items-center gap-2.5 px-4 py-3 bg-[#FFF4F0]">
                {row.icon}
                <span className="text-[14px] font-bold text-[#1A1D20]">{row.feature}</span>
              </div>
              <div className="px-4 py-3 flex items-center justify-between border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <Image src="/assets/esim4u-logo.png" alt="eSIM4U" width={72} height={22} className="object-contain" />
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#FF561E]" strokeWidth={2.2} />
                  <span className="text-[13px] font-bold text-[#FF561E]">{row.esim4u}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 divide-x divide-gray-50">
                {(['Airalo', 'Holafly', 'Saily'] as const).map((c) => (
                  <div key={c} className="flex flex-col items-center gap-1 py-3">
                    <span className="text-[11px] font-semibold text-gray-500">{c}</span>
                    {row.competitors[c] ? (
                      <CheckCircle2 className="w-[18px] h-[18px] text-gray-400" strokeWidth={2} />
                    ) : (
                      <XCircle className="w-[18px] h-[18px] text-gray-300" strokeWidth={2} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <Link href="/plans" className="mt-6 w-full inline-flex items-center justify-center px-6 py-3.5 rounded-full bg-[#FF561E] text-white font-semibold text-[15px] gap-2 shadow-md shadow-orange-500/20">
          View Plans <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* ===== Refer & Earn ===== */}
      <section className="w-full px-5 pt-12 pb-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-100 mb-4">
            <Gift className="w-4 h-4 text-[#FF561E]" strokeWidth={2} />
            <span className="text-[#FF561E] text-[12px] font-semibold tracking-wide">Refer &amp; Earn</span>
          </div>
          <h2 className="text-[28px] leading-[1.15] font-semibold text-[#1A1D20] tracking-tight mb-3">
            Refer Friends,<br /><span className="text-[#FF561E] font-serif italic font-medium">Earn $3 Each</span>
          </h2>
          <p className="text-[14px] text-[#6B7280] font-medium max-w-[320px] mx-auto">
            Share eSIM4U and you&apos;ll both get <span className="text-[#FF561E] font-bold">$3 in credit</span>.
          </p>
        </div>
        <div className="relative flex flex-col gap-4 pl-10">
          <div className="absolute left-[18px] top-3 bottom-3 w-[2px] bg-[#FF561E]/25" />
          {referSteps.map((s) => (
            <div key={s.n} className="relative">
              <div className="absolute -left-10 top-4 w-9 h-9 rounded-full bg-[#FF561E] border-[4px] border-white shadow-sm flex items-center justify-center text-white font-bold text-[15px] z-10">{s.n}</div>
              <div className="bg-white rounded-[20px] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-gray-100 flex items-center gap-4">
                <Image src={`/assets/Refer&Earn/${s.img}`} alt={s.title} width={72} height={72} className="object-contain shrink-0" />
                <div className="flex flex-col">
                  <h3 className="text-[15px] font-bold text-[#1A1D20] mb-1">{s.title}</h3>
                  <p className="text-[12.5px] text-[#6B7280] font-medium leading-[1.5]">{s.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 mt-6">
          {[
            { title: 'Instant Credits', icon: <Zap className="w-5 h-5 text-[#FF561E]" strokeWidth={1.5} /> },
            { title: 'Unlimited Referrals', icon: <Users className="w-5 h-5 text-[#FF561E]" strokeWidth={1.5} /> },
            { title: 'Use Anywhere', icon: <Globe className="w-5 h-5 text-[#FF561E]" strokeWidth={1.5} /> },
            { title: 'No Extra Steps', icon: <ShieldCheck className="w-5 h-5 text-[#FF561E]" strokeWidth={1.5} /> },
          ].map((ft, i) => (
            <div key={i} className="flex items-center gap-2.5 bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5">
              <div className="w-9 h-9 rounded-full bg-[#FFF4F0] flex items-center justify-center shrink-0">{ft.icon}</div>
              <span className="text-[13px] font-bold text-[#1A1D20] leading-tight">{ft.title}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Reviews ===== */}
      <section className="w-full pt-12 pb-4">
        <div className="px-5 mb-5 text-center">
          <h2 className="text-[24px] leading-tight font-semibold text-[#1A1D20] tracking-tight mb-2">
            Loved by <span className="text-[#FF561E] font-serif italic font-medium">Travelers</span>
          </h2>
          <p className="text-[13px] text-[#6B7280] font-medium">Real stories from people staying connected worldwide.</p>
        </div>
        <div className="w-full overflow-x-auto hide-scrollbar snap-x snap-mandatory">
          <div className="flex gap-4 px-5 pb-2">
            {reviews.map((r, i) => (
              <div key={i} className="snap-start shrink-0 w-[280px] bg-white rounded-[22px] border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-5 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star key={s} className={`w-4 h-4 ${s < r.rating ? 'text-[#FF561E] fill-[#FF561E]' : 'text-gray-300'}`} strokeWidth={1.5} />
                    ))}
                  </div>
                  <Quote className="w-6 h-6 text-orange-200 fill-orange-200" strokeWidth={1.5} />
                </div>
                <p className="text-[13.5px] leading-[1.65] text-[#374151] mb-5 flex-1">{r.text}</p>
                <div className="flex items-center gap-3 pt-3 border-t border-gray-50">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF561E] to-[#FF7A45] flex items-center justify-center text-white font-bold text-[15px] shrink-0">{r.name.charAt(0)}</div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-[#1A1D20] leading-tight">{r.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={flagUrl(r.flag, 'l')} alt={`${r.country} flag`} className="h-3 w-auto rounded-[2px] border border-gray-100 shrink-0 block" />
                      <span className="text-[11.5px] text-[#6B7280]">{r.country}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Final CTA ===== */}
      <section className="w-full px-5 pt-10 pb-14">
        <div className="w-full rounded-[28px] px-6 py-10 text-center relative overflow-hidden" style={{ background: 'linear-gradient(150deg, #FF561E 0%, #FF7A45 100%)' }}>
          <h2 className="text-[26px] leading-tight font-semibold text-white tracking-tight mb-3">Ready to travel connected?</h2>
          <p className="text-[14px] text-white/90 font-medium mb-7 max-w-[300px] mx-auto">Get your eSIM in seconds and stay online the moment you land.</p>
          <button onClick={handleGetStarted} disabled={startingLoading} className="w-full inline-flex items-center justify-center px-7 py-4 rounded-full bg-white text-[#FF561E] font-bold text-[16px] shadow-lg gap-2 active:scale-[0.98] transition-transform disabled:opacity-80">
            Get Started
            <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="w-full relative bg-[#FF561E] overflow-hidden pt-10 pb-6 font-sans">
        <div className="flex flex-col items-center relative z-10 px-6">
          <div className="relative h-14 w-48 mb-5">
            <Image src="/assets/esim4u-logo.png" alt="eSIM4U" fill className="object-contain brightness-0 invert" />
          </div>

          <div className="flex items-center justify-center gap-5 mb-8">
            <a href="#" aria-label="Instagram" className="text-white active:opacity-80">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="20" x="2" y="2" rx="6" ry="6" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
            </a>
            <a href="#" aria-label="Facebook" className="text-white active:opacity-80">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </a>
            <a href="#" aria-label="X (Twitter)" className="text-white active:opacity-80">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://upload.wikimedia.org/wikipedia/commons/c/ce/X_logo_2023.svg" alt="X (Twitter)" width={18} height={18} className="brightness-0 invert" />
            </a>
            <a href="#" aria-label="TikTok" className="text-white active:opacity-80">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
            </a>
            <a href="#" aria-label="YouTube" className="text-white active:opacity-80">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21.58 6.55a2.76 2.76 0 0 0-1.95-1.96C17.9 4.1 12 4.1 12 4.1s-5.9 0-7.63.49A2.76 2.76 0 0 0 2.42 6.55C1.94 8.28 1.94 12 1.94 12s0 3.72.48 5.45a2.76 2.76 0 0 0 1.95 1.96C6.1 19.9 12 19.9 12 19.9s5.9 0 7.63-.49a2.76 2.76 0 0 0 1.95-1.96C22.06 15.72 22.06 12 22.06 12s0-3.72-.48-5.45zM9.95 15.36V8.64L15.79 12z"/>
              </svg>
            </a>
          </div>

          <div className="grid grid-cols-2 gap-x-10 gap-y-7 text-center mb-8 w-full max-w-[320px]">
            <div className="flex flex-col gap-3">
              <h4 className="font-bold text-[13px] tracking-wide text-white/90">PRODUCT</h4>
              <button onClick={() => goProtected('/dashboard/browse')} className="text-white/90 text-[13px] font-medium">Buy eSIM</button>
              <button onClick={() => scrollToId('m-how')} className="text-white/90 text-[13px] font-medium">How it works</button>
            </div>
            <div className="flex flex-col gap-3">
              <h4 className="font-bold text-[13px] tracking-wide text-white/90">COMPANY</h4>
              <Link href="/about-us" className="text-white/90 text-[13px] font-medium">About us</Link>
              <Link href="/faq" className="text-white/90 text-[13px] font-medium">FAQs</Link>
            </div>
            <div className="flex flex-col gap-3">
              <h4 className="font-bold text-[13px] tracking-wide text-white/90">SUPPORT</h4>
              <Link href="/help-center" className="text-white/90 text-[13px] font-medium">Help Center</Link>
              <Link href="/privacy" className="text-white/90 text-[13px] font-medium">Privacy Policy</Link>
            </div>
            <div className="flex flex-col gap-3">
              <h4 className="font-bold text-[13px] tracking-wide text-white/90">ACCOUNT</h4>
              {authUser ? (
                <>
                  <Link href="/dashboard" className="text-white/90 text-[13px] font-medium">Dashboard</Link>
                  <Link href="/dashboard/profile" className="text-white/90 text-[13px] font-medium">My Profile</Link>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-white/90 text-[13px] font-medium">Log in</Link>
                  <Link href="/signup" className="text-white/90 text-[13px] font-medium">Sign up</Link>
                </>
              )}
            </div>
          </div>

          <div className="w-full max-w-[320px] mb-8">
            <p className="text-white/90 text-[13px] font-medium text-center mb-4">Get travel tips and exclusive offers.</p>
            <div className="relative">
              <input type="email" placeholder="Enter your email" className="w-full pl-4 pr-12 py-3 rounded-full text-[14px] text-[#1A1D20] bg-white outline-none placeholder:text-gray-400 shadow-sm" />
              <button className="absolute right-1 top-1 bottom-1 w-10 bg-[#FF561E] text-white flex items-center justify-center rounded-full shadow-sm" aria-label="Send">
                <ArrowRight className="w-4 h-4 text-white" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          <div className="w-full border-t border-white/20 pt-5 text-center">
            <p className="text-white/80 text-[13px] font-medium">© 2026 eSIM4U. All Rights Reserved</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
