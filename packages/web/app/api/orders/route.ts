import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import QRCode from "qrcode";
import pool from "@/lib/db";
import { assignBundle, fetchOrderById } from "@/lib/montyesim";

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session;
}

function generateOrderReference(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ESIM4U-${timestamp}-${random}`;
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
      `SELECT id, bundle_code, bundle_name, country, country_code, data_amount, validity, price, currency, order_reference, monty_order_id, iccid, qr_code_url, lpa_code, smdp_address, matching_id, bundle_expiry_date, status, created_at FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
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

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items to checkout" }, { status: 400 });
    }

    const results = [];

    for (const item of items) {
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
          `INSERT INTO orders (user_id, user_email, bundle_code, bundle_name, country, country_code, data_amount, validity, price, currency, order_reference, monty_order_id, iccid, qr_code_url, lpa_code, cost_price, smdp_address, matching_id, activation_otp, bundle_expiry_date, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21) RETURNING *`,
          [
            session.user.id,
            session.user.email,
            item.bundle_code,
            item.bundle_name || null,
            item.country || null,
            item.country_code || null,
            item.data_amount || null,
            item.validity || null,
            item.price,
            item.currency || "USD",
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
            "completed",
          ]
        );

        results.push(orderData.rows[0]);
      } catch (assignError: unknown) {
        const errorMsg = assignError instanceof Error ? assignError.message : "Assignment failed";

        await pool.query(
          `INSERT INTO orders (user_id, user_email, bundle_code, bundle_name, country, country_code, data_amount, validity, price, currency, order_reference, cost_price, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
          [
            session.user.id,
            session.user.email,
            item.bundle_code,
            item.bundle_name || null,
            item.country || null,
            item.country_code || null,
            item.data_amount || null,
            item.validity || null,
            item.price,
            item.currency || "USD",
            orderReference,
            item.cost_price ?? null,
            "failed",
          ]
        );

        results.push({ error: errorMsg, bundle_code: item.bundle_code, order_reference: orderReference, status: "failed" });
      }
    }

    await pool.query(`DELETE FROM cart_items WHERE user_id = $1`, [session.user.id]);

    return NextResponse.json({ orders: results }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
