"use client";

import { useEffect, useState } from 'react';
import Landing from './landing';
import LandingMobile from './landing-mobile';
import CookieConsent from '@/components/cookie-consent';

const MOBILE_QUERY = '(max-width: 767px)';

export default function LandingSwitch({ initialIsMobile }: { initialIsMobile: boolean }) {
  // Seed with the server's user-agent guess so the first client render matches
  // the server HTML (no hydration mismatch, SEO-friendly).
  const [isMobile, setIsMobile] = useState(initialIsMobile);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const update = () => setIsMobile(mq.matches);
    // Correct against the actual viewport width for 100% accuracy.
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return (
    <>
      {isMobile ? <LandingMobile /> : <Landing />}
      <CookieConsent />
    </>
  );
}
