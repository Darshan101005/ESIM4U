"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Globe, QrCode, Plane, Tag, Zap, ShieldCheck, Headphones, Smartphone, RadioTower, Search, ChevronRight, ChevronLeft, ArrowRight } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const Flag = dynamic<any>(() => import('react-flagpack').then(m => m.default || m), { ssr: false });

const carouselItems = [
  { name: 'Australia', image: 'australia.png', price: '3.99' },
  { name: 'Brazil', image: 'brazil.png', price: '3.49' },
  { name: 'Canada', image: 'canada.png', price: '3.99' },
  { name: 'England', image: 'england.png', price: '3.99' },
  { name: 'France', image: 'france.png', price: '3.49' },
  { name: 'Japan', image: 'japan.png', price: '3.49' },
  { name: 'Malaysia', image: 'malaysia.png', price: '3.49' },
  { name: 'Singapore', image: 'singapore.png', price: '2.99' },
  { name: 'Switzerland', image: 'switzerland.png', price: '4.49' },
  { name: 'Turkey', image: 'turkey.png', price: '3.99' },
  { name: 'UAE', image: 'uae.png', price: '3.99' },
  { name: 'United States', image: 'usa.png', price: '4.49' },
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

export default function Landing() {
  const howRef = useRef<HTMLDivElement>(null);
  const whyRef = useRef<HTMLDivElement>(null);
  const coverageRef = useRef<HTMLDivElement>(null);
  const [howVisible, setHowVisible] = useState(false);
  const [whyVisible, setWhyVisible] = useState(false);
  const [coverageVisible, setCoverageVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'Countries' | 'Regions' | 'Plans'>('Countries');
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

        <div className="w-full px-8 md:px-12 xl:px-16 pt-8 flex items-center justify-between relative z-50">
          <div className="flex-1 flex justify-start">
            <Link href="/" className="flex items-center">
              <Image 
                src="/assets/esim4u-logo.png" 
                alt="eSIM4U Logo" 
                width={140} 
                height={42}
                className="object-contain"
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
              <Link href="/features" className="hover:text-[#FF561E] transition-colors">Features</Link>
              <Link href="/pricing" className="hover:text-[#FF561E] transition-colors">Pricing</Link>
              <Link href="/destinations" className="hover:text-[#FF561E] transition-colors">Destinations</Link>
              <Link href="/how-it-works" className="hover:text-[#FF561E] transition-colors">How It Works</Link>
              <Link href="/about-us" className="hover:text-[#FF561E] transition-colors">About Us</Link>
            </nav>
          </div>

          <div className="flex-1 flex justify-end">
            <div className="flex items-center gap-3">
              <Link href="/login" className="px-6 py-2.5 rounded-full bg-white/80 backdrop-blur-sm border border-gray-100 text-[#FF561E] font-semibold text-[14px] hover:bg-white transition-colors shadow-sm">
                Log in
              </Link>
              <Link href="/signup" className="px-6 py-2.5 rounded-full bg-[#FF561E] text-white font-semibold text-[14px] hover:bg-[#e04b19] transition-colors shadow-lg shadow-orange-500/20">
                Sign up
              </Link>
            </div>
          </div>
        </div>

        <main className="flex-grow w-full px-8 md:px-12 xl:px-16 flex items-center relative z-10 pb-20">
          <div className="w-full max-w-[650px] z-20 relative">
            <div className="inline-flex items-center px-5 py-2 rounded-full bg-orange-50 border border-orange-100 shadow-[0_2px_10px_rgb(0,0,0,0.03)] mb-8">
              <span className="text-[#FF561E] text-[13px] font-semibold tracking-wide">Global Travel eSIM</span>
            </div>
            
            <h1 className="text-[54px] lg:text-[70px] leading-[1.12] font-medium text-[#1A1D20] tracking-[-0.02em] mb-6">
              Stay Connected<br />
              <span className="whitespace-nowrap">
                Everywhere, <span className="text-[#FF561E] font-serif italic font-normal tracking-normal pr-4">Anytime.</span>
              </span>
            </h1>
            
            <p className="text-[18px] lg:text-[20px] leading-[1.6] text-[#6B7280] mb-10 font-medium max-w-[420px]">
              Travel smarter with instant eSIM activation<br />
              in 200+ countries worldwide.
            </p>
            
            <div className="flex items-center gap-4">
              <Link href="/get-started" className="inline-flex items-center justify-center px-9 py-4 rounded-full bg-[#FF561E] text-white font-semibold text-[16px] hover:bg-[#e04b19] transition-all shadow-xl shadow-orange-500/25 gap-2 group">
                Get Started
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform transition-transform group-hover:translate-x-1">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              <Link href="/plans" className="inline-flex items-center justify-center px-9 py-4 rounded-full bg-white/90 backdrop-blur-md text-[#FF561E] font-semibold text-[16px] hover:bg-white transition-all border border-gray-200 shadow-sm gap-2 group">
                Explore Plans
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform transition-transform group-hover:translate-x-1">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>
          </div>
        </main>
      </div>

      <section
        className="min-h-screen shrink-0 w-full px-8 md:px-12 xl:px-16 mt-20 md:mt-32 pb-24 bg-white flex flex-col items-center justify-center relative"
      >
        <div className="w-full max-w-[1400px] flex flex-col gap-20 xl:gap-24">
          
          <div ref={howRef} className="flex flex-col lg:flex-row gap-10 lg:gap-6 items-center lg:items-start w-full relative">
            <div 
              className={`w-full lg:w-[40%] flex flex-col justify-center pt-2 md:pt-4 xl:pt-8 pr-0 lg:pr-8 transition-all duration-[800ms] ease-out ${
                howVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
              }`}
            >
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-orange-50 border border-orange-100 mb-6 w-max">
                <span className="text-[#FF561E] text-[13px] font-semibold">How eSIM4U Works</span>
              </div>
              <h2 className="text-[40px] md:text-[46px] xl:text-[50px] leading-[1.12] font-semibold text-[#1A1D20] tracking-tight mb-5">
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
            className={`w-full bg-[#FFF4F0] rounded-[40px] px-8 py-12 md:py-16 md:px-16 text-center shadow-sm transition-all duration-[1000ms] ease-out ${
              whyVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
            }`}
          >
            <h2 className="text-[32px] md:text-[36px] font-semibold text-[#1A1D20] mb-14 tracking-tight">
              Why Travelers Choose <span className="text-[#FF561E] font-serif italic font-medium lining-nums tracking-normal">eSIM4U</span>
            </h2>
            
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-x-8 gap-y-12">
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

      <section className="w-full px-8 md:px-12 xl:px-16 pt-4 pb-8 md:pt-6 md:pb-12 bg-white flex flex-col items-center justify-center relative">
        <div ref={coverageRef} className="w-full max-w-[1400px] flex flex-col lg:flex-row gap-16 lg:gap-4 items-center justify-between lg:justify-center">
          
          <div 
            className={`w-full lg:w-[35%] flex flex-col justify-center transition-all duration-[800ms] ease-out ${
              coverageVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
            }`}
          >
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-orange-50 border border-orange-100 mb-6 w-max">
              <span className="text-[#FF561E] text-[13px] font-semibold">Global Coverage</span>
            </div>
            
            <h2 className="text-[40px] md:text-[46px] xl:text-[54px] leading-[1.12] font-semibold text-[#1A1D20] tracking-tight mb-5">
              Stay Connected in<br />
              <span className="text-[#FF561E] font-serif italic font-medium lining-nums tracking-normal">200+ Countries</span>
            </h2>
            
            <p className="text-[17px] leading-[1.6] text-[#6B7280] font-medium max-w-[420px] mb-12">
              Enjoy reliable and high-speed data coverage in 200+ countries and regions around the world.
            </p>
            
            <div className="flex items-center gap-10 md:gap-14">
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

      <section className="w-full px-4 md:px-6 xl:px-8 pt-0 pb-4 md:pt-0 md:pb-6 bg-white flex flex-col items-center justify-center relative">
        <div className="w-full max-w-[1400px] flex flex-col items-center">
          <h2 className="text-[40px] md:text-[46px] xl:text-[54px] leading-[1.12] font-semibold text-[#1A1D20] mb-5 tracking-tight text-center">
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
                  <div key={`${dest.name}-${i}`} className="dest-card flex-shrink-0 w-[calc((100%_-_24px)/2)] sm:w-[calc((100%_-_48px)/3)] md:w-[calc((100%_-_72px)/4)] lg:w-[calc((100%_-_120px)/6)] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col group cursor-pointer transition-transform duration-300 hover:translate-y-[-6px] hover:scale-[1.03]">
                    <div className="relative w-full aspect-square bg-[#FFF4F0] flex items-center justify-center">
                      <Image src={`/assets/Locations/${dest.image}`} alt={dest.name} fill className="object-contain" />
                    </div>
                    <div className="p-4 flex flex-col">
                      <h3 className="text-[16px] font-bold text-[#1A1D20] mb-1">{dest.name}</h3>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[13px] text-[#FF561E] font-semibold">From ${dest.price}</span>
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

      <section className="w-full px-8 md:px-12 xl:px-16 pb-8 flex flex-col items-center justify-center relative">
        <div className="w-full max-w-[1400px] bg-[#FFF4F0] rounded-[40px] px-8 py-12 md:py-16 md:px-12 flex flex-col items-center">
          <h2 className="text-[32px] md:text-[36px] font-semibold text-[#1A1D20] mb-3 tracking-tight text-center">
            Where are you traveling <span className="text-[#FF561E] font-serif italic font-medium pr-1">next?</span>
          </h2>
          <p className="text-[16px] text-[#6B7280] font-medium mb-10 text-center">
            Choose your destination first, then a data plan according to your needs.
          </p>

          <div className="w-full max-w-[1000px] flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
            <div className="flex items-center bg-white rounded-full p-1.5 shadow-sm border border-orange-50 w-full md:w-auto overflow-x-auto hide-scrollbar">
              <button onClick={() => setActiveTab('Countries')} className={`px-6 py-2 rounded-full font-semibold text-[14px] shadow-sm whitespace-nowrap transition-colors ${activeTab === 'Countries' ? 'bg-[#FF561E] text-white' : 'text-[#1A1D20] hover:bg-gray-50'}`}>Countries</button>
              <button onClick={() => setActiveTab('Regions')} className={`px-6 py-2 rounded-full font-medium text-[14px] whitespace-nowrap transition-colors ${activeTab === 'Regions' ? 'bg-[#FF561E] text-white shadow-sm' : 'text-[#1A1D20] hover:bg-gray-50'}`}>Regions</button>
              <button onClick={() => setActiveTab('Plans')} className={`px-6 py-2 rounded-full font-medium text-[14px] flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === 'Plans' ? 'bg-[#FF561E] text-white shadow-sm' : 'text-[#1A1D20] hover:bg-gray-50'}`}>
                Plans <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${activeTab === 'Plans' ? 'bg-white text-[#FF561E]' : 'bg-orange-100 text-[#FF561E]'}`}>New</span>
              </button>
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
              { name: 'India', flag: 'IN', price: '3.99' },
              { name: 'United Kingdom', flag: 'GBR', price: '4.49' },
              { name: 'Greece', flag: 'GR', price: '4.49' },
              { name: 'Turkey', flag: 'TR', price: '3.99' },
              { name: 'Germany', flag: 'DE', price: '4.49' },
              { name: 'Switzerland', flag: 'CH', price: '4.49' },
              { name: 'France', flag: 'FR', price: '3.99' },
              { name: 'Italy', flag: 'IT', price: '3.99' },
              { name: 'Netherlands', flag: 'NL', price: '3.99' },
              { name: 'Spain', flag: 'ES', price: '3.99' },
              { name: 'Portugal', flag: 'PT', price: '3.99' },
              { name: 'United States', flag: 'US', price: '4.49' },
              { name: 'Thailand', flag: 'TH', price: '3.99' },
              { name: 'Indonesia', flag: 'ID', price: '3.99' },
              { name: 'South Korea', flag: 'KR', price: '4.49' },
            ].map((country, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-9 rounded-md overflow-hidden border border-gray-100 shrink-0 relative">
                    <Flag code={country.flag} size="l" hasBorder={false} hasBorderRadius={false} className="country-flag" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[15px] font-bold text-[#1A1D20]">{country.name}</span>
                    <span className="text-[13px] text-[#FF561E] font-medium">From US${country.price}</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#FF561E] transition-colors" />
              </div>
            ))}
            
            {activeTab === 'Regions' && [
              { name: 'North America', image: 'north america_map.png', price: '4.49' },
              { name: 'Europe', image: 'europe_map.png', price: '4.49' },
              { name: 'Asia', image: 'asia_map.png', price: '4.49' },
              { name: 'Africa', image: 'africa_map.png', price: '3.99' },
              { name: 'Middle East & North Africa', image: 'middle east &north africa_map.png', price: '3.99' },
              { name: 'The Caribbean', image: 'caribbean_map.png', price: '4.49' },
              { name: 'South America', image: 'southamerica_map.png', price: '4.49' },
              { name: 'Globe', image: 'world_map.png', price: '6.99' },
            ].map((region, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-[54px] h-[36px] rounded-md overflow-hidden border border-gray-100 shrink-0 relative bg-[#FFF4F0]">
                    <Image src={`/assets/Regions/${region.image}`} alt={region.name} fill className="object-cover" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[15px] font-bold text-[#1A1D20]">{region.name}</span>
                    <span className="text-[13px] text-[#FF561E] font-medium">From US${region.price}</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#FF561E] transition-colors" />
              </div>
            ))}

            {activeTab === 'Plans' && (
              <div className="col-span-full py-8 text-center text-[#6B7280]">
                Plans are coming soon!
              </div>
            )}
          </div>

          <button className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-transparent border border-[#FF561E] text-[#FF561E] font-semibold text-[15px] hover:bg-[#FF561E] hover:text-white transition-all gap-2 group">
            View all destinations
            <ArrowRight className="w-4 h-4 transform transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </section>

      <section className="w-full bg-white overflow-hidden min-h-[880px] relative flex flex-col items-center pt-10 mt-6 pb-40">
        <div className="z-10 flex flex-col items-center mb-24 px-4">
          <h2 className="text-[40px] md:text-[54px] xl:text-[60px] leading-[1.05] font-semibold text-[#05070A] tracking-tight text-center mb-4">
            Global eSIM <span className="text-[#FF561E] font-serif italic font-normal tracking-normal">Connectivity</span>
          </h2>
          <p className="text-[16px] md:text-[18px] text-[#5E6673] font-medium text-center max-w-[600px]">
            Seamlessly connect to top telecom providers around the world.
          </p>
        </div>

        <div className="absolute bottom-[-70px] left-1/2 -translate-x-1/2 w-[920px] h-[360px] bg-[#fb923c]/20 blur-[90px] rounded-full pointer-events-none z-0"></div>

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
    </div>
  );
}
