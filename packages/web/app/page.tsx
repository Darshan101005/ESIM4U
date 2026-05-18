import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="h-screen w-full bg-white font-sans relative overflow-hidden flex flex-col">
      {/* Background Image Container */}
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

      {/* Header Container - Split into 3 flex-1 columns for perfect center alignment */}
      <div className="w-full px-8 md:px-12 xl:px-16 pt-8 flex items-center justify-between relative z-50">
        
        {/* Left: Logo */}
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

        {/* Center: Navigation Pill - Smaller, frosted, and perfectly centered */}
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

        {/* Right: Auth Buttons */}
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

      {/* Hero Section */}
      <main className="flex-grow w-full px-8 md:px-12 xl:px-16 flex items-center relative z-10 pb-20">
        
        {/* Left Content */}
        <div className="w-full max-w-[650px] z-20 relative">
          <div className="inline-flex items-center px-5 py-2 rounded-full bg-white/80 backdrop-blur-md border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.03)] mb-8">
            <span className="text-[#FF561E] text-[13px] font-semibold tracking-wide">Global Travel eSIM</span>
          </div>
          
          <h1 className="text-[54px] lg:text-[70px] leading-[1.12] font-bold text-[#1A1D20] tracking-[-0.02em] mb-6">
            Stay Connected<br />
            <span className="whitespace-nowrap">
              Across Borders, <span className="text-[#FF561E] font-serif italic font-normal tracking-normal pr-4">Anytime.</span>
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
  );
}
