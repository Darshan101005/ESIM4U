import crypto from "crypto";

/**
 * Minimal, dependency-free TOTP (RFC 6238) implementation used for admin 2FA.
 * Compatible with Google Authenticator, Authy, 1Password, etc.
 *   - SHA1, 6 digits, 30-second period (the authenticator-app defaults).
 *   - Secrets are Base32 (RFC 4648) so they can be shown as a seed / QR.
 */

const B32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const DIGITS = 6;
const PERIOD = 30;

function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (let i = 0; i < buf.length; i++) {
    value = (value << 8) | buf[i];
    bits += 8;
    while (bits >= 5) {
      out += B32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32_ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

function base32Decode(input: string): Buffer {
  const clean = (input || "").toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = B32_ALPHABET.indexOf(ch);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

/** Fresh random Base32 secret (default 20 bytes -> 32 chars). */
export function generateTotpSecret(bytes = 20): string {
  return base32Encode(crypto.randomBytes(bytes));
}

function hotp(secret: string, counter: number): string {
  const key = base32Decode(secret);
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac("sha1", key).update(msg).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const bin =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return (bin % 10 ** DIGITS).toString().padStart(DIGITS, "0");
}

/**
 * Verify a 6-digit code against the secret. A small window (default +/-1 step)
 * absorbs clock drift between the server and the user's phone.
 */
export function verifyTotp(secret: string, token: string, window = 1): boolean {
  if (!secret || !/^\d{6}$/.test((token || "").trim())) return false;
  const code = token.trim();
  const counter = Math.floor(Date.now() / 1000 / PERIOD);
  for (let i = -window; i <= window; i++) {
    // Constant-time-ish compare per candidate.
    const candidate = hotp(secret, counter + i);
    if (candidate.length === code.length && crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(code))) {
      return true;
    }
  }
  return false;
}

/** otpauth:// URI that authenticator apps import from the QR code. */
export function otpauthURL(secret: string, accountLabel: string, issuer = "eSIM4U Admin"): string {
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: String(DIGITS),
    period: String(PERIOD),
  });
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountLabel)}?${params.toString()}`;
}
