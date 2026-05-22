"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Globe, QrCode, Plane, Tag, Zap, ShieldCheck, Headphones, Smartphone, RadioTower } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function Landing() {
  const howRef = useRef<HTMLDivElement>(null);
  const whyRef = useRef<HTMLDivElement>(null);
  const coverageRef = useRef<HTMLDivElement>(null);
  const [howVisible, setHowVisible] = useState(false);
  const [whyVisible, setWhyVisible] = useState(false);
  const [coverageVisible, setCoverageVisible] = useState(false);

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
              Why Travelers Choose <span className="text-[#FF561E]">eSIM4U</span>
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

      <section className="w-full px-8 md:px-12 xl:px-16 pt-4 pb-16 md:pt-8 md:pb-24 bg-white flex flex-col items-center justify-center relative">
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

    </div>
  );
}