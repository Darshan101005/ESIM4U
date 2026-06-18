import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, getAdminCookieName } from "@/lib/admin-auth";
import pool from "@/lib/db";
import { getSalesDashboard, getResellerWallet } from "@/lib/montyesim";

function getAdmin(request: NextRequest) {
  const token = request.cookies.get(getAdminCookieName())?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

export async function GET(request: NextRequest) {
  try {
    const admin = getAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [usersResult, ordersResult, revenueResult, costResult, recentOrdersResult] = await Promise.all([
      pool.query(`SELECT COUNT(*) as total FROM "user"`),
      pool.query(`SELECT COUNT(*) as total FROM orders`),
      pool.query(`SELECT COALESCE(SUM(price), 0) as total FROM orders WHERE status = 'completed'`),
      pool.query(`SELECT COALESCE(SUM(cost_price), 0) as total FROM orders WHERE status = 'completed'`),
      pool.query(`SELECT o.id, o.user_email, o.bundle_name, o.country, o.price, o.status, o.created_at FROM orders o ORDER BY o.created_at DESC LIMIT 10`),
    ]);

    const revenue = parseFloat(revenueResult.rows[0].total);
    const cost = parseFloat(costResult.rows[0].total);

    let wallet = null;
    let sales = null;
    try {
      [wallet, sales] = await Promise.all([getResellerWallet(), getSalesDashboard()]);
    } catch {}

    return NextResponse.json({
      stats: {
        totalUsers: parseInt(usersResult.rows[0].total),
        totalOrders: parseInt(ordersResult.rows[0].total),
        totalRevenue: revenue,
        totalCost: cost,
        totalProfit: Math.round((revenue - cost) * 100) / 100,
        walletBalance: wallet?.balance ?? null,
        walletCurrency: wallet?.currency_code || "USD",
      },
      sales: sales
        ? {
            bundlesSold: sales.bundles_sold || [],
            grossSalesUsd: sales.gross_sales_volume_usd ?? 0,
            netSalesUsd: sales.net_sales_volume_usd ?? 0,
            topBundles: sales.top_five_bundles || [],
          }
        : null,
      recentOrders: recentOrdersResult.rows,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch dashboard";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
