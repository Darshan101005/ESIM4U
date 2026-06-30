const MONTYESIM_API_URL = process.env.MONTYESIM_API_URL || "https://resellerapi.montyesim.com/api/v0";
const MONTYESIM_USERNAME = process.env.MONTYESIM_USERNAME || "";
const MONTYESIM_PASSWORD = process.env.MONTYESIM_PASSWORD || "";

const ALLOWED_PAGE_SIZES = [10, 25, 50, 100];

interface TokenCache {
  accessToken: string;
  refreshToken: string;
  resellerId: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

function resolveExpiry(expiresIn: unknown): number {
  const value = typeof expiresIn === "number" ? expiresIn : Number(expiresIn);
  if (!value || Number.isNaN(value)) {
    return Date.now() + 3500 * 1000;
  }
  if (value > 1_000_000_000_000) {
    return value;
  }
  if (value > 1_000_000_000) {
    return value * 1000;
  }
  return Date.now() + value * 1000;
}

function clampPageSize(size?: number): number {
  if (!size) return 100;
  return ALLOWED_PAGE_SIZES.reduce((prev, curr) =>
    Math.abs(curr - size) < Math.abs(prev - size) ? curr : prev
  );
}

async function login(): Promise<TokenCache> {
  const res = await fetch(`${MONTYESIM_API_URL}/Agent/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: MONTYESIM_USERNAME,
      password: MONTYESIM_PASSWORD,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`MontyeSIM login failed: ${res.status} ${errorText}`);
  }

  const data = await res.json();

  tokenCache = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    resellerId: data.reseller_id,
    expiresAt: resolveExpiry(data.expires_in),
  };

  return tokenCache;
}

export async function getAccessToken(): Promise<{ token: string; resellerId: string }> {
  if (tokenCache && Date.now() < tokenCache.expiresAt - 60000) {
    return { token: tokenCache.accessToken, resellerId: tokenCache.resellerId };
  }

  const cache = await login();
  return { token: cache.accessToken, resellerId: cache.resellerId };
}

async function montyFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const { token } = await getAccessToken();
  return fetch(`${MONTYESIM_API_URL}${path}`, {
    ...init,
    headers: {
      "Access-Token": token,
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
}

export interface BundleFilters {
  countryCode?: string;
  regionCode?: string;
  bundleCategory?: string;
  bundleName?: string;
  bundleCode?: string;
  currencyCode?: string;
  pageSize?: number;
  pageNumber?: number;
}

export async function fetchBundles(filters: BundleFilters = {}) {
  const { resellerId } = await getAccessToken();

  const params = new URLSearchParams();
  params.set("reseller_id", resellerId);
  params.set("currency_code", filters.currencyCode || "USD");
  params.set("page_size", String(clampPageSize(filters.pageSize)));
  if (filters.pageNumber) params.set("page_number", String(filters.pageNumber));
  if (filters.countryCode) params.set("country_code", filters.countryCode);
  if (filters.regionCode) params.set("region_code", filters.regionCode);
  if (filters.bundleCategory) params.set("bundle_category", filters.bundleCategory);
  if (filters.bundleName) params.set("bundle_name", filters.bundleName);
  if (filters.bundleCode) params.set("bundle_code", filters.bundleCode);

  const res = await montyFetch(`/Bundles?${params.toString()}`);

  if (!res.ok) {
    if (res.status === 204) return { bundles: [], total_bundles_count: 0 };
    const errorText = await res.text();
    throw new Error(`Failed to fetch bundles: ${res.status} ${errorText}`);
  }

  return res.json();
}

export async function fetchAvailableCountries() {
  const { resellerId } = await getAccessToken();
  const params = new URLSearchParams({ reseller_id: resellerId });
  const res = await montyFetch(`/AvailableCountries?${params.toString()}`);

  if (!res.ok) {
    if (res.status === 204) return { countries: [] };
    const errorText = await res.text();
    throw new Error(`Failed to fetch countries: ${res.status} ${errorText}`);
  }

  return res.json();
}

export async function fetchAvailableRegions() {
  const { resellerId } = await getAccessToken();
  const params = new URLSearchParams({ reseller_id: resellerId });
  const res = await montyFetch(`/AvailableRegions?${params.toString()}`);

  if (!res.ok) {
    if (res.status === 204) return { regions: [] };
    const errorText = await res.text();
    throw new Error(`Failed to fetch regions: ${res.status} ${errorText}`);
  }

  return res.json();
}

export interface AssignBundleParams {
  bundleCode: string;
  email: string;
  name: string;
  orderReference: string;
  whatsappNumber?: string;
  currencyCode?: string;
}

export async function assignBundle(params: AssignBundleParams) {
  const { resellerId } = await getAccessToken();

  const queryParams = new URLSearchParams();
  queryParams.set("reseller_id", resellerId);
  queryParams.set("currency_code", params.currencyCode || "USD");

  const res = await montyFetch(`/Bundles?${queryParams.toString()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bundle_code: params.bundleCode,
      email: params.email,
      name: params.name,
      order_reference: params.orderReference,
      ...(params.whatsappNumber && { whatsapp_number: params.whatsappNumber }),
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to assign bundle: ${res.status} ${errorText}`);
  }

  return res.json();
}

export interface OrderFilters {
  orderId?: string;
  orderReference?: string;
  startDate?: string;
  endDate?: string;
  currencyCode?: string;
  pageSize?: number;
  pageNumber?: number;
}

export async function fetchOrders(filters: OrderFilters = {}) {
  const { resellerId } = await getAccessToken();

  const params = new URLSearchParams();
  params.set("reseller_id", resellerId);
  params.set("currency_code", filters.currencyCode || "USD");
  params.set("page_size", String(clampPageSize(filters.pageSize)));
  if (filters.pageNumber) params.set("page_number", String(filters.pageNumber));
  if (filters.orderId) params.set("order_id", filters.orderId);
  if (filters.orderReference) params.set("order_reference", filters.orderReference);
  if (filters.startDate) params.set("startDate", filters.startDate);
  if (filters.endDate) params.set("endDate", filters.endDate);

  const res = await montyFetch(`/Orders?${params.toString()}`);

  if (!res.ok) {
    if (res.status === 204) return { orders: [], total_orders_count: 0 };
    const errorText = await res.text();
    throw new Error(`Failed to fetch orders: ${res.status} ${errorText}`);
  }

  return res.json();
}

export async function fetchOrderById(orderId: string) {
  const data = await fetchOrders({ orderId, pageSize: 10 });
  const orders = data.orders || [];
  return orders.find((o: { order_id?: string }) => o.order_id === orderId) || orders[0] || null;
}

export async function fetchConsumption(orderId: string, orderReference?: string) {
  const { resellerId } = await getAccessToken();

  // MontyeSIM requires EITHER order_id OR previous_order_reference, never both.
  const params = new URLSearchParams();
  params.set("reseller_id", resellerId);
  if (orderId) {
    params.set("order_id", orderId);
  } else if (orderReference) {
    params.set("previous_order_reference", orderReference);
  }

  const res = await montyFetch(`/Orders/Consumption?${params.toString()}`);

  if (!res.ok) {
    if (res.status === 204) return null;
    const errorText = await res.text();
    throw new Error(`Failed to fetch consumption: ${res.status} ${errorText}`);
  }

  return res.json();
}

export async function fetchAvailableTopups(bundleCode: string, countryCode?: string) {
  const { resellerId } = await getAccessToken();

  const params = new URLSearchParams();
  params.set("reseller_id", resellerId);
  params.set("bundle_code", bundleCode);
  if (countryCode) params.set("country_code", countryCode);
  params.set("currency_code", "USD");

  const res = await montyFetch(`/Bundles/AvailableTopup?${params.toString()}`);

  if (!res.ok) {
    if (res.status === 204) return { bundles: [] };
    const errorText = await res.text();
    throw new Error(`Failed to fetch topups: ${res.status} ${errorText}`);
  }

  return res.json();
}

export async function getResellerWallet() {
  const { resellerId } = await getAccessToken();
  const res = await montyFetch(`/Reseller/${resellerId}`);

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch wallet: ${res.status} ${errorText}`);
  }

  return res.json();
}

export async function getSalesDashboard() {
  const { resellerId } = await getAccessToken();
  const params = new URLSearchParams({ reseller_id: resellerId });
  const res = await montyFetch(`/Orders/Dashboard?${params.toString()}`);

  if (!res.ok) {
    if (res.status === 204) {
      return { bundles_sold: [], gross_sales_volume_usd: 0, net_sales_volume_usd: 0, top_five_bundles: [] };
    }
    const errorText = await res.text();
    throw new Error(`Failed to fetch sales dashboard: ${res.status} ${errorText}`);
  }

  return res.json();
}
