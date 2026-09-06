/**
 * Curated knowledge base for the eSIM4U assistant. Hand-written so it fits in
 * the model's context — no vector DB needed. Keep it factual and current; it's
 * the single source of truth the bot answers from.
 */

export const CHATBOT_KNOWLEDGE = `
# About eSIM4U
eSIM4U (https://esim4u.uk) sells prepaid travel eSIMs for 190+ countries. An eSIM is a digital SIM
built into the phone — there's no physical card to insert. You buy a plan, instantly receive a QR
code + activation details, scan it once, and get mobile data abroad with no surprise roaming bills.
You can keep your home SIM active for calls/texts and use the eSIM4U eSIM just for data.

# eSIM device compatibility — how to answer ANY phone model
A phone works with eSIM4U if it is (1) eSIM-capable AND (2) carrier-unlocked. If a user names a
specific phone, apply these rules; if you're not 100% sure for an exact model/region, say it
"most likely works if it's eSIM-capable and unlocked" and give the check method below.

Universal check method (works for any phone):
- Dial *#06# — if an "EID" number is shown, the phone has an eSIM.
- Or look in Settings for an "Add eSIM" / "Add data plan" / "Add mobile plan" option (iPhone:
  Settings > Mobile Data/Cellular; Android: Settings > Network & internet > SIMs).
- The phone must also be unlocked (not tied to one carrier).

General support by brand (most models from ~2018 onward support eSIM):
- Apple iPhone: XR, XS, XS Max and everything newer — iPhone 11/12/13/14/15/16 series, and SE (2020)
  & SE (2022). Exception: iPhones bought in mainland China have no eSIM. iPhone 14/15/16 in the US
  are eSIM-only.
- Samsung Galaxy: S20 and newer (S20/S21/S22/S23/S24/S25), Note 20, Z Fold/Z Flip series, and many
  A-series (e.g. A54/A55) — support varies slightly by region/variant.
- Google Pixel: Pixel 3 and newer (Pixel 4/4a/5/6/7/8/9 broadly supported; Pixel 3 depends on region).
- Other brands with many eSIM models: Motorola (Razr, Edge, some G), Sony Xperia (1/5/10 IV+),
  Oppo (Find X series, Reno some), Huawei (P40, Mate 40 some), Honor (Magic series), Nokia (some
  X-series), Rakuten, Fairphone, Microsoft Surface Duo. For Xiaomi/Redmi and others, eSIM depends on
  the exact model and region — tell the user to run the *#06#/EID check.
Tablets/watches: iPad (Wi‑Fi + Cellular models), Apple Watch, Samsung Galaxy Watch/Tab (cellular)
also support eSIM.

# Buying a plan
- Browse plans by country or region, choose data amount + validity, and pay.
- After payment the eSIM (QR + activation details) is delivered instantly on-screen and by email; if
  you've linked Telegram it's sent there too. It's always available later in your dashboard.
- Each plan has a data allowance and a validity window (e.g. 7 / 15 / 30 days). Validity typically
  starts on first use/activation (when the eSIM first connects to a network abroad).
- Regional and multi-country plans exist for trips covering several countries.

# Payment methods
- Card (Visa/Mastercard) and PayPal at checkout.
- eSIM4U Wallet balance — top up once, pay from balance.
- Any additional methods shown at checkout. Prices are shown live in your chosen currency.

# Installing / activating an eSIM (full guide at /installation)
- iPhone: Settings > Mobile Data (or Cellular) > Add eSIM > Use QR Code > scan the QR.
- Android (Samsung/Pixel/etc.): Settings > Network & internet > SIMs > Add eSIM > scan the QR.
- Can't scan? Enter the details manually (SM-DP+ address + activation code) shown with your order.
- IMPORTANT after install: turn ON "Data Roaming" for the eSIM line so it can connect abroad, and set
  the eSIM as your Mobile Data line. Keep your home SIM for calls if you like.
- Install before you travel (needs internet to install), but it usually only starts counting when it
  first connects to a network at your destination.

# Coverage & speed
- 190+ countries. Networks used are local partner carriers; speed (4G/5G) depends on the destination
  network and your phone. Coverage details are shown on each plan.

# Wallet
- Top up your wallet and pay for plans from the balance. Manage it in the dashboard under Wallet.

# Referrals (Refer & Earn)
- Share your referral link; when a referred friend makes a qualifying purchase, you earn account
  credit to use on future plans. See Referrals in your dashboard.

# Affiliate program
- Public affiliate program for creators/partners at /affiliate.

# Your account / dashboard
- "My eSIMs": view eSIMs, QR codes, status, and live remaining data.
- Wallet, Referrals, Orders and Profile are all in the dashboard.
- You can also use the Telegram bot @esim4u_uk_bot to view eSIMs, wallet, usage and chat with support.

# Apps
- Android app (APK) and installable PWA at /download. iPhone users add the site to the Home Screen
  from Safari (Share > Add to Home Screen).

# Refunds, terms & privacy
- Refunds follow the Refund Policy at /refund-policy (generally unused or genuinely faulty eSIMs;
  once data is used a plan usually can't be refunded). Terms: /terms. Privacy: /privacy. Cookies:
  /cookie-policy. For a refund request, direct the user to contact support with their order reference.

# Support / contact
- Email: support@esim4u.uk
- Live chat + WhatsApp from the site; Telegram bot @esim4u_uk_bot also offers support.
- For anything account-specific you can't resolve, tell the user to contact support with their order reference.

# Troubleshooting
- No data after install: ensure Data Roaming is ON for the eSIM line, the eSIM is the active data
  line, the plan is activated, and you're in a covered country. Toggle Airplane mode on/off or reboot.
  Check remaining data in the dashboard.
- Didn't get the QR: check spam, or open "My eSIMs" in the dashboard (QR is always there).
- "Cannot add cellular plan"/install fails: confirm the phone is eSIM-capable (EID check) and
  unlocked, and that the QR hasn't already been installed once (each QR installs one time).
- Slow speeds: try switching the phone's network mode, or reseat the eSIM; speed depends on the local network.
`.trim();
