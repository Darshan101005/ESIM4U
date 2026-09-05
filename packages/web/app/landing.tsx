"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Globe, QrCode, Plane, Tag, Zap, ShieldCheck, Headphones, Smartphone, RadioTower, Search, ChevronRight, ChevronLeft, ArrowRight, X, Info, Wifi, Gift, CheckCircle2, XCircle, PhoneCall, Rocket, MapPin, BrickWallFire, Users, Star, Quote } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { flagUrl } from '@/lib/flags';

const Flag = dynamic<any>(() => import('react-flagpack').then(m => m.default || m), { ssr: false });

const carouselItems = [
  { name: 'Australia', image: 'australia.png', iso3: 'AUS', price: '3.99' },
  { name: 'Brazil', image: 'brazil.png', iso3: 'BRA', price: '3.49' },
  { name: 'Canada', image: 'canada.png', iso3: 'CAN', price: '3.99' },
  { name: 'England', image: 'england.png', iso3: 'GBR', price: '3.99' },
  { name: 'France', image: 'france.png', iso3: 'FRA', price: '3.49' },
  { name: 'Japan', image: 'japan.png', iso3: 'JPN', price: '3.49' },
  { name: 'Malaysia', image: 'malaysia.png', iso3: 'MYS', price: '3.49' },
  { name: 'Singapore', image: 'singapore.png', iso3: 'SGP', price: '2.99' },
  { name: 'Switzerland', image: 'switzerland.png', iso3: 'CHE', price: '4.49' },
  { name: 'Turkey', image: 'turkey.png', iso3: 'TUR', price: '3.99' },
  { name: 'UAE', image: 'uae.png', iso3: 'ARE', price: '3.99' },
  { name: 'United States', image: 'usa.png', iso3: 'USA', price: '4.49' },
];

const reviews = [
  {
    name: 'Daniel K.',
    country: 'United Kingdom',
    flag: 'GBR',
    rating: 5,
    text: 'eSIM4U made my trip so much easier! I had internet the moment I landed. Super fast and reliable.',
  },
  {
    name: 'Sophia L.',
    country: 'France',
    flag: 'FRA',
    rating: 4,
    text: 'Installation was quick and easy. Great coverage across Europe, highly recommended!',
  },
  {
    name: 'Yuto M.',
    country: 'Japan',
    flag: 'JPN',
    rating: 5,
    text: 'I used eSIM4U in Japan and it worked perfectly. No SIM swap, no hassle, just seamless connection.',
  },
  {
    name: 'Aarav S.',
    country: 'India',
    flag: 'IND',
    rating: 4,
    text: 'Activated my eSIM before the flight and was online instantly in Delhi. Brilliant service.',
  },
  {
    name: 'Emma W.',
    country: 'Australia',
    flag: 'AUS',
    rating: 5,
    text: 'Used it across three countries on one trip. Switching was effortless and the speed was great.',
  },
  {
    name: 'Marco R.',
    country: 'Italy',
    flag: 'ITA',
    rating: 4,
    text: 'Cheapest data I found for Europe and it just works. I will definitely use eSIM4U again.',
  },
];

const telecomOrbits = [
  {
    radius: 520,
    color: '#fbbf24',
    duration: '120s',
    direction: 'cw',
    size: 76,
    logos: [
      { name: 'Telefonica', image: 'telefonica.png' },
      { name: 'AT&T', image: 'at&t.png' },
      { name: 'Vodafone', image: 'vodofone.png' },
      { name: 'Orange', image: 'orange.png' },
      { name: 'China Mobile', image: 'china mobile.png' },
      { name: 'NTT Docomo', image: 'ntt-docomo.png' },
      { name: 'Telstra', image: 'telstra.png' },
      { name: 'O2', image: 'o2.png' },
    ]
  },
  {
    radius: 380,
    color: '#f97316',
    duration: '90s',
    direction: 'ccw',
    size: 76,
    logos: [
      { name: 'Airtel', image: 'airtel.png' },
      { name: 'Jazz', image: 'jazz.png' },
      { name: 'T-Mobile', image: 't-mobile.png' },
      { name: 'Singtel', image: 'singtel.png' },
      { name: 'Vi', image: 'vi.png' },
      { name: 'Jio', image: 'jio.png' },
    ]
  },
  {
    radius: 240,
    color: '#f43f5e',
    duration: '70s',
    direction: 'cw',
    size: 76,
    logos: [
      { name: 'Cricket', image: 'cricket wireless.png' },
      { name: 'Telenor', image: 'telenor.png' },
      { name: 'EE', image: 'ee.png' },
      { name: 'SoftBank', image: 'softbank.png' },
    ]
  }
];

const plansComparison = [
  {
    feature: 'Global Coverage',
    subFeature: 'Countries & Regions',
    icon: <Globe className="w-6 h-6 text-[#FF561E]" strokeWidth={1.5} />,
    tooltip: true,
    esim4u: { primary: '200+', secondary: 'Countries', type: 'check' },
    airalo: { primary: '200+', secondary: 'Countries', type: 'check' },
    holafly: { primary: '160+', secondary: 'Countries', type: 'check' },
    saily: { primary: '150+', secondary: 'Countries', type: 'check' }
  },
  {
    feature: '24/7 Customer Support',
    subFeature: 'Live Chat Support',
    icon: <Headphones className="w-6 h-6 text-[#FF561E]" strokeWidth={1.5} />,
    tooltip: true,
    esim4u: { primary: '24/7', secondary: 'Live Chat', type: 'check' },
    airalo: { primary: '24/7', secondary: 'Live Chat', type: 'check' },
    holafly: { primary: '24/7', secondary: 'Live Chat', type: 'check' },
    saily: { primary: '24/7', secondary: 'Live Chat', type: 'check' }
  },
  {
    feature: 'Money Back Guarantee',
    subFeature: 'Hassle-free Refunds',
    icon: <ShieldCheck className="w-6 h-6 text-[#FF561E]" strokeWidth={1.5} />,
    tooltip: true,
    esim4u: { primary: '30 Days', secondary: 'Money Back Guarantee', type: 'check' },
    airalo: { primary: '7 Days', secondary: 'Money Back', type: 'check' },
    holafly: { primary: '7 Days', secondary: 'Money Back', type: 'check' },
    saily: { primary: '7 Days', secondary: 'Money Back', type: 'check' }
  },
  {
    feature: 'Share Your Connection',
    subFeature: 'Use eSIM on Hotspot',
    icon: <Wifi className="w-6 h-6 text-[#FF561E]" strokeWidth={1.5} />,
    tooltip: true,
    esim4u: { primary: 'Yes', secondary: 'Share Hotspot\nwith Others', type: 'check' },
    airalo: { primary: 'Yes', secondary: 'Share Hotspot\nwith Others', type: 'check' },
    holafly: { primary: 'Yes', secondary: 'Share Hotspot\nwith Others', type: 'check' },
    saily: { primary: 'No', secondary: 'Hotspot not\nsupported', type: 'cross' }
  },
  {
    feature: 'Free VPN Access',
    subFeature: 'For Users Facing Restrictions\n(e.g. WhatsApp Calls)',
    icon: <Gift className="w-6 h-6 text-[#FF561E]" strokeWidth={1.5} />,
    tooltip: false,
    esim4u: { primary: 'Yes', secondary: 'Free VPN for users who\nhave trouble making\nWhatsApp calls', type: 'check' },
    airalo: { primary: 'No', secondary: 'VPN not\nincluded', type: 'cross' },
    holafly: { primary: 'No', secondary: 'VPN not\nincluded', type: 'cross' },
    saily: { primary: 'No', secondary: 'VPN not\nincluded', type: 'cross' }
  }
];

export default function Landing() {
  const howRef = useRef<HTMLDivElement>(null);
  const whyRef = useRef<HTMLDivElement>(null);
  const coverageRef = useRef<HTMLDivElement>(null);
  const [howVisible, setHowVisible] = useState(false);
  const [whyVisible, setWhyVisible] = useState(false);
  const [coverageVisible, setCoverageVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'Countries' | 'Regions' | 'Global'>('Countries');
  const [locationsFolder, setLocationsFolder] = useState('Locations');
  const [startingLoading, setStartingLoading] = useState(false);
  const [landingPrices, setLandingPrices] = useState<{ countries: Record<string, number | null>; regions: Record<string, number | null>; global: number | null } | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/landing-prices')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d && !d.error) setLandingPrices(d); })
      .catch(() => {});
  }, []);

  const priceText = useCallback(
    (val: number | null | undefined) => {
      if (!landingPrices) {
        return <span className="skeleton inline-block h-[14px] w-[78px] rounded align-middle" />;
      }
      if (val == null) return "From US$—";
      return `From US$${val.toFixed(2)}`;
    },
    [landingPrices]
  );

  const goProtected = useCallback(async (target: string) => {
    try {
      const result = await authClient.getSession();
      const session = (result as { data?: { user?: unknown } | null })?.data;
      router.push(session?.user ? target : `/login?redirect=${encodeURIComponent(target)}`);
    } catch {
      router.push(`/login?redirect=${encodeURIComponent(target)}`);
    }
  }, [router]);

  const reviewsRef = useRef<HTMLDivElement>(null);
  const scrollReviews = useCallback((dir: number) => {
    reviewsRef.current?.scrollBy({ left: dir * 330, behavior: 'smooth' });
  }, []);

  const scrollToId = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

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
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const carouselViewportRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const resumeTimeoutRef = useRef<number | null>(null);
  const isPointerInsideCarousel = useRef(false);
  const isCarouselFocused = useRef(false);
  const isUserInteracting = useRef(false);

  const loopedCarouselItems = useMemo(
    () => [...carouselItems, ...carouselItems],
    []
  );

  const getCarouselMetrics = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return { step: 0, setWidth: 0 };
    const cards = el.querySelectorAll<HTMLElement>('.dest-card');
    const step = cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : cards[0]?.offsetWidth ?? 0;
    return { step, setWidth: step * carouselItems.length };
  }, []);

  const jumpToCarouselSet = useCallback((setIndex = 1) => {
    const el = carouselRef.current;
    const { setWidth } = getCarouselMetrics();
    if (!el || !setWidth) return;
    el.scrollTo({ left: setWidth * setIndex, behavior: 'auto' });
  }, [getCarouselMetrics]);

  const normalizeCarouselPosition = useCallback(() => {
    const el = carouselRef.current;
    const { setWidth } = getCarouselMetrics();
    if (!el || !setWidth) return;
    if (el.scrollLeft >= setWidth) {
      el.scrollTo({ left: el.scrollLeft - setWidth, behavior: 'auto' });
    } else if (el.scrollLeft < 0) {
      el.scrollTo({ left: el.scrollLeft + setWidth, behavior: 'auto' });
    }
  }, [getCarouselMetrics]);

  const clearResumeTimeout = useCallback(() => {
    if (resumeTimeoutRef.current) {
      window.clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }
  }, []);

  const releaseCarouselFocus = useCallback(() => {
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) activeElement.blur();
    isCarouselFocused.current = false;
  }, []);

  const startAutoScroll = useCallback(() => {
    if (animationRef.current) return;
    const animate = () => {
      const el = carouselRef.current;
      if (el && !isPointerInsideCarousel.current && !isCarouselFocused.current && !isUserInteracting.current) {
        el.scrollLeft += 0.55;
        normalizeCarouselPosition();
      }
      animationRef.current = window.requestAnimationFrame(animate);
    };
    animationRef.current = window.requestAnimationFrame(animate);
  }, [normalizeCarouselPosition]);

  const stopAutoScroll = useCallback(() => {
    if (animationRef.current) {
      window.cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  const resumeAfterUserAction = useCallback(() => {
    clearResumeTimeout();
    resumeTimeoutRef.current = window.setTimeout(() => {
      isUserInteracting.current = false;
      if (!isPointerInsideCarousel.current && !isCarouselFocused.current) startAutoScroll();
    }, 1200);
  }, [clearResumeTimeout, startAutoScroll]);

  const pauseForUserAction = useCallback(() => {
    isUserInteracting.current = true;
    stopAutoScroll();
    resumeAfterUserAction();
  }, [resumeAfterUserAction, stopAutoScroll]);

  const scrollNext = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    pauseForUserAction();
    releaseCarouselFocus();
    normalizeCarouselPosition();
    const { step } = getCarouselMetrics();
    if (step) el.scrollBy({ left: step, behavior: 'smooth' });
  }, [getCarouselMetrics, normalizeCarouselPosition, pauseForUserAction, releaseCarouselFocus]);

  const scrollPrev = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    pauseForUserAction();
    releaseCarouselFocus();
    normalizeCarouselPosition();
    const { step, setWidth } = getCarouselMetrics();
    if (setWidth && el.scrollLeft <= step) {
      el.scrollTo({ left: el.scrollLeft + setWidth, behavior: 'auto' });
    }
    if (step) el.scrollBy({ left: -step, behavior: 'smooth' });
  }, [getCarouselMetrics, normalizeCarouselPosition, pauseForUserAction, releaseCarouselFocus]);

  const handleCarouselPointerEnter = useCallback(() => {
    isPointerInsideCarousel.current = true;
    clearResumeTimeout();
    stopAutoScroll();
  }, [clearResumeTimeout, stopAutoScroll]);

  const handleCarouselPointerLeave = useCallback(() => {
    isPointerInsideCarousel.current = false;
    if (!isUserInteracting.current && !isCarouselFocused.current) {
      resumeTimeoutRef.current = window.setTimeout(() => {
        if (!isPointerInsideCarousel.current && !isCarouselFocused.current) startAutoScroll();
      }, 1200);
    } else {
      resumeAfterUserAction();
    }
  }, [resumeAfterUserAction, startAutoScroll]);

  useEffect(() => {
    const handleResize = () => jumpToCarouselSet();
    const frame = window.requestAnimationFrame(() => jumpToCarouselSet());
    startAutoScroll();
    window.addEventListener('resize', handleResize);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', handleResize);
      clearResumeTimeout();
      stopAutoScroll();
    };
  }, [clearResumeTimeout, jumpToCarouselSet, startAutoScroll, stopAutoScroll]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            if (entry.target === howRef.current) setHowVisible(true);
            if (entry.target === whyRef.current) setWhyVisible(true);
            if (entry.target === coverageRef.current) setCoverageVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );
    if (howRef.current) observer.observe(howRef.current);
    if (whyRef.current) observer.observe(whyRef.current);
    if (coverageRef.current) observer.observe(coverageRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'o') {
        setLocationsFolder(prev => prev === 'Locations' ? 'Locations1' : 'Locations');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen w-full bg-white font-sans flex flex-col">
      <div className="h-screen w-full relative overflow-hidden flex flex-col shrink-0">
        <div className="absolute inset-0 z-0 pointer-events-none flex justify-end overflow-hidden">
          <div className="relative w-full h-full max-w-[1920px]">
            <Image
              src="/assets/hero-section.png"
              alt="Hero background"
              fill
              priority
              className="object-contain object-right"
              quality={100}
            />
          </div>
        </div>

        <div className="w-full px-5 sm:px-8 md:px-12 xl:px-16 pt-5 sm:pt-8 flex items-center justify-between relative z-50">
          <div className="flex-1 flex justify-start">
            <Link href="/" className="flex items-center">
              <Image 
                src="/assets/esim4u-logo.png" 
                alt="eSIM4U Logo" 
                width={140} 
                height={42}
                className="object-contain w-[110px] sm:w-[140px]"
                priority
              />
            </Link>
          </div>

          <div className="hidden lg:flex h-[56px] bg-white/60 backdrop-blur-xl rounded-full shadow-[0_4px_24px_rgb(0,0,0,0.06)] border border-white/60 items-center px-8">
            <nav className="flex items-center gap-8 text-[14px] font-medium text-[#1A1D20]">
              <Link href="/" className="relative text-[#FF561E]">
                Home
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-[2.5px] bg-[#FF561E] rounded-full"></span>
              </Link>
              <button onClick={() => scrollToId('comparison')} className="hover:text-[#FF561E] transition-colors">Features</button>
              <button onClick={() => scrollToId('destinations')} className="hover:text-[#FF561E] transition-colors">Destinations</button>
              <button onClick={() => scrollToId('how-it-works')} className="hover:text-[#FF561E] transition-colors">How It Works</button>
              <Link href="/about-us" className="hover:text-[#FF561E] transition-colors">About Us</Link>
              <Link href="/faq" className="hover:text-[#FF561E] transition-colors">FAQs</Link>
            </nav>
          </div>

          <div className="flex-1 flex justify-end">
            <div className="flex items-center gap-3">
              <Link href="/login" className="px-6 py-2.5 rounded-full bg-white/80 backdrop-blur-sm border border-gray-100 text-[#FF561E] font-semibold text-[14px] hover:bg-white hover:scale-105 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(255,86,30,0.15)] hover:border-orange-100 transition-all duration-300 shadow-sm">
                Log in
              </Link>
              <Link href="/signup" className="px-6 py-2.5 rounded-full bg-[#FF561E] text-white font-semibold text-[14px]  hover:scale-105 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(255,86,30,0.35)] transition-all duration-300 shadow-lg shadow-orange-500/20">
                Sign up
              </Link>
            </div>
          </div>
        </div>

        <main className="flex-grow w-full px-5 sm:px-8 md:px-12 xl:px-16 flex items-center relative z-10 pb-10 sm:pb-20">
          <div className="w-full max-w-[650px] z-20 relative">
            <div className="inline-flex items-center px-4 sm:px-5 py-2 rounded-full bg-orange-50 border border-orange-100 shadow-[0_2px_10px_rgb(0,0,0,0.03)] mb-5 sm:mb-8">
              <span className="text-[#FF561E] text-[12px] sm:text-[13px] font-semibold tracking-wide">Global Travel eSIM</span>
            </div>
            
            <h1 className="text-[36px] sm:text-[44px] md:text-[54px] lg:text-[70px] leading-[1.12] font-medium text-[#1A1D20] tracking-[-0.02em] mb-4 sm:mb-6">
              Stay Connected<br />
              <span className="whitespace-nowrap">
                Everywhere, <span className="text-[#FF561E] font-serif italic font-normal tracking-normal sm:pr-4">Anytime.</span>
              </span>
            </h1>
            
            <p className="text-[15px] sm:text-[18px] lg:text-[20px] leading-[1.6] text-[#6B7280] mb-7 sm:mb-10 font-medium max-w-[420px]">
              Travel smarter with instant eSIM activation<br className="hidden sm:block" />
              in 200+ countries worldwide.
            </p>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <button onClick={handleGetStarted} disabled={startingLoading} className="inline-flex items-center justify-center px-7 sm:px-9 py-3.5 sm:py-4 rounded-full bg-[#FF561E] text-white font-semibold text-[15px] sm:text-[16px]  transition-all shadow-xl shadow-orange-500/25 gap-2 group disabled:opacity-80">
                Get Started
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform transition-transform group-hover:translate-x-1">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button onClick={() => scrollToId('where-next')} className="inline-flex items-center justify-center px-7 sm:px-9 py-3.5 sm:py-4 rounded-full bg-white/90 backdrop-blur-md text-[#FF561E] font-semibold text-[15px] sm:text-[16px] hover:bg-white transition-all border border-gray-200 shadow-sm gap-2 group">
                Explore Plans
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform transition-transform group-hover:translate-x-1">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </main>
      </div>

      <section
        className="min-h-screen shrink-0 w-full px-5 sm:px-8 md:px-12 xl:px-16 mt-12 sm:mt-20 md:mt-32 pb-16 sm:pb-24 bg-white flex flex-col items-center justify-center relative"
      >
        <div className="w-full max-w-[1400px] flex flex-col gap-14 sm:gap-20 xl:gap-24">
          
          <div ref={howRef} id="how-it-works" className="scroll-mt-28 flex flex-col lg:flex-row gap-10 lg:gap-6 items-center lg:items-start w-full relative">
            <div 
              className={`w-full lg:w-[40%] flex flex-col justify-center pt-2 md:pt-4 xl:pt-8 pr-0 lg:pr-8 transition-all duration-[800ms] ease-out ${
                howVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
              }`}
            >
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-orange-50 border border-orange-100 mb-6 w-max">
                <span className="text-[#FF561E] text-[13px] font-semibold">How eSIM4U Works</span>
              </div>
              <h2 className="text-[28px] sm:text-[36px] md:text-[46px] xl:text-[50px] leading-[1.12] font-semibold text-[#1A1D20] tracking-tight mb-5">
                Travel Connected in<br />
                <span className="text-[#FF561E] font-serif italic font-medium lining-nums tracking-normal">3 Simple Steps</span>
              </h2>
              <p className="text-[17px] leading-[1.6] text-[#6B7280] font-medium max-w-[340px]">
                Get started in minutes and enjoy seamless connectivity wherever you go.
              </p>
            </div>

            <div className="w-full lg:w-[60%] flex flex-col sm:flex-row gap-5 relative pt-10 sm:pt-14 lg:pt-[60px]">
              {[
                {
                  step: '01',
                  title: 'Choose Destination',
                  desc: 'Select your destination and pick the perfect eSIM plan for your trip.',
                  icon: <Globe className="w-10 h-10 text-[#FF561E]" strokeWidth={1.5} />
                },
                {
                  step: '02',
                  title: 'Scan & Install',
                  desc: 'Receive your eSIM QR code instantly and install it in just a few taps.',
                  icon: <QrCode className="w-10 h-10 text-[#FF561E]" strokeWidth={1.5} />
                },
                {
                  step: '03',
                  title: 'Connect & Go',
                  desc: 'Turn on your eSIM and stay connected the moment you land.',
                  icon: <Plane className="w-10 h-10 text-[#FF561E]" strokeWidth={1.5} />
                }
              ].map((item, index) => (
                <div 
                  key={index} 
                  className="group flex-1 mt-2 sm:mt-0 relative flex flex-col items-center"
                >
                  {index < 2 && (
                    <div 
                      className={`hidden sm:block absolute top-[-45px] left-[calc(50%+32px)] w-[calc(100%-54px)] h-[44px] pointer-events-none z-10 overflow-visible transition-all duration-[800ms] ease-out ${
                        howVisible ? 'opacity-100' : 'opacity-0'
                      }`}
                      style={{ transitionDelay: `${(index * 400) + 400}ms` }}
                    >
                      <svg width="100%" height="100%" viewBox="0 0 100 40" preserveAspectRatio="none" className="overflow-visible">
                        <path 
                          d="M 5,34 Q 50,-15 95,34" 
                          fill="none" 
                          stroke="#FF561E" 
                          strokeWidth="1.5"
                          strokeDasharray="4 4"
                          vectorEffect="non-scaling-stroke"
                          markerEnd={`url(#tiny-arrow-${index})`}
                        />
                        <defs>
                          <marker id={`tiny-arrow-${index}`} viewBox="0 0 8 8" markerWidth="6" markerHeight="6" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse">
                            <path d="M 0 1 L 7 4 L 0 7 z" fill="#FF561E" />
                          </marker>
                        </defs>
                      </svg>
                    </div>
                  )}

                  <div 
                    className={`w-full relative transition-all duration-[800ms] ease-out ${
                      howVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                    }`}
                    style={{ transitionDelay: `${(index * 400) + 100}ms` }}
                  >
                    <div className="absolute left-1/2 -translate-x-1/2 -top-7 sm:-top-9 bg-[#FF561E] w-14 h-14 rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(255,86,30,0.2)] border border-[#FF561E] z-20 transition-all duration-300 group-hover:-translate-y-1 group-hover:bg-white group-hover:border-orange-50 group-hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
                      <span className="text-white font-bold text-[19px] transition-colors duration-300 group-hover:text-[#FF561E]">{item.step}</span>
                    </div>

                    <div className="w-full bg-white rounded-[24px] p-6 lg:p-7 pt-10 sm:pt-12 shadow-[0px_8px_30px_rgba(0,0,0,0.03)] border border-gray-100 flex flex-col items-center text-center relative z-10 transition-transform duration-300 group-hover:-translate-y-2 cursor-pointer">
                      <div className="w-[80px] h-[80px] aspect-square rounded-[24px] bg-[#FFF4F0] flex items-center justify-center mb-6 shrink-0 transition-colors duration-300 group-hover:bg-[#ffece4]">
                        {item.icon}
                      </div>
                      <h3 className="text-[17px] font-bold text-[#1A1D20] mb-3">{item.title}</h3>
                      <p className="text-[14px] leading-[1.6] text-[#6B7280] font-medium leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div 
            ref={whyRef}
            id="features"
            className={`scroll-mt-28 w-full bg-[#FFF4F0] rounded-[24px] sm:rounded-[40px] px-5 py-10 sm:px-8 sm:py-12 md:py-16 md:px-16 text-center shadow-sm transition-all duration-[1000ms] ease-out ${
              whyVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
            }`}
          >
            <h2 className="text-[24px] sm:text-[32px] md:text-[36px] font-semibold text-[#1A1D20] mb-8 sm:mb-14 tracking-tight">
              Why Travelers Choose <span className="text-[#FF561E] font-serif italic font-medium lining-nums tracking-normal">eSIM4U</span>
            </h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-6 gap-x-6 sm:gap-x-8 gap-y-8 sm:gap-y-12">
              {[
                { title: 'Global Coverage', desc: 'Stay connected in 200+ countries with reliable networks.', icon: <Globe className="w-[30px] h-[30px] text-[#FF561E]" strokeWidth={2} /> },
                { title: 'Affordable Plans', desc: 'Flexible and budget-friendly plans for every traveler.', icon: <Tag className="w-[30px] h-[30px] text-[#FF561E]" strokeWidth={2} /> },
                { title: 'Instant Activation', desc: 'Get your eSIM in seconds and connect in minutes.', icon: <Zap className="w-[30px] h-[30px] text-[#FF561E]" strokeWidth={2} /> },
                { title: 'Secure & Reliable', desc: 'Your connection is protected with trusted global partners.', icon: <ShieldCheck className="w-[30px] h-[30px] text-[#FF561E]" strokeWidth={2} /> },
                { title: '24/7 Support', desc: 'Our support team is always here to help you anytime.', icon: <Headphones className="w-[30px] h-[30px] text-[#FF561E]" strokeWidth={2} /> },
                { title: 'eSIM Compatible', desc: 'Works with 99% of eSIM-enabled devices worldwide.', icon: <Smartphone className="w-[30px] h-[30px] text-[#FF561E]" strokeWidth={2} /> }
              ].map((feature, index) => (
                <div 
                  key={index} 
                  className={`flex flex-col items-center transition-all duration-[600ms] ease-out ${
                    whyVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                  style={{ transitionDelay: `${200 + (index * 150)}ms` }}
                >
                  <div className="w-[68px] h-[68px] rounded-full bg-white shadow-sm border border-orange-50 flex items-center justify-center mb-5 hover:scale-105 transition-transform cursor-default">
                    {feature.icon}
                  </div>
                  <h3 className="text-[17px] font-bold text-[#1A1D20] mb-2">{feature.title}</h3>
                  <p className="text-[14px] leading-[1.6] text-[#6B7280] font-medium">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      <section id="coverage" className="scroll-mt-24 w-full px-5 sm:px-8 md:px-12 xl:px-16 pt-4 pb-8 md:pt-6 md:pb-12 bg-white flex flex-col items-center justify-center relative">
        <div ref={coverageRef} className="w-full max-w-[1400px] flex flex-col lg:flex-row gap-16 lg:gap-4 items-center justify-between lg:justify-center">
          
          <div 
            className={`w-full lg:w-[35%] flex flex-col justify-center transition-all duration-[800ms] ease-out ${
              coverageVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
            }`}
          >
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-orange-50 border border-orange-100 mb-6 w-max">
              <span className="text-[#FF561E] text-[13px] font-semibold">Global Coverage</span>
            </div>
            
            <h2 className="text-[28px] sm:text-[36px] md:text-[46px] xl:text-[54px] leading-[1.12] font-semibold text-[#1A1D20] tracking-tight mb-5">
              Stay Connected in<br />
              <span className="text-[#FF561E] font-serif italic font-medium lining-nums tracking-normal">200+ Countries</span>
            </h2>
            
            <p className="text-[17px] leading-[1.6] text-[#6B7280] font-medium max-w-[420px] mb-12">
              Enjoy reliable and high-speed data coverage in 200+ countries and regions around the world.
            </p>
            
            <div className="flex items-center gap-6 sm:gap-10 md:gap-14">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-[#FFF4F0] flex items-center justify-center mb-4">
                  <Globe className="w-[22px] h-[22px] text-[#FF561E]" strokeWidth={2.5} />
                </div>
                <span className="text-[22px] font-bold text-[#FF561E] mb-1 leading-none">200+</span>
                <span className="text-[14px] text-[#6B7280] font-medium text-center">Countries</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-[#FFF4F0] flex items-center justify-center mb-4">
                  <RadioTower className="w-[22px] h-[22px] text-[#FF561E]" strokeWidth={2.5} />
                </div>
                <span className="text-[22px] font-bold text-[#FF561E] mb-1 leading-none">500+</span>
                <span className="text-[14px] text-[#6B7280] font-medium text-center">Networks</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-[#FFF4F0] flex items-center justify-center mb-4">
                  <Zap className="w-[22px] h-[22px] text-[#FF561E]" strokeWidth={2.5} />
                </div>
                <span className="text-[22px] font-bold text-[#FF561E] mb-1 leading-none">4G/5G</span>
                <span className="text-[14px] text-[#6B7280] font-medium text-center">High Speed</span>
              </div>
            </div>
          </div>

          <div 
            className={`w-full lg:w-[65%] relative flex justify-center lg:justify-end transition-all duration-[1000ms] ease-out ${
              coverageVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'
            }`}
            style={{ transitionDelay: '200ms' }}
          >
            <div className="relative w-full max-w-[1000px] aspect-[16/11]">
              <Image 
                src="/assets/continets.gif" 
                alt="Global Coverage Map" 
                fill 
                className="object-contain mix-blend-multiply"
                unoptimized
              />
            </div>
          </div>

        </div>
      </section>

      <section id="destinations" className="scroll-mt-24 w-full px-4 md:px-6 xl:px-8 pt-0 pb-4 md:pt-0 md:pb-6 bg-white flex flex-col items-center justify-center relative">
        <div className="w-full max-w-[1400px] flex flex-col items-center">
          <h2 className="text-[28px] sm:text-[36px] md:text-[46px] xl:text-[54px] leading-[1.12] font-semibold text-[#1A1D20] mb-3 sm:mb-5 tracking-tight text-center px-2">
            Browse Popular <span className="text-[#FF561E] font-serif italic font-medium pr-1">Destinations</span>
          </h2>
          <p className="text-[16px] text-[#6B7280] font-medium mb-3 text-center">
            Choose from our most popular travel destinations and get connected instantly.
          </p>

          <div
            className="w-full max-w-[1380px] relative flex items-center"
            onFocusCapture={() => { isCarouselFocused.current = true; stopAutoScroll(); }}
            onBlurCapture={() => { isCarouselFocused.current = false; isUserInteracting.current = false; if (!isPointerInsideCarousel.current) resumeAfterUserAction(); }}
            onPointerEnter={handleCarouselPointerEnter}
            onPointerLeave={handleCarouselPointerLeave}
          >
            <button onClick={scrollPrev} className="absolute left-0 lg:left-1 w-10 h-10 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center z-10 hover:bg-gray-50 transition-colors">
              <ChevronLeft className="w-5 h-5 text-[#FF561E]" />
            </button>

            <div ref={carouselViewportRef} className="w-full overflow-hidden px-12 md:px-14">
              <div
                ref={carouselRef}
                onScroll={normalizeCarouselPosition}
                className="w-full overflow-x-auto hide-scrollbar flex gap-6 py-2"
              >
                {loopedCarouselItems.map((dest, i) => (
                  <div
                    key={`${dest.name}-${i}`}
                    onClick={() => goProtected(`/dashboard/browse/${dest.iso3}?name=${encodeURIComponent(dest.name)}`)}
                    className="dest-card flex-shrink-0 w-[calc((100%_-_24px)/2)] sm:w-[calc((100%_-_48px)/3)] md:w-[calc((100%_-_72px)/4)] lg:w-[calc((100%_-_120px)/6)] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col group cursor-pointer transition-transform duration-300 hover:translate-y-[-6px] hover:scale-[1.03]"
                  >
                    <div className="relative w-full aspect-square bg-[#FFF4F0] flex items-center justify-center">
                      <Image src={`/assets/${locationsFolder}/${dest.image}`} alt={dest.name} fill className="object-contain" />
                    </div>
                    <div className="p-4 flex flex-col">
                      <h3 className="text-[16px] font-bold text-[#1A1D20] mb-1">{dest.name}</h3>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[13px] text-[#FF561E] font-semibold">{priceText(landingPrices?.countries[dest.iso3])}</span>
                        <ArrowRight className="w-4 h-4 text-[#FF561E]" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={scrollNext} className="absolute right-0 lg:right-1 w-10 h-10 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center z-10 hover:bg-gray-50 transition-colors">
              <ChevronRight className="w-5 h-5 text-[#FF561E]" />
            </button>
          </div>
        </div>
      </section>

      <section id="where-next" className="scroll-mt-4 w-full px-4 sm:px-8 md:px-12 xl:px-16 pb-8 flex flex-col items-center justify-center relative">
        <div className="w-full max-w-[1400px] bg-[#FFF4F0] rounded-[24px] sm:rounded-[40px] px-4 py-8 sm:px-8 sm:py-12 md:py-16 md:px-12 flex flex-col items-center">
          <h2 className="text-[24px] sm:text-[32px] md:text-[36px] font-semibold text-[#1A1D20] mb-3 tracking-tight text-center">
            Where are you traveling <span className="text-[#FF561E] font-serif italic font-medium pr-1">next?</span>
          </h2>
          <p className="text-[16px] text-[#6B7280] font-medium mb-10 text-center">
            Choose your destination first, then a data plan according to your needs.
          </p>

          <div className="w-full max-w-[1000px] flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
            <div className="flex items-center bg-white rounded-full p-1.5 shadow-sm border border-orange-50 w-full md:w-auto overflow-x-auto hide-scrollbar">
              <button onClick={() => setActiveTab('Countries')} className={`px-6 py-2 rounded-full font-semibold text-[14px] shadow-sm whitespace-nowrap transition-colors ${activeTab === 'Countries' ? 'bg-[#FF561E] text-white' : 'text-[#1A1D20] hover:bg-gray-50'}`}>Countries</button>
              <button onClick={() => setActiveTab('Regions')} className={`px-6 py-2 rounded-full font-medium text-[14px] whitespace-nowrap transition-colors ${activeTab === 'Regions' ? 'bg-[#FF561E] text-white shadow-sm' : 'text-[#1A1D20] hover:bg-gray-50'}`}>Regions</button>
              <button onClick={() => setActiveTab('Global')} className={`px-6 py-2 rounded-full font-medium text-[14px] whitespace-nowrap transition-colors ${activeTab === 'Global' ? 'bg-[#FF561E] text-white shadow-sm' : 'text-[#1A1D20] hover:bg-gray-50'}`}>Global</button>
            </div>

            <div className="relative w-full md:w-[320px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder={`Search ${activeTab.toLowerCase()}`} 
                className="w-full pl-11 pr-4 py-3 rounded-full bg-white border border-gray-100 shadow-sm outline-none focus:border-[#FF561E] focus:ring-1 focus:ring-[#FF561E]/20 text-[14px] transition-all"
              />
            </div>
          </div>

          <div className="w-full max-w-[1000px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 mb-12">
            {activeTab === 'Countries' && [
              { name: 'India', flag: 'IN', iso3: 'IND', price: '3.99' },
              { name: 'United Kingdom', flag: 'GBR', iso3: 'GBR', price: '4.49' },
              { name: 'Greece', flag: 'GR', iso3: 'GRC', price: '4.49' },
              { name: 'Turkey', flag: 'TR', iso3: 'TUR', price: '3.99' },
              { name: 'Germany', flag: 'DE', iso3: 'DEU', price: '4.49' },
              { name: 'Switzerland', flag: 'CH', iso3: 'CHE', price: '4.49' },
              { name: 'France', flag: 'FR', iso3: 'FRA', price: '3.99' },
              { name: 'Italy', flag: 'IT', iso3: 'ITA', price: '3.99' },
              { name: 'Netherlands', flag: 'NL', iso3: 'NLD', price: '3.99' },
              { name: 'Spain', flag: 'ES', iso3: 'ESP', price: '3.99' },
              { name: 'Portugal', flag: 'PT', iso3: 'PRT', price: '3.99' },
              { name: 'United States', flag: 'US', iso3: 'USA', price: '4.49' },
              { name: 'Thailand', flag: 'TH', iso3: 'THA', price: '3.99' },
              { name: 'Indonesia', flag: 'ID', iso3: 'IDN', price: '3.99' },
              { name: 'South Korea', flag: 'KR', iso3: 'KOR', price: '4.49' },
            ].map((country, i) => (
              <div key={i} onClick={() => goProtected(`/dashboard/browse/${country.iso3}?name=${encodeURIComponent(country.name)}`)} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-9 rounded-md overflow-hidden border border-gray-100 shrink-0 relative">
                    <Flag code={country.flag} size="l" hasBorder={false} hasBorderRadius={false} className="country-flag" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[15px] font-bold text-[#1A1D20]">{country.name}</span>
                    <span className="text-[13px] text-[#FF561E] font-medium">{priceText(landingPrices?.countries[country.iso3])}</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#FF561E] transition-colors" />
              </div>
            ))}
            
            {activeTab === 'Regions' && [
              { name: 'North America', image: 'north america_map.png', code: 'na', price: '4.49' },
              { name: 'Europe', image: 'europe_map.png', code: 'eu', price: '4.49' },
              { name: 'Asia', image: 'asia_map.png', code: 'as', price: '4.49' },
              { name: 'Africa', image: 'africa_map.png', code: 'af', price: '3.99' },
              { name: 'Middle East & North Africa', image: 'middle east &north africa_map.png', code: 'me', price: '3.99' },
              { name: 'South America', image: 'southamerica_map.png', code: 'sa', price: '4.49' },
            ].map((region, i) => (
              <div key={i} onClick={() => goProtected(`/dashboard/browse/region/${region.code}?name=${encodeURIComponent(region.name)}`)} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-[54px] h-[36px] rounded-md overflow-hidden border border-gray-100 shrink-0 relative bg-[#FFF4F0]">
                    <Image src={`/assets/Regions/${region.image}`} alt={region.name} fill className="object-cover" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[15px] font-bold text-[#1A1D20]">{region.name}</span>
                    <span className="text-[13px] text-[#FF561E] font-medium">{priceText(landingPrices?.regions[region.code])}</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#FF561E] transition-colors" />
              </div>
            ))}

            {activeTab === 'Global' && [
              { name: 'Global', image: 'world_map.png', price: '6.99', desc: '130+ countries' },
            ].map((region, i) => (
              <div key={i} onClick={() => goProtected('/dashboard/browse?tab=global')} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-[54px] h-[36px] rounded-md overflow-hidden border border-gray-100 shrink-0 relative bg-[#FFF4F0]">
                    <Image src={`/assets/Regions/${region.image}`} alt={region.name} fill className="object-cover" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[15px] font-bold text-[#1A1D20]">{region.name}</span>
                    <span className="text-[13px] text-[#FF561E] font-medium">{priceText(landingPrices?.global)}</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#FF561E] transition-colors" />
              </div>
            ))}
          </div>

          <button onClick={() => goProtected('/dashboard/browse')} className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-transparent border border-[#FF561E] text-[#FF561E] font-semibold text-[15px] hover:bg-[#FF561E] hover:text-white transition-all gap-2 group">
            View all destinations
            <ArrowRight className="w-4 h-4 transform transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </section>

      <section className="hidden lg:flex w-full bg-white overflow-hidden min-h-[820px] relative flex-col items-center pt-10 mt-6 pb-20">
        <div className="z-10 flex flex-col items-center mb-24 px-4">
          <h2 className="text-[40px] md:text-[54px] xl:text-[60px] leading-[1.05] font-semibold text-[#05070A] tracking-tight text-center mb-4">
            Global eSIM <span className="text-[#FF561E] font-serif italic font-normal tracking-normal">Connectivity</span>
          </h2>
          <p className="text-[16px] md:text-[18px] text-[#5E6673] font-medium text-center max-w-[600px]">
            Seamlessly connect to top telecom providers around the world.
          </p>
        </div>

        <div className="absolute bottom-[20px] left-1/2 -translate-x-1/2 w-[980px] h-[400px] pointer-events-none z-0" style={{ background: 'radial-gradient(50% 50% at 50% 50%, rgba(251, 146, 60, 0.32) 0%, rgba(251, 146, 60, 0) 100%)' }}></div>

        <div className="absolute bottom-[40px] left-1/2 w-0 h-0 z-10">
          <svg className="absolute left-[-600px] bottom-[-600px] w-[1200px] h-[1200px] overflow-visible pointer-events-none">
            {telecomOrbits.map((orbit) => (
              <circle
                key={orbit.radius}
                cx="600"
                cy="600"
                r={orbit.radius}
                stroke={orbit.color}
                strokeDasharray="6 8"
                strokeWidth="1.2"
                fill="none"
                opacity="0.5"
              />
            ))}
          </svg>

          {telecomOrbits.map((orbit, orbitIndex) => {
            const totalElements = orbit.logos.length * 2;
            const elements = [];
            for (let i = 0; i < totalElements; i++) {
              const angle = (i * (Math.PI * 2)) / totalElements - Math.PI / 2;
              const x = orbit.radius * Math.cos(angle);
              const y = orbit.radius * Math.sin(angle);
              const isDot = i % 2 !== 0;
              const logoIndex = Math.floor(i / 2);
              const logo = orbit.logos[logoIndex];

              elements.push(
                <div 
                  key={i}
                  className="absolute"
                  style={{
                    left: `${x}px`,
                    top: `${y}px`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  {isDot ? (
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: orbit.color }}></div>
                  ) : (
                    <div
                      className={`orbit-item-counter-${orbit.direction} flex flex-col items-center gap-2.5`}
                      style={{ animationDuration: orbit.duration }}
                    >
                      <div
                        className="rounded-full bg-white shadow-[0_8px_24px_rgba(16,24,40,0.08)] border border-gray-100 flex items-center justify-center overflow-hidden shrink-0 aspect-square"
                        style={{ width: `${orbit.size}px`, height: `${orbit.size}px`, minWidth: `${orbit.size}px`, minHeight: `${orbit.size}px`, borderRadius: '9999px' }}
                      >
                        <div className="relative w-[52px] h-[52px]">
                          <Image src={`/assets/Providers/${logo.image}`} alt={logo.name} fill className="object-contain" unoptimized />
                        </div>
                      </div>
                      <span className="text-[13px] md:text-[14px] leading-none font-bold text-[#303846] whitespace-nowrap drop-shadow-[0_1px_0_rgba(255,255,255,0.9)]">
                        {logo.name}
                      </span>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div 
                key={orbitIndex} 
                className={`absolute left-0 top-0 w-0 h-0 animate-spin-${orbit.direction}`}
                style={{ animationDuration: orbit.duration }}
              >
                {elements}
              </div>
            );
          })}
        </div>

        <div className="absolute bottom-0 left-0 w-full h-[60px] bg-gradient-to-t from-white to-transparent z-20 pointer-events-none"></div>

        <style jsx global>{`
          @keyframes spin-cw {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes spin-ccw {
            from { transform: rotate(0deg); }
            to { transform: rotate(-360deg); }
          }
          .animate-spin-cw {
            animation: spin-cw linear infinite;
          }
          .animate-spin-ccw {
            animation: spin-ccw linear infinite;
          }
          .orbit-item-counter-cw {
            animation: spin-ccw linear infinite;
          }
          .orbit-item-counter-ccw {
            animation: spin-cw linear infinite;
          }
        `}</style>
      </section>
      <section id="comparison" className="hidden md:flex scroll-mt-0 w-full px-8 md:px-12 xl:px-16 pt-12 pb-24 bg-white flex-col items-center justify-center relative z-10 text-[#1A1D20]">
        <div className="w-full max-w-[1200px] flex flex-col items-center">
          <h2 className="text-[40px] md:text-[46px] xl:text-[54px] font-semibold mb-3 text-center tracking-tight">
            eSIM4U vs. Other <span className="text-[#FF561E] font-serif italic font-medium tracking-normal">eSIM Services</span>
          </h2>
          <p className="text-[16px] text-[#6B7280] font-medium mb-12 text-center max-w-[600px]">
            We focus on what matters most – better connection, better support, and a better travel experience.
          </p>

          <div className="w-full relative shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-[24px] border border-gray-100 bg-white grid grid-cols-[1.5fr_1.2fr_1fr_1fr_1fr] overflow-x-auto min-w-[900px]">
            <div className="pt-8 pb-5 px-6 flex items-center justify-center border-b border-gray-100">
              <span className="text-[#FF561E] font-bold text-[20px] text-center">Features</span>
            </div>
            <div className="relative flex flex-col items-center justify-center border-b border-gray-100">
              <div className="absolute inset-x-0 bottom-0 top-3 bg-[#FFF4F0] rounded-t-[24px] z-0"></div>
              <div className="pt-8 pb-5 px-6 relative z-10 w-full flex justify-center">
                <Image src="/assets/esim4u-logo.png" alt="eSIM4U" width={140} height={42} className="object-contain" />
              </div>
            </div>
            <div className="pt-8 pb-5 px-6 flex flex-col items-center justify-center border-b border-gray-100">
              <Image src="/assets/Providers/airalo.png" alt="Airalo" width={110} height={34} className="object-contain" />
            </div>
            <div className="pt-8 pb-5 px-6 flex flex-col items-center justify-center border-b border-gray-100">
              <Image src="/assets/Providers/holafly.png" alt="Holafly" width={110} height={34} className="object-contain" />
            </div>
            <div className="pt-8 pb-5 px-6 flex flex-col items-center justify-center border-b border-gray-100 rounded-tr-[24px]">
              <Image src="/assets/Providers/saily.png" alt="Saily" width={110} height={34} className="object-contain" />
            </div>
            {plansComparison.map((row, i) => (
              <Fragment key={i}>
                <div className={`py-4 px-6 flex items-center gap-4 border-b border-gray-100 ${i === plansComparison.length - 1 ? 'border-b-0 pb-5' : ''}`}>
                  <div className="flex-shrink-0">{row.icon}</div>
                  <div className="flex flex-col">
                    <span className="font-bold text-[16px]">{row.feature}</span>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[13px] text-[#6B7280]">
                      <span className="whitespace-pre-line">{row.subFeature}</span>
                      {row.tooltip && <Info className="w-4 h-4 text-gray-400" strokeWidth={2} />}
                    </div>
                  </div>
                </div>
                <div className={`py-4 px-4 bg-[#FFF4F0] flex flex-col items-center justify-center text-center border-b border-gray-100 ${i === plansComparison.length - 1 ? 'border-b-0 pb-5' : ''}`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    {row.esim4u.type === 'check' ? (
                      <CheckCircle2 className="w-5 h-5 text-[#FF561E] shrink-0" strokeWidth={2} />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-400 shrink-0" strokeWidth={2} />
                    )}
                    <span className={`font-bold text-[16px] ${row.esim4u.type === 'check' ? 'text-[#FF561E]' : ''}`}>{row.esim4u.primary}</span>
                  </div>
                  <span className="text-[13px] text-[#6B7280] leading-[1.4] whitespace-pre-line">{row.esim4u.secondary}</span>
                </div>
                <div className={`py-4 px-4 flex flex-col items-center justify-center text-center border-b border-gray-100 ${i === plansComparison.length - 1 ? 'border-b-0 pb-5' : ''}`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    {row.airalo.type === 'check' ? (
                      <CheckCircle2 className="w-5 h-5 text-gray-400 shrink-0" strokeWidth={2} />
                    ) : (
                      <X className="w-5 h-5 text-gray-400 shrink-0" strokeWidth={2} />
                    )}
                    <span className="font-bold text-[15px] text-gray-800">{row.airalo.primary}</span>
                  </div>
                  <span className="text-[13px] text-[#6B7280] leading-[1.4] whitespace-pre-line">{row.airalo.secondary}</span>
                </div>
                <div className={`py-4 px-4 flex flex-col items-center justify-center text-center border-b border-gray-100 ${i === plansComparison.length - 1 ? 'border-b-0 pb-5' : ''}`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    {row.holafly.type === 'check' ? (
                      <CheckCircle2 className="w-5 h-5 text-gray-400 shrink-0" strokeWidth={2} />
                    ) : (
                      <X className="w-5 h-5 text-gray-400 shrink-0" strokeWidth={2} />
                    )}
                    <span className="font-bold text-[15px] text-gray-800">{row.holafly.primary}</span>
                  </div>
                  <span className="text-[13px] text-[#6B7280] leading-[1.4] whitespace-pre-line">{row.holafly.secondary}</span>
                </div>
                <div className={`py-4 px-4 flex flex-col items-center justify-center text-center border-b border-gray-100 ${i === plansComparison.length - 1 ? 'border-b-0 pb-5' : ''}`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    {row.saily.type === 'check' ? (
                      <CheckCircle2 className="w-5 h-5 text-gray-400 shrink-0" strokeWidth={2} />
                    ) : (
                      <X className="w-5 h-5 text-gray-400 shrink-0" strokeWidth={2} />
                    )}
                    <span className="font-bold text-[15px] text-gray-800">{row.saily.primary}</span>
                  </div>
                  <span className="text-[13px] text-[#6B7280] leading-[1.4] whitespace-pre-line">{row.saily.secondary}</span>
                </div>
              </Fragment>
            ))}
            <div className="pt-5 pb-8 px-6 bg-white rounded-bl-[24px]"></div>
            <div className="relative flex justify-center border-t-0">
              <div className="absolute inset-x-0 top-0 bottom-4 bg-[#FFF4F0] rounded-b-[24px] z-0"></div>
              <div className="pt-5 pb-8 px-4 relative z-10 w-full flex justify-center">
                <Link href="/plans" className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-[#FF561E] text-white font-semibold text-[15px]  transition-all shadow-md shadow-orange-500/20 gap-2 shrink-0">
                  View Plans <ArrowRight className="w-4 h-4 ml-1 transform transition-transform hover:translate-x-1" />
                </Link>
              </div>
            </div>
            <div className="pt-5 pb-8 px-4 flex items-center justify-center text-gray-300 font-bold text-xl"></div>
            <div className="pt-5 pb-8 px-4 flex items-center justify-center text-gray-300 font-bold text-xl"></div>
            <div className="pt-5 pb-8 px-4 flex items-center justify-center text-gray-300 font-bold text-xl rounded-br-[24px]"></div>
          </div>
        </div>
      </section>

      <section className="w-full px-4 sm:px-8 md:px-12 xl:px-16 pb-8 flex flex-col items-center justify-center relative z-10 text-[#1A1D20]">
        <div className="w-full max-w-[1400px] bg-[#FFF4F0] rounded-[24px] sm:rounded-[40px] px-5 py-10 sm:px-8 sm:py-12 md:py-16 md:px-12 flex flex-col items-center shadow-sm relative overflow-hidden">
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none flex items-center justify-center">
            <ShieldCheck className="text-[#FF561E] w-[400px] h-[400px] md:w-[600px] md:h-[600px]" strokeWidth={0.8} />
          </div>

          <h2 className="text-[22px] sm:text-[28px] md:text-[36px] font-semibold text-[#1A1D20] mb-5 tracking-tight z-10 relative text-center leading-[1.2]">
            Free VPN Access for a Truly <span className="text-[#FF561E] font-serif italic font-medium tracking-normal pr-1">Open Internet</span>
          </h2>
          
          <p className="text-[16px] text-[#6B7280] font-medium text-center max-w-[850px] leading-[1.6] mb-12 lg:mb-16 z-10 relative">
            In certain countries, including parts of the Middle East, voice and video calls on apps<br className="hidden lg:block" />
            like WhatsApp, FaceTime, Skype and other VoIP services may not work.<br className="hidden lg:block" />
            That&apos;s why we include free VPN access with every plan so you can <span className="font-bold text-[#FF561E]">connect freely, everywhere.</span>
          </p>

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 w-full relative z-10 gap-x-4 gap-y-8 sm:gap-y-10 lg:gap-y-0">
            {[
              {
                title: "Open Internet\nAccess",
                desc: "Browse without restrictions and access the apps and websites you rely on.",
                icon: <BrickWallFire className="w-[30px] h-[30px] text-[#FF561E]" strokeWidth={1.5} />
              },
              {
                title: "Reach WhatsApp\nWithout Limits",
                desc: "Smooth access to WhatsApp and your favorite apps, no matter where you are.",
                icon: (
                  <svg fill="#FF561E" width="30" height="30" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg" stroke="#FF561E" strokeWidth="0.00032"><g strokeWidth="0"></g><g strokeLinecap="round" strokeLinejoin="round"></g><g> <path d="M26.576 5.363c-2.69-2.69-6.406-4.354-10.511-4.354-8.209 0-14.865 6.655-14.865 14.865 0 2.732 0.737 5.291 2.022 7.491l-0.038-0.070-2.109 7.702 7.879-2.067c2.051 1.139 4.498 1.809 7.102 1.809h0.006c8.209-0.003 14.862-6.659 14.862-14.868 0-4.103-1.662-7.817-4.349-10.507l0 0zM16.062 28.228h-0.005c-0 0-0.001 0-0.001 0-2.319 0-4.489-0.64-6.342-1.753l0.056 0.031-0.451-0.267-4.675 1.227 1.247-4.559-0.294-0.467c-1.185-1.862-1.889-4.131-1.889-6.565 0-6.822 5.531-12.353 12.353-12.353s12.353 5.531 12.353 12.353c0 6.822-5.53 12.353-12.353 12.353h-0zM22.838 18.977c-0.371-0.186-2.197-1.083-2.537-1.208-0.341-0.124-0.589-0.185-0.837 0.187-0.246 0.371-0.958 1.207-1.175 1.455-0.216 0.249-0.434 0.279-0.805 0.094-1.15-0.466-2.138-1.087-2.997-1.852l0.010 0.009c-0.799-0.74-1.484-1.587-2.037-2.521l-0.028-0.052c-0.216-0.371-0.023-0.572 0.162-0.757 0.167-0.166 0.372-0.434 0.557-0.65 0.146-0.179 0.271-0.384 0.366-0.604l0.006-0.017c0.043-0.087 0.068-0.188 0.068-0.296 0-0.131-0.037-0.253-0.101-0.357l0.002 0.003c-0.094-0.186-0.836-2.014-1.145-2.758-0.302-0.724-0.609-0.625-0.836-0.637-0.216-0.010-0.464-0.012-0.712-0.012-0.395 0.010-0.746 0.188-0.988 0.463l-0.001 0.002c-0.802 0.761-1.3 1.834-1.3 3.023 0 0.026 0 0.053 0.001 0.079l-0-0.004c0.131 1.467 0.681 2.784 1.527 3.857l-0.012-0.015c1.604 2.379 3.742 4.282 6.251 5.564l0.094 0.043c0.548 0.248 1.25 0.513 1.968 0.74l0.149 0.041c0.442 0.14 0.951 0.221 1.479 0.221 0.303 0 0.601-0.027 0.889-0.078l-0.031 0.004c1.069-0.223 1.956-0.868 2.497-1.749l0.009-0.017c0.165-0.366 0.261-0.793 0.261-1.242 0-0.185-0.016-0.366-0.047-0.542l0.003 0.019c-0.092-0.155-0.34-0.247-0.712-0.434z"></path> </g></svg>
                )
              },
              {
                title: "Unblock Voice &\nVideo Calling Apps",
                desc: "Enjoy smooth voice and video calls on FaceTime, Skype, Telegram, Zoom and other calling apps—no restrictions.",
                icon: <PhoneCall className="w-[30px] h-[30px] text-[#FF561E]" strokeWidth={1.5} />
              },
              {
                title: "Fast &\nReliable",
                desc: "Enjoy smooth, stable connections with high-speed VPN servers optimized for a seamless experience every day.",
                icon: <Rocket className="w-[30px] h-[30px] text-[#FF561E]" strokeWidth={1.5} />
              },
              {
                title: "Works in More\nPlaces",
                desc: "Designed to help you stay connected in countries where access can be limited.",
                icon: (
                  <div className="relative">
                    <Globe className="w-[30px] h-[30px] text-[#FF561E]" strokeWidth={1.5} />
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-[2px]">
                      <MapPin className="w-3.5 h-3.5 text-[#FF561E]" strokeWidth={2.5} />
                    </div>
                  </div>
                )
              }
            ].map((item, i) => (
              <div key={i} className={`flex flex-col items-center px-2 sm:px-6 lg:px-4 ${i !== 4 ? 'lg:border-r lg:border-orange-900/5' : ''}`}>
                <div className="w-[88px] h-[88px] bg-white/60 backdrop-blur-sm rounded-full flex items-center justify-center mb-6 hover:scale-105 transition-transform cursor-default">
                  <div className="w-[68px] h-[68px] bg-white rounded-full shadow-sm border border-orange-50 flex items-center justify-center">
                    {item.icon}
                  </div>
                </div>
                <h3 className="text-[17px] font-bold text-center mb-4 leading-[1.3] whitespace-pre-line text-[#1A1D20]">
                  {item.title}
                </h3>
                <p className="text-[14px] text-[#6B7280] text-center leading-[1.6] font-medium">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full px-4 sm:px-8 md:px-12 xl:px-16 pt-0 pb-12 bg-white flex flex-col items-center justify-center relative z-10 text-[#1A1D20]">
        <div className="w-full max-w-[1400px] flex flex-col items-center">
          
          <div className="w-full flex flex-col md:flex-row items-center justify-between gap-8 md:gap-4 mb-10 mt-4">
            <div className="w-full md:w-[42%] flex flex-col items-center md:items-start text-center md:text-left pt-6">
              
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-100 mb-6 w-max">
                <Gift className="w-[16px] h-[16px] text-[#FF561E]" strokeWidth={2} />
                <span className="text-[#FF561E] text-[13px] font-semibold tracking-wide">Refer & Earn</span>
              </div>

              <h2 className="text-[30px] sm:text-[40px] md:text-[56px] xl:text-[62px] leading-[1.12] font-semibold text-[#1A1D20] tracking-[-0.02em] mb-4">
                Refer Friends,<br /> <span className="text-[#FF561E] font-serif italic font-medium lining-nums tracking-normal">Earn $3 Each</span>
              </h2>

              <p className="text-[17px] text-[#6B7280] font-medium max-w-[500px]">
                Share eSIM4U with your friends and you&apos;ll both get <span className="text-[#FF561E] font-bold">$3 in credit</span>.
              </p>
            </div>

            <div className="w-full md:w-[58%] flex justify-center md:justify-end relative">
              <Image 
                src="/assets/Refer&Earn/credit.png" 
                alt="You get $3 Credit, Your friend gets $3 Credit" 
                width={590}
                height={221}
                className="object-contain"
                priority
              />
            </div>
          </div>

          <div className="w-full relative flex flex-col items-center mb-16">
            
            <div className="absolute left-[24px] md:left-1/2 top-4 bottom-4 w-[2px] bg-[#FF561E]/30 md:-translate-x-1/2 z-0"></div>

            <div className="w-full flex flex-row items-center justify-start md:justify-center mb-8 md:mb-10 relative z-10">
              <div className="w-1/2 flex justify-end pr-16 hidden md:flex"></div>
              <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 w-12 h-12 bg-[#FF561E] rounded-full border-[5px] border-white shadow-sm flex items-center justify-center text-white font-bold text-[20px] z-10">1</div>
              <div className="w-full pl-16 md:pl-0 md:w-1/2 flex justify-start md:pl-16">
                <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col sm:flex-row items-center sm:items-start md:items-center gap-6 w-full max-w-[480px]">
                  <Image src="/assets/Refer&Earn/step1.png" alt="Step 1" width={100} height={100} className="object-contain shrink-0" />
                  <div className="flex flex-col text-center sm:text-left">
                    <h3 className="text-[18px] font-bold text-[#1A1D20] mb-2 leading-tight">Share Your<br />Referral Code</h3>
                    <p className="text-[14px] text-[#6B7280] font-medium leading-[1.5]">Share your unique referral link or code with friends anywhere in the world.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full flex flex-row items-center justify-start md:justify-center mb-8 md:mb-10 relative z-10">
              <div className="w-full pl-16 md:pl-0 md:w-1/2 flex justify-start md:justify-end md:pr-16 order-2 md:order-1">
                <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col sm:flex-row items-center sm:items-start md:items-center gap-6 w-full max-w-[480px]">
                  <Image src="/assets/Refer&Earn/step2.png" alt="Step 2" width={120} height={100} className="object-contain shrink-0" />
                  <div className="flex flex-col text-center sm:text-left">
                    <h3 className="text-[18px] font-bold text-[#1A1D20] mb-2 leading-tight">They Join<br />eSIM4U</h3>
                    <p className="text-[14px] text-[#6B7280] font-medium leading-[1.5]">Your friend signs up and purchases their first eSIM using your referral code.</p>
                  </div>
                </div>
              </div>
              <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 w-12 h-12 bg-[#FF561E] rounded-full border-[5px] border-white shadow-sm flex items-center justify-center text-white font-bold text-[20px] z-10 order-1 md:order-2">2</div>
              <div className="w-1/2 flex justify-start pl-16 hidden md:flex order-3"></div>
            </div>

            <div className="w-full flex flex-row items-center justify-start md:justify-center relative z-10">
              <div className="w-1/2 flex justify-end pr-16 hidden md:flex"></div>
              <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 w-12 h-12 bg-[#FF561E] rounded-full border-[5px] border-white shadow-sm flex items-center justify-center text-white font-bold text-[20px] z-10">3</div>
              <div className="w-full pl-16 md:pl-0 md:w-1/2 flex justify-start md:pl-16">
                <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col sm:flex-row items-center sm:items-start md:items-center gap-6 w-full max-w-[480px]">
                  <Image src="/assets/Refer&Earn/step3.png" alt="Step 3" width={120} height={100} className="object-contain shrink-0" />
                  <div className="flex flex-col text-center sm:text-left">
                    <h3 className="text-[18px] font-bold text-[#1A1D20] mb-2 leading-tight">You Both Earn $3</h3>
                    <p className="text-[14px] text-[#6B7280] font-medium leading-[1.5]">
                      You get <span className="text-[#FF561E] font-bold">$3 in credit</span> and your friend gets <span className="text-[#FF561E] font-bold">$3 off</span> too — automatically!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full border border-gray-100 rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-8 md:p-10 mb-8 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0 lg:divide-x divide-gray-100">
              {[
                { title: 'Instant Credits', desc: "Credits are added instantly after your friend's first purchase.", icon: <Zap className="w-[30px] h-[30px] text-[#FF561E]" strokeWidth={1.5} /> },
                { title: 'Unlimited Referrals', desc: "Invite as many friends as you want and keep earning.", icon: <Users className="w-[30px] h-[30px] text-[#FF561E]" strokeWidth={1.5} /> },
                { title: 'Use Anywhere', desc: "Use your $3 credit on any country or regional eSIM plan.", icon: <Globe className="w-[30px] h-[30px] text-[#FF561E]" strokeWidth={1.5} /> },
                { title: 'No Extra Steps', desc: "Rewards are automatic. No forms, no waiting.", icon: <ShieldCheck className="w-[30px] h-[30px] text-[#FF561E]" strokeWidth={1.5} /> }
              ].map((ft, i) => (
                <div key={i} className="flex flex-col items-center text-center px-4">
                  <div className="w-[60px] h-[60px] rounded-full bg-white border border-gray-100 flex items-center justify-center mb-4 shrink-0 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                    {ft.icon}
                  </div>
                  <h4 className="text-[15px] font-bold text-[#1A1D20] mb-2">{ft.title}</h4>
                  <p className="text-[13px] text-[#6B7280] font-medium leading-[1.6]">
                    {ft.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-center px-4">
            <CheckCircle2 className="w-[18px] h-[18px] text-[#FF561E] shrink-0" strokeWidth={2.5} />
            <span className="text-[13px] text-[#1A1D20] font-semibold">
              Rewards are credited once your friend completes their first eligible purchase.{" "}
              <Link href="/terms" className="text-[#FF561E] underline underline-offset-2 hover:text-[#E04B18]">
                T&amp;C
              </Link>{" "}
              apply.
            </span>
          </div>

        </div>
      </section>

      <section className="w-full px-4 sm:px-8 md:px-12 xl:px-16 py-8 sm:py-12 md:py-16 bg-white overflow-hidden">
        <div className="w-full max-w-[1400px] mx-auto">
          <div ref={reviewsRef} className="flex gap-5 overflow-x-auto hide-scrollbar scroll-smooth pb-2 snap-x">
            {reviews.map((r, i) => (
              <div
                key={i}
                className="w-[300px] shrink-0 snap-start bg-white rounded-[24px] border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-6 flex flex-col"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${s < r.rating ? "text-[#FF561E] fill-[#FF561E]" : "text-gray-300"}`}
                        strokeWidth={1.5}
                      />
                    ))}
                  </div>
                  <Quote className="w-6 h-6 text-orange-200 fill-orange-200" strokeWidth={1.5} />
                </div>
                <p className="text-[14px] leading-[1.7] text-[#374151] mb-6 flex-1">{r.text}</p>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#FF561E] to-[#FF7A45] flex items-center justify-center text-white font-bold text-[16px] shrink-0">
                    {r.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-bold text-[#1A1D20] leading-tight">{r.name}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={flagUrl(r.flag, "l")}
                        alt={`${r.country} flag`}
                        className="h-3.5 w-auto rounded-[2px] border border-gray-100 shrink-0 block"
                      />
                      <span className="text-[12px] text-[#6B7280]">{r.country}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={() => scrollReviews(-1)}
              aria-label="Previous reviews"
              className="w-11 h-11 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[#FF561E] hover:bg-[#FFF4F0] hover:border-orange-200 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scrollReviews(1)}
              aria-label="Next reviews"
              className="w-11 h-11 rounded-full bg-[#FF561E] text-white flex items-center justify-center hover:bg-[#E04B18] transition-colors shadow-sm shadow-orange-500/20"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      <footer className="w-full relative bg-[#FF561E] overflow-hidden pt-8 pb-3 md:pt-10 md:pb-5 font-sans">
        <div className="absolute left-[5%] top-8 bottom-4 w-[15%] opacity-15 pointer-events-none">
          <Image src="/assets/tower.svg" alt="Tower Background" fill className="object-contain object-bottom" />
        </div>
        <div className="absolute right-[5%] top-8 bottom-4 w-[15%] opacity-15 pointer-events-none">
          <Image src="/assets/tower.svg" alt="Tower Background" fill className="object-contain object-bottom" />
        </div>

        <div className="flex w-full max-w-[1400px] mx-auto px-4 md:px-6 xl:px-8 flex-col xl:flex-row gap-12 xl:gap-10 relative z-10 mb-4 md:mb-6">
          <div className="w-full xl:w-[280px] flex flex-col items-start gap-4 shrink-0">
            <div className="relative h-20 w-64 md:h-[90px] md:w-[280px] -ml-4 lg:-ml-8">
              <Image src="/assets/esim4u-logo.png" alt="eSIM4U" fill className="object-contain object-left brightness-0 invert" />
            </div>

            <div className="flex items-center gap-6 mt-1">
              <a href="#" aria-label="Instagram" className="text-white hover:text-white/80 transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="6" ry="6" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </a>
              <a href="#" aria-label="Facebook" className="text-white hover:text-white/80 transition-colors">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a href="#" aria-label="X (Twitter)" className="text-white hover:text-white/80 transition-colors">
                <img src="https://upload.wikimedia.org/wikipedia/commons/c/ce/X_logo_2023.svg" alt="X (Twitter)" width={20} height={20} className="brightness-0 invert opacity-100 hover:opacity-80 transition-opacity" />
              </a>
              <a href="#" aria-label="TikTok" className="text-white hover:text-white/80 transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
              <a href="#" aria-label="YouTube" className="text-white hover:text-white/80 transition-colors">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21.58 6.55a2.76 2.76 0 0 0-1.95-1.96C17.9 4.1 12 4.1 12 4.1s-5.9 0-7.63.49A2.76 2.76 0 0 0 2.42 6.55C1.94 8.28 1.94 12 1.94 12s0 3.72.48 5.45a2.76 2.76 0 0 0 1.95 1.96C6.1 19.9 12 19.9 12 19.9s5.9 0 7.63-.49a2.76 2.76 0 0 0 1.95-1.96C22.06 15.72 22.06 12 22.06 12s0-3.72-.48-5.45zM9.95 15.36V8.64L15.79 12z"/>
                </svg>
              </a>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-2 lg:grid-cols-5 gap-y-12 gap-x-6 xl:gap-2 lg:pl-10">
            <div className="flex flex-col gap-6">
              <h4 className="font-bold text-[15px] tracking-wide text-white mb-1">PRODUCT</h4>
              <div className="flex flex-col gap-4">
                <button onClick={() => goProtected('/dashboard/browse')} className="text-left text-white hover:text-white/80 text-[15px] font-medium transition-colors leading-relaxed">Buy eSIM</button>
                <button onClick={() => scrollToId('where-next')} className="text-left text-white hover:text-white/80 text-[15px] font-medium transition-colors leading-relaxed">Countries</button>
                <button onClick={() => scrollToId('how-it-works')} className="text-left text-white hover:text-white/80 text-[15px] font-medium transition-colors leading-relaxed">How it works</button>
                <button onClick={() => scrollToId('coverage')} className="text-left text-white hover:text-white/80 text-[15px] font-medium transition-colors leading-relaxed">Coverage</button>
              </div>
            </div>
            <div className="flex flex-col gap-6">
              <h4 className="font-bold text-[15px] tracking-wide text-white mb-1">COMPANY</h4>
              <div className="flex flex-col gap-4">
                <Link href="/about-us" className="text-white hover:text-white/80 text-[15px] font-medium transition-colors leading-relaxed">About us</Link>
                <Link href="/blog" className="text-white hover:text-white/80 text-[15px] font-medium transition-colors leading-relaxed">Blog</Link>
                <Link href="/contact" className="text-white hover:text-white/80 text-[15px] font-medium transition-colors leading-relaxed">Contact us</Link>
                <Link href="/affiliate" className="text-white hover:text-white/80 text-[15px] font-medium transition-colors leading-relaxed">Affiliate Program</Link>
              </div>
            </div>
            <div className="flex flex-col gap-6">
              <h4 className="font-bold text-[15px] tracking-wide text-white mb-1">SUPPORT</h4>
              <div className="flex flex-col gap-4">
                <Link href="/help-center" className="text-white hover:text-white/80 text-[15px] font-medium transition-colors leading-relaxed">Help Center</Link>
                <Link href="/installation" className="text-white hover:text-white/80 text-[15px] font-medium transition-colors leading-relaxed">Installation Guide</Link>
                <Link href="/refund-policy" className="text-white hover:text-white/80 text-[15px] font-medium transition-colors leading-relaxed">Refund Policy</Link>
                <Link href="/terms" className="text-white hover:text-white/80 text-[15px] font-medium transition-colors leading-relaxed">Terms of Service</Link>
                <Link href="/privacy" className="text-white hover:text-white/80 text-[15px] font-medium transition-colors leading-relaxed">Privacy Policy</Link>
              </div>
            </div>
            <div className="flex flex-col gap-6">
              <h4 className="font-bold text-[15px] tracking-wide text-white mb-1">ACCOUNT</h4>
              <div className="flex flex-col gap-4">
                <Link href="/my-account" className="text-white hover:text-white/80 text-[15px] font-medium transition-colors leading-relaxed">My Account</Link>
                <Link href="/my-orders" className="text-white hover:text-white/80 text-[15px] font-medium transition-colors leading-relaxed">My Orders</Link>
                <Link href="/track-order" className="text-white hover:text-white/80 text-[15px] font-medium transition-colors leading-relaxed">Track Order</Link>
                <Link href="/refer-and-earn" className="text-white hover:text-white/80 text-[15px] font-medium transition-colors leading-relaxed">Refer & Earn</Link>
                <button className="text-left text-white hover:text-white/80 text-[15px] font-medium transition-colors leading-relaxed">Log Out</button>
              </div>
            </div>
            <div className="flex flex-col items-center gap-6 lg:w-[260px]">
              <h4 className="font-bold text-[15px] tracking-wide text-white text-center w-full">STAY CONNECTED</h4>
              <div className="flex flex-col items-center w-full">
                <p className="text-white text-[15px] font-medium leading-[1.6] text-center mb-5">
                  Get travel tips and exclusive offers.
                </p>
                <div className="relative w-full">
                  <input type="email" placeholder="Enter your email" className="w-full pl-4 pr-12 py-[10px] rounded-full text-[14px] text-[#1A1D20] bg-white outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-white/50 shadow-sm" />
                  <button className="absolute right-1 top-1 bottom-1 w-9 bg-[#FF561E] text-white flex items-center justify-center rounded-full  transition-colors shadow-sm" aria-label="Send">
                    <ArrowRight className="w-4 h-4 text-white" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full text-center relative z-10 pt-6 mt-4">
          <p className="text-white/80 text-[14px] font-medium">
            © 2026 eSIM4U. All Rights Reserved
          </p>
        </div>
      </footer>
    </div>
  );
}
