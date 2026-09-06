import { NextResponse } from "next/server";

// The Android APK is hosted on GitHub Releases. We serve it through our own
// domain (/api/download/android) so the underlying GitHub link is never shown
// on the website — the QR code and download button both point here.
const APK_URL = "https://github.com/Darshan101005/ESIM4U/releases/download/APK/ESIM4U.apk";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.redirect(APK_URL, 302);
}
