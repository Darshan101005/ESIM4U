import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import QRCode from "qrcode";
import pool from "@/lib/db";
import { assignBundle, fetchOrderById } from "@/lib/montyesim";
import { validatePromoCode, incrementPromoUsage } from "@/lib/promo";
import { validateAffiliateCode, recordAffiliateSale } from "@/lib/affiliate";
import { getFxRates, SupportedCurrency, SUPPORTED_CURRENCIES } from "@/lib/fx";

async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

function generateOrderReference(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ESIM4U-${timestamp}-${random}`;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

async function buildQrDataUrl(activationCode: string | null): Promise<string | null> {
  if (!activationCode) return null;
  try {
    return await QRCode.toDataURL(activationCode, { width: 480, margin: 1, errorCorrectionLevel: "M" });
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await pool.query(
      `SELECT id, bundle_code, bundle_name, country, country_code, data_amount, validity, price, currency, order_reference, monty_order_id, iccid, qr_code_url, lpa_code, smdp_address, matching_id, bundle_expiry_date, display_currency, display_rate, discount_amount, promo_code, affiliate_code, status, created_at FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
      [session.user.id]
    );

    return NextResponse.json({ orders: result.rows });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch orders";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { items } = body;
    const code = (body.code || "").trim();
    const displayCurrency: SupportedCurrency = SUPPORTED_CURRENCIES.includes(body.display_currency)
      ? body.display_currency
      : "USD";

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items to checkout" }, { status: 400 });
    }

    const subtotal = round(items.reduce((sum: number, i: { price: number }) => sum + Number(i.price), 0));

    let totalDiscount = 0;
    let promoCode: string | null = null;
    let affiliateCode: string | null = null;
    let affiliateId: number | null = null;
    let commissionRate = 0;

    if (code) {
      const promo = await validatePromoCode(code, subtotal);
      if (promo.valid) {
        totalDiscount = promo.discountAmount;
        promoCode = promo.code || code;
      } else {
        const affiliate = await validateAffiliateCode(code, subtotal);
        if (affiliate.valid) {
          totalDiscount = affiliate.discountAmount;
          affiliateCode = affiliate.code || code;
          affiliateId = affiliate.affiliateId ?? null;
          commissionRate = affiliate.commissionRate;
        } else {
          return NextResponse.json({ error: promo.reason || "Invalid code" }, { status: 400 });
        }
      }
    }

    let displayRate = 1;
    try {
      const fx = await getFxRates();
      displayRate = fx.rates[displayCurrency];
    } catch {
      if (displayCurrency !== "USD") {
        return NextResponse.json({ error: "Pricing is temporarily unavailable. Please try again shortly." }, { status: 503 });
      }
    }

    let allocatedDiscount = 0;
    const results = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemPrice = Number(item.price);

      let itemDiscount: number;
      if (i === items.length - 1) {
        itemDiscount = round(totalDiscount - allocatedDiscount);
      } else {
        itemDiscount = subtotal > 0 ? round(totalDiscount * (itemPrice / subtotal)) : 0;
        allocatedDiscount = round(allocatedDiscount + itemDiscount);
      }
      const finalPrice = round(Math.max(0, itemPrice - itemDiscount));

      const orderReference = generateOrderReference();

      try {
        const montyResult = await assignBundle({
          bundleCode: item.bundle_code,
          email: session.user.email as string,
          name: (session.user.name as string) || "Customer",
          orderReference,
        });

        const montyOrderId = montyResult.order_id || null;
        let activationCode: string | null = null;
        let smdpAddress: string | null = null;
        let matchingId: string | null = null;
        let activationOtp: string | null = null;
        let iccid: string | null = montyResult.iccid || null;
        let bundleExpiry: string | null = null;

        if (montyOrderId) {
          try {
            const order = await fetchOrderById(montyOrderId);
            if (order) {
              activationCode = order.activation_code || null;
              smdpAddress = order.smdp_address || null;
              matchingId = order.matching_id || null;
              activationOtp = order.otp || null;
              iccid = order.iccid || iccid;
              bundleExpiry = order.bundle_expiry_date || null;
            }
          } catch {}
        }

        const qrCodeUrl = await buildQrDataUrl(activationCode);

        const orderData = await pool.query(
          `INSERT INTO orders (user_id, user_email, bundle_code, bundle_name, country, country_code, data_amount, validity, price, currency, order_reference, monty_order_id, iccid, qr_code_url, lpa_code, cost_price, smdp_address, matching_id, activation_otp, bundle_expiry_date, display_currency, display_rate, discount_amount, promo_code, affiliate_code, status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26) RETURNING *`,
          [
            session.user.id,
            session.user.email,
            item.bundle_code,
            item.bundle_name || null,
            item.country || null,
            item.country_code || null,
            item.data_amount || null,
            item.validity || null,
            finalPrice,
            "USD",
            orderReference,
            montyOrderId,
            iccid,
            qrCodeUrl,
            activationCode,
            item.cost_price ?? null,
            smdpAddress,
            matchingId,
            activationOtp,
            bundleExpiry,
            displayCurrency,
            displayRate,
            itemDiscount,
            promoCode,
            affiliateCode,
            "completed",
          ]
        );

        const savedOrder = orderData.rows[0];
        results.push(savedOrder);

        if (affiliateId && affiliateCode) {
          try {
            await recordAffiliateSale({
              affiliateId,
              affiliateCode,
              orderId: savedOrder.id,
              orderReference,
              saleAmount: finalPrice,
              commissionRate,
            });
          } catch {}
        }
      } catch (assignError: unknown) {
        const errorMsg = assignError instanceof Error ? assignError.message : "Assignment failed";

        await pool.query(
          `INSERT INTO orders (user_id, user_email, bundle_code, bundle_name, country, country_code, data_amount, validity, price, currency, order_reference, cost_price, display_currency, display_rate, discount_amount, promo_code, affiliate_code, status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
          [
            session.user.id,
            session.user.email,
            item.bundle_code,
            item.bundle_name || null,
            item.country || null,
            item.country_code || null,
            item.data_amount || null,
            item.validity || null,
            finalPrice,
            "USD",
            orderReference,
            item.cost_price ?? null,
            displayCurrency,
            displayRate,
            itemDiscount,
            promoCode,
            affiliateCode,
            "failed",
          ]
        );

        results.push({ error: errorMsg, bundle_code: item.bundle_code, order_reference: orderReference, status: "failed" });
      }
    }

    const anySuccess = results.some((r) => r.status === "completed");
    if (promoCode && anySuccess) {
      try {
        await incrementPromoUsage(promoCode);
      } catch {}
    }

    await pool.query(`DELETE FROM cart_items WHERE user_id = $1`, [session.user.id]);

    return NextResponse.json({ orders: results }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
