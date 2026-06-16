import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

const VALID_EVENTS = ["signup", "login", "login_failed", "logout", "password_change"];

function extractClientIP(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0].trim();
    if (first && first !== "::1" && first !== "127.0.0.1") return first;
  }
  const realIP = request.headers.get("x-real-ip");
  if (realIP && realIP !== "::1" && realIP !== "127.0.0.1") return realIP.trim();
  return null;
}

function isIPv4(ip: string): boolean {
  return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip);
}

function nativeHttpsGet(url: string): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const https = require("https");
    const req = https.get(url, {
      headers: {
        "User-Agent": "node-fetch/1.0",
        "Accept": "application/json",
      },
      timeout: 5000,
    }, (res: any) => {
      let body = "";
      res.on("data", (chunk: any) => (body += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          reject(new Error("JSON parse failed"));
        }
      });
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Timeout")); });
  });
}

async function resolvePublicIPv4(): Promise<string | null> {
  try {
    const res = await fetch("https://api4.ipify.org?format=json", {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.ip && isIPv4(data.ip)) return data.ip;
    }
  } catch {}
  return null;
}

async function fetchGeoData(ip: string) {
  try {
    const [ipwhoRes, ipapiRes] = await Promise.allSettled([
      nativeHttpsGet(`https://ipwho.is/${ip}`),
      fetch(`https://api.ipapi.is/?q=${ip}`, {
        headers: { "User-Agent": "node-fetch/1.0", "Accept": "application/json" },
        signal: AbortSignal.timeout(5000),
      }),
    ]);

    let ipwho: any = null;
    let ipapi: any = null;

    if (ipwhoRes.status === "fulfilled" && ipwhoRes.value.status >= 200 && ipwhoRes.value.status < 300) {
      const d = ipwhoRes.value.data;
      if (d.success !== false) ipwho = d;
    }

    if (ipapiRes.status === "fulfilled" && ipapiRes.value.ok) {
      ipapi = await ipapiRes.value.json();
    }

    return { ipwho, ipapi };
  } catch {
    return { ipwho: null, ipapi: null };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, eventType, clientIpv4, clientIpv6 } = body;

    if (!eventType || !VALID_EVENTS.includes(eventType)) {
      return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
    }

    if (!userId && !email) {
      return NextResponse.json({ error: "userId or email is required" }, { status: 400 });
    }

    const headerIP = extractClientIP(request);
    const userAgent = request.headers.get("user-agent") || null;

    let finalIpv4: string | null = null;
    let finalIpv6: string | null = null;

    if (headerIP) {
      if (isIPv4(headerIP)) {
        finalIpv4 = headerIP;
      } else if (headerIP.includes(":")) {
        finalIpv6 = headerIP;
      }
    }

    if (!finalIpv4) {
      const serverPublicIP = await resolvePublicIPv4();
      if (serverPublicIP) {
        finalIpv4 = serverPublicIP;
      }
    }

    if (clientIpv4 && typeof clientIpv4 === "string" && isIPv4(clientIpv4)) {
      if (!finalIpv4) {
        finalIpv4 = clientIpv4;
      }
    }

    if (clientIpv6 && typeof clientIpv6 === "string" && clientIpv6.includes(":") && clientIpv6 !== "::1") {
      finalIpv6 = clientIpv6;
    }

    const lookupIP = finalIpv4 || finalIpv6;
    const { ipwho, ipapi } = lookupIP ? await fetchGeoData(lookupIP) : { ipwho: null, ipapi: null };

    const flag = ipwho?.flag;
    const connection = ipwho?.connection;
    const tz = ipwho?.timezone;
    const company = ipapi?.company;
    const loc = ipapi?.location;

    await pool.query(
      `INSERT INTO activity_log (
        user_id, email, event_type,
        ipv4, ipv6, continent, country, country_code,
        region, city, latitude, longitude, postal, calling_code,
        flag_img, flag_emoji, currency_code, timezone_id, timezone_utc,
        isp, org, is_vpn, vpn_service, vpn_url,
        is_proxy, is_tor, is_datacenter, is_mobile, is_crawler, is_abuser,
        user_agent
      ) VALUES (
        $1, $2, $3,
        $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19,
        $20, $21, $22, $23, $24,
        $25, $26, $27, $28, $29, $30,
        $31
      )`,
      [
        userId || null,
        email || null,
        eventType,
        finalIpv4,
        finalIpv6,
        ipwho?.continent || null,
        ipwho?.country || null,
        ipwho?.country_code || null,
        ipwho?.region || null,
        ipwho?.city || null,
        ipwho?.latitude ?? null,
        ipwho?.longitude ?? null,
        ipwho?.postal || null,
        ipwho?.calling_code || null,
        flag?.img || null,
        flag?.emoji || null,
        loc?.currency_code || null,
        tz?.id || null,
        tz?.utc || null,
        connection?.isp || company?.name || null,
        connection?.org || company?.name || null,
        !!ipapi?.is_vpn,
        ipapi?.vpn?.service || null,
        ipapi?.vpn?.url || null,
        !!ipapi?.is_proxy,
        !!ipapi?.is_tor,
        !!ipapi?.is_datacenter,
        !!ipapi?.is_mobile,
        !!ipapi?.is_crawler,
        !!ipapi?.is_abuser,
        userAgent,
      ]
    );

    return NextResponse.json({ message: "Activity logged" });
  } catch {
    return NextResponse.json({ error: "Failed to log activity" }, { status: 500 });
  }
}
