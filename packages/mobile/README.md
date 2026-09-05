# ESIM4U — Android app (Expo / EAS)

A native Android shell that wraps the live **esim4u.uk** website in a WebView, so the
whole product (customer site + admin panel) is available in one app. The native layer
adds a branded splash, a loading animation, first-run onboarding, push notifications,
system dark/light theming, and EAS Update support.

## What's native vs. web

- **Native shell:** splash (orange background + white logo), branded loading screen,
  first-run onboarding, push notifications, hardware-back handling, device theme sync,
  and a small floating menu (Home / Admin panel / Reload).
- **Web (inside the WebView):** every screen — browse, checkout, eSIM install, dashboard,
  and the admin panel — served live from esim4u.uk. Deploy the website and the app
  updates instantly; no store release needed for content changes.

## App flow

1. Native splash (orange, white logo).
2. Branded loading animation (~2.5s, same orange).
3. First launch only: onboarding ("Get Started" opens the customer site; "Admin login"
   opens `/admin`). Returning users go straight to the site.
4. WebView with the full site. The floating "•••" button (bottom-left) jumps to Home,
   the Admin panel, or reloads.

## Configuration

- **App name:** ESIM4U · **Android package:** `uk.esim4u.app`
- **Wrapped URL / hosts:** edit `constants/index.ts` (`SITE_URL`, `ADMIN_URL`,
  `PUSH_TOKEN_ENDPOINT`). Point `SITE_URL` at a staging URL for testing if needed.
- **Theme:** follows the device (light/dark) automatically — the shell injects the
  device scheme into the site before it renders.

## Assets

Logos live in `assets/` (copied from the web `esim4u-logo-white.png` / `esim4u-logo.png`):

- `splash-icon.png` — white logo for the splash + loading screen
- `adaptive-icon.png` — white logo, composited over orange (`#FF561E`) as the Android icon
- `notification-icon.png` — white logo for the status-bar notification icon
- `icon.png` — colored logo (fallback / onboarding)

Replace these with higher-resolution versions any time; keep the same filenames.

## Running locally

```bash
# from packages/mobile
npm run android      # start Metro and open on a device/emulator (dev build/Expo Go)
npm run type-check   # TypeScript check
```

## EAS setup (one-time)

```bash
npm i -g eas-cli
eas login
eas init                 # links the project, sets extra.eas.projectId in app.json
eas update:configure     # adds the updates URL (runtimeVersion is already "appVersion")
```

### Builds (Android only)

```bash
npm run build:preview    # internal APK (share/test)
npm run build:prod       # production AAB for Google Play
```

### Over-the-air updates (EAS Update)

`eas.json` defines `preview` and `production` channels; `runtimeVersion` uses the
`appVersion` policy. Ship JS/asset changes to the shell without a new store build:

```bash
npm run update           # publishes to the "production" branch/channel
```

Note: content changes on the website appear instantly (it's a live WebView). EAS Update
is for changes to the **native shell** (splash, onboarding, WebView logic, etc.).

## Notifications

Native push is intentionally **not** used. Notifications are shown inside the website
(the in-app notification bell), which the WebView displays. This keeps the app simple and
avoids the Expo Go limitation around remote push. If native push is wanted later, add
`expo-notifications` back with a development build + FCM credentials.

## Notes / future native add-ons

- The WebView keeps login sessions via persistent cookies.
- Payments (Stripe/PayPal) load inside the WebView so redirects return into the app.
- Optional later: QR-code save-to-photos, camera QR scanning, biometric unlock.
