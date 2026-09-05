import { headers } from 'next/headers';
import LandingSwitch from './landing-switch';

// Phone user-agents. Tablets/desktops fall through to the desktop layout,
// matching the 767px client breakpoint below.
const MOBILE_UA = /iPhone|iPod|Android.*Mobile|Windows Phone|BlackBerry|IEMobile|Opera Mini|Mobi/i;

export default function Page() {
  const ua = headers().get('user-agent') || '';
  const initialIsMobile = MOBILE_UA.test(ua);

  // Server renders the correct layout immediately (good for SEO). The client
  // switch then verifies against the real viewport width and corrects if needed.
  return <LandingSwitch initialIsMobile={initialIsMobile} />;
}
