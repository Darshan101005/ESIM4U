export interface BlogSection {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readingTime: string;
  category: string;
  sections: BlogSection[];
}

export const blogPosts: BlogPost[] = [
  {
    slug: "what-is-an-esim-and-how-does-it-work",
    title: "What is an eSIM and how does it work?",
    excerpt:
      "An eSIM is a built-in digital SIM that lets you activate a mobile plan without a physical card. Here's how it works and why travelers love it.",
    date: "September 2026",
    readingTime: "4 min read",
    category: "Basics",
    sections: [
      {
        paragraphs: [
          "An eSIM (embedded SIM) is a small chip already built into your phone that does everything a plastic SIM card does — it just doesn't need to be inserted. Instead of swapping a card, you download a mobile plan onto the chip and activate it in seconds.",
          "For travelers, this is a game changer. You can buy a data plan for your destination before you leave home, install it on Wi-Fi, and arrive already connected — no queues at the airport, no hunting for a local shop, and no risk of losing a tiny SIM card.",
        ],
      },
      {
        heading: "How activation works",
        paragraphs: [
          "When you buy an eSIM plan from eSIM4U, we send you a QR code. You scan it in your phone's settings (or enter the details manually), and the plan installs onto your device.",
          "Most plans stay in a pending state until your phone first connects to a supported network at your destination. That's when the plan activates and the validity countdown begins — so installing early never wastes your days.",
        ],
      },
      {
        heading: "Why choose an eSIM over a physical SIM?",
        bullets: [
          "Instant delivery — no shipping or store visits.",
          "Keep your main number active for calls and texts while using the eSIM for data.",
          "Switch between multiple plans and countries from one device.",
          "Nothing to lose or damage, since it's built in.",
        ],
      },
      {
        heading: "Is my phone compatible?",
        paragraphs: [
          "Most phones released from 2018 onward support eSIM, including iPhone XS and newer, and recent Samsung Galaxy and Google Pixel models. Your device must also be carrier-unlocked. If you're unsure, our installation guides show you exactly how to check in your phone's settings.",
        ],
      },
    ],
  },
  {
    slug: "how-to-save-on-roaming-charges-abroad",
    title: "How to avoid expensive roaming charges abroad",
    excerpt:
      "Roaming fees can quietly turn into a shocking bill. Here are practical ways to stay connected overseas without overpaying.",
    date: "September 2026",
    readingTime: "5 min read",
    category: "Travel tips",
    sections: [
      {
        paragraphs: [
          "Traditional roaming is convenient, but it's often the most expensive way to use data abroad. A few minutes of maps, messaging, and photo uploads can add up fast when you're paying per megabyte on your home carrier's roaming rate.",
          "The good news: a little planning before you fly can cut your connectivity costs dramatically while keeping you online the moment you land.",
        ],
      },
      {
        heading: "1. Use a travel eSIM",
        paragraphs: [
          "A destination eSIM gives you local data rates without swapping your SIM. You keep your normal number for calls and texts, and use the eSIM purely for affordable data. Because you buy a fixed allowance up front, there are no surprise overage fees.",
        ],
      },
      {
        heading: "2. Turn off roaming on your primary line",
        paragraphs: [
          "Once your eSIM is installed and set as your data line, disable data roaming on your main SIM. This prevents background apps from silently connecting through your expensive home carrier.",
        ],
      },
      {
        heading: "3. Download what you need on Wi-Fi",
        bullets: [
          "Offline maps for your destination.",
          "Boarding passes, tickets, and reservations.",
          "Entertainment for the flight or train.",
        ],
      },
      {
        heading: "4. Right-size your plan",
        paragraphs: [
          "Estimate your daily usage: messaging and maps are light, while video streaming is heavy. Choosing a plan that matches how you actually travel means you won't overpay for data you'll never use — and you can always top up if you need more.",
        ],
      },
    ],
  },
  {
    slug: "esim-installation-tips-for-a-smooth-trip",
    title: "eSIM installation tips for a smooth trip",
    excerpt:
      "A few small habits make eSIM setup effortless. Follow these tips to arrive connected every time.",
    date: "September 2026",
    readingTime: "3 min read",
    category: "Guides",
    sections: [
      {
        heading: "Install before you fly",
        paragraphs: [
          "Set up your eSIM at home on Wi-Fi, a day or two before departure. Installation needs an internet connection, and doing it early means there's nothing to troubleshoot at the airport. Your plan won't start counting down until you connect at your destination.",
        ],
      },
      {
        heading: "Label your plans",
        paragraphs: [
          "When you add the eSIM, give it a clear label like \"Travel\" so it's easy to tell apart from your primary line. Then you can choose which line handles data with a single tap.",
        ],
      },
      {
        heading: "On arrival",
        bullets: [
          "Set the eSIM as your mobile data line.",
          "Turn on Data Roaming for the eSIM (this uses the local partner network, not your home carrier).",
          "Toggle Airplane mode on and off if it doesn't connect within a minute.",
        ],
      },
      {
        heading: "Keep your QR code",
        paragraphs: [
          "Save the confirmation email with your QR code. Some eSIMs can only be installed once, so keeping the details handy is useful if you ever reset your phone.",
        ],
      },
    ],
  },
  {
    slug: "staying-connected-where-apps-are-restricted",
    title: "Staying connected where calling apps are restricted",
    excerpt:
      "In some regions, WhatsApp and FaceTime calls are blocked. Here's how to keep talking to family and friends while you travel.",
    date: "September 2026",
    readingTime: "4 min read",
    category: "Travel tips",
    sections: [
      {
        paragraphs: [
          "In several countries, voice and video calls over apps like WhatsApp, FaceTime, Skype, and Telegram are limited or blocked, even though messaging still works. If you're relying on these apps to stay in touch, it can be a frustrating surprise.",
        ],
      },
      {
        heading: "Why it happens",
        paragraphs: [
          "Some regions restrict VoIP (voice over internet) services for regulatory or commercial reasons. The restriction usually targets the calling feature specifically, so chats and media may still go through while calls fail to connect.",
        ],
      },
      {
        heading: "How a VPN helps",
        paragraphs: [
          "A VPN routes your connection through a server in another location, which can restore access to calling features that would otherwise be blocked. That's why every eSIM4U plan includes free VPN access — so you can call home without hunting for a workaround.",
        ],
      },
      {
        heading: "Practical tips",
        bullets: [
          "Turn on the VPN before opening your calling app.",
          "If a call won't connect, switch VPN server locations and try again.",
          "Keep messaging as a reliable backup for quick check-ins.",
        ],
      },
    ],
  },
];

blogPosts.push(
  {
    slug: "esim-vs-physical-sim-which-is-better-for-travel",
    title: "eSIM vs physical SIM: which is better for travel?",
    excerpt:
      "Physical SIMs still have their place, but for travel an eSIM wins on almost every front. Here's an honest comparison.",
    date: "September 2026",
    readingTime: "5 min read",
    category: "Basics",
    sections: [
      {
        paragraphs: [
          "If you're deciding how to get data on your next trip, it usually comes down to two options: buy a local physical SIM at your destination, or install a travel eSIM before you go. Both connect you to a local network — the difference is in convenience, safety, and flexibility.",
        ],
      },
      {
        heading: "Convenience",
        paragraphs: [
          "A physical SIM means finding a shop, showing ID in some countries, and physically swapping cards (and keeping your home SIM somewhere safe). An eSIM installs in a couple of minutes from your confirmation email, before you even leave home. You land already connected.",
        ],
      },
      {
        heading: "Keeping your number",
        paragraphs: [
          "Swapping a physical SIM means your normal number is offline while you travel. An eSIM runs alongside your primary SIM, so you keep receiving calls and texts on your usual number while using the eSIM for affordable data.",
        ],
      },
      {
        heading: "Safety and flexibility",
        bullets: [
          "Nothing physical to lose, damage, or forget in a hotel room.",
          "Switch between multiple destination plans without carrying a wallet of SIMs.",
          "Buy, top up, or change plans entirely online.",
        ],
      },
      {
        heading: "When a physical SIM still makes sense",
        paragraphs: [
          "If your phone doesn't support eSIM, or you need a local phone number for calls and verification codes at your destination, a physical SIM can still be the better choice. For most travelers with a recent phone, though, an eSIM is simpler and safer.",
        ],
      },
    ],
  },
  {
    slug: "how-much-data-do-i-need-for-my-trip",
    title: "How much data do I really need for my trip?",
    excerpt:
      "Buying too little means running out; too much means wasting money. Here's a simple way to estimate the right eSIM plan size.",
    date: "September 2026",
    readingTime: "4 min read",
    category: "Travel tips",
    sections: [
      {
        paragraphs: [
          "One of the most common questions before a trip is how many gigabytes to buy. The honest answer is that it depends on how you travel — but a few rough numbers make it easy to plan.",
        ],
      },
      {
        heading: "Rough daily usage",
        bullets: [
          "Light (maps, messaging, email): around 300–500 MB per day.",
          "Moderate (social media, browsing, some photos): around 500 MB–1 GB per day.",
          "Heavy (video calls, streaming, uploading lots of media): 1.5–2 GB+ per day.",
        ],
      },
      {
        heading: "A simple formula",
        paragraphs: [
          "Multiply your daily estimate by the number of days you'll rely on mobile data, then add a small buffer. For a one-week trip with moderate use, roughly 5–7 GB is a comfortable choice.",
        ],
      },
      {
        heading: "Save data on the road",
        bullets: [
          "Download maps and playlists on hotel Wi-Fi before heading out.",
          "Set streaming apps to a lower quality on mobile data.",
          "Turn off auto-play video and background app refresh.",
        ],
      },
      {
        heading: "Don't stress about it",
        paragraphs: [
          "If you underestimate, many eSIM4U plans can be topped up, and you can always buy another plan. It's better to start with a sensible size than to overpay for data you won't use.",
        ],
      },
    ],
  },
  {
    slug: "esim4u-referral-program-explained",
    title: "How the eSIM4U referral program works",
    excerpt:
      "Share eSIM4U with friends and you both earn credit. Here's exactly how referrals, rewards, and credit work.",
    date: "September 2026",
    readingTime: "3 min read",
    category: "Guides",
    sections: [
      {
        paragraphs: [
          "Our referral program is a simple way to save on your own travel data by sharing something genuinely useful with friends. When they connect through your link and make their first eligible purchase, you both earn account credit.",
        ],
      },
      {
        heading: "How it works",
        bullets: [
          "Find your unique referral link in your dashboard and share it with a friend.",
          "Your friend signs up using your link and buys their first eligible eSIM plan.",
          "Once their purchase qualifies, you and your friend each receive account credit.",
        ],
      },
      {
        heading: "Using your credit",
        paragraphs: [
          "Referral credit is stored in your account and applied toward future eSIM purchases. It's a great way to keep your ongoing travel data costs down the more you share.",
        ],
      },
      {
        heading: "Good to know",
        paragraphs: [
          "Rewards are granted only after your friend's first eligible purchase qualifies, and credit is subject to the program terms. You can invite as many friends as you like — there's no limit to how much credit you can earn.",
        ],
      },
    ],
  }
);

export function getPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}
