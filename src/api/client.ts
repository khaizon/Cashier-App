/**
 * REST client for the FastAPI backend.
 *
 * Replaces the old gapi/Google Sheets access. The catalog payload the backend
 * returns matches the shapes the rest of the app already uses.
 */

// Runtime configuration injected by the container (chart ConfigMap). Falls back
// to build-time VITE_API_BASE_URL, then to the local dev backend.
type CashierRuntimeConfig = {
  /** Base path the SPA is served under, e.g. "/" or "/Cashier-App/". */
  basePath?: string;
  /** Origin/base the API is called on. "/" means same-origin. */
  apiBaseUrl?: string;
};

const runtimeConfig: CashierRuntimeConfig =
  (typeof window !== 'undefined' ? window.__CASHIER_CONFIG__ : undefined) ?? {};

/**
 * Work out the path the SPA is served under, without a rebuild.
 *
 * `config.js` may omit `basePath` (the container leaves it unset), so this falls
 * back to reading it off the built module script's own URL — Vite rewrites that
 * tag with the base it built for. That keeps one bundle usable both at the root
 * and under `/Cashier-App/`.
 *
 * Deliberately not `import.meta.env.BASE_URL`: that is fixed at build time, so
 * it cannot adapt to how the image actually gets hosted.
 */
function detectBasePath(): string {
  if (typeof document === 'undefined') return '/';
  const moduleScript = Array.from(document.scripts).find(
    (script) => script.type === 'module' && script.src.includes('/assets/'),
  );
  if (moduleScript) {
    const index = moduleScript.src.indexOf('/assets/');
    try {
      return new URL(moduleScript.src.slice(0, index + 1)).pathname;
    } catch {
      // Fall through to the default below.
    }
  }
  return '/';
}

// Normalise to a trailing-slash form ("/" or "/Cashier-App/").
const BASE_PATH = (() => {
  const source = runtimeConfig.basePath ?? detectBasePath();
  const trimmed = source.replace(/^\/+/, '').replace(/\/+$/, '');
  return trimmed ? `/${trimmed}/` : '/';
})();
// Prefix for site-relative assets stored in the catalog (e.g. "/maomao.png").
const SITE_PREFIX = BASE_PATH === '/' ? '' : BASE_PATH.replace(/\/$/, '');

// 127.0.0.1 rather than localhost: uvicorn binds IPv4 by default, while Node and
// some browsers resolve `localhost` to ::1 first. Set VITE_API_BASE_URL to point
// somewhere else. The empty string means same-origin, which is what the
// container uses so the ingress can route /api itself.
const API_BASE_URL = (() => {
  const configured =
    runtimeConfig.apiBaseUrl === '/'
      ? ''
      : (runtimeConfig.apiBaseUrl ?? import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000');
  return configured.replace(/\/+$/, '');
})();

/**
 * Absolute URL for an image shown in an `<img>`.
 *
 * Catalog rows carry two kinds of value: legacy site-relative paths that the
 * SPA already serves (e.g. `/Cashier-App/maomao.png`, resolved against the
 * origin) and backend-owned API paths (e.g. `/api/images/abc?v=1`, resolved
 * against the API). `API_BASE_URL` is usually a different origin in dev, so the
 * two must not be mixed up.
 */
export function resolveImageSrc(img: string): string {
  if (!img) return '';
  if (/^[a-z][a-z0-9+.-]*:/i.test(img) || img.startsWith('//')) return img;
  if (img.startsWith('/api/')) return `${API_BASE_URL}${img}`;
  return `${SITE_PREFIX}${img}`;
}

export class ApiError extends Error {
  /** HTTP status, or 0 when the server could not be reached at all. */
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export type Payment = 'cash' | 'paynow';

export type SaleReceipt = {
  id: number;
  order_ref: string;
  payment: Payment;
  total: number;
  created_at: string;
  items: { item_id: number | null; title: string; price: number; quantity: number; subtotal: number }[];
};

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (body && typeof body === 'object' && 'detail' in body) {
      const { detail } = body as { detail: unknown };
      if (typeof detail === 'string') return detail;
      // FastAPI validation errors arrive as a list of {loc, msg, ...}
      if (Array.isArray(detail)) {
        return detail
          .map((entry) => (entry && typeof entry === 'object' && 'msg' in entry ? String((entry as { msg: unknown }).msg) : String(entry)))
          .join('; ');
      }
    }
  } catch {
    // fall through to the generic message
  }
  return `Request failed (HTTP ${response.status})`;
}

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(init.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  // FormData must keep the browser's own Content-Type: it carries the multipart
  // boundary. Forcing JSON here silently breaks image uploads.
  const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData;
  if (init.body && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError('Cannot reach the server. Is the backend running?', 0);
  }

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

/** OAuth2 password flow: form-encoded credentials in, bearer token out. */
export async function login(username: string, password: string): Promise<string> {
  const body = new URLSearchParams({ username, password });
  const result = await request<{ access_token: string }>(
    '/api/auth/token',
    {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    },
  );
  return result.access_token;
}

export function fetchCatalog(token: string): Promise<CategoryItem[]> {
  return request<CategoryItem[]>('/api/catalog', {}, token);
}

// ------------------------------------------------------------------ CMS / admin

export type AdminItem = {
  id: number;
  category_id: number;
  title: string;
  /** Integer cents, the storage unit. Divide by 100 only for display. */
  price_cents: number;
  img: string;
  image_id: number | null;
  image_url: string | null;
  sort_order: number;
};

export type AdminCategory = {
  id: number;
  name: string;
  palette1: string;
  palette2: string;
  palette3: string;
  sort_order: number;
  items: AdminItem[];
};

export type UploadedImage = {
  id: number;
  url: string;
  width: number;
  height: number;
  byte_size: number;
  content_type: string;
  original_filename: string;
};

/** Normalised crop rectangle, each value 0..1 of the oriented source image. */
export type CropBox = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export function fetchAdminCatalog(token: string): Promise<AdminCategory[]> {
  return request<AdminCategory[]>('/api/admin/catalog', {}, token);
}

export function createCategory(token: string, name: string): Promise<AdminCategory> {
  return request<AdminCategory>('/api/admin/categories', { method: 'POST', body: JSON.stringify({ name }) }, token);
}

export function updateCategory(
  token: string,
  categoryId: number,
  patch: Partial<Pick<AdminCategory, 'name' | 'palette1' | 'palette2' | 'palette3' | 'sort_order'>>,
): Promise<AdminCategory> {
  return request<AdminCategory>(
    `/api/admin/categories/${categoryId}`,
    { method: 'PATCH', body: JSON.stringify(patch) },
    token,
  );
}

export function deleteCategory(token: string, categoryId: number): Promise<void> {
  return request<void>(`/api/admin/categories/${categoryId}`, { method: 'DELETE' }, token);
}

/**
 * Replace the menu order of every category.
 *
 * Sends the complete ordered id list rather than a per-category `sort_order` so
 * a reorder is one atomic request; the server rejects a list that does not name
 * every category exactly once.
 */
export function reorderCategories(token: string, ids: number[]): Promise<AdminCategory[]> {
  return request<AdminCategory[]>(
    '/api/admin/categories/order',
    { method: 'PUT', body: JSON.stringify({ ids }) },
    token,
  );
}

export function createItem(
  token: string,
  payload: { category_id: number; title: string; price_cents: number; image_id?: number | null },
): Promise<AdminItem> {
  return request<AdminItem>('/api/admin/items', { method: 'POST', body: JSON.stringify(payload) }, token);
}

export function updateItem(
  token: string,
  itemId: number,
  patch: Partial<{
    category_id: number;
    title: string;
    price_cents: number;
    image_id: number | null;
    img: string;
    sort_order: number;
  }>,
): Promise<AdminItem> {
  return request<AdminItem>(`/api/admin/items/${itemId}`, { method: 'PATCH', body: JSON.stringify(patch) }, token);
}

export function deleteItem(token: string, itemId: number): Promise<void> {
  return request<void>(`/api/admin/items/${itemId}`, { method: 'DELETE' }, token);
}

/**
 * Upload an image, optionally cropped to a square.
 *
 * The crop is sent as normalised coordinates rather than cropped pixels so the
 * server can apply it to the full-resolution original. The backend re-derives a
 * square from these regardless of what is sent.
 */
export async function uploadItemImage(token: string, file: File, crop?: CropBox | null): Promise<UploadedImage> {
  const form = new FormData();
  form.append('file', file);
  if (crop) {
    form.append('crop_left', String(crop.left));
    form.append('crop_top', String(crop.top));
    form.append('crop_right', String(crop.right));
    form.append('crop_bottom', String(crop.bottom));
  }
  // No explicit Content-Type: the browser must add the multipart boundary.
  return request<UploadedImage>('/api/images', { method: 'POST', body: form }, token);
}

/**
 * Record a sale.
 *
 * `clientRef` is the idempotency key and should be supplied whenever the caller
 * might retry — a lost response is indistinguishable from a failure, so without
 * it a retry bills the customer twice.
 */
export function recordSale(
  token: string,
  payment: Payment,
  items: { item_id: number; quantity: number }[],
  clientRef?: string,
): Promise<SaleReceipt> {
  const body: Record<string, unknown> = { payment, items };
  if (clientRef) body.client_ref = clientRef;
  return request<SaleReceipt>('/api/sales', { method: 'POST', body: JSON.stringify(body) }, token);
}

// -------------------------------------------------------------- offline sync

export type SyncSaleLine = {
  item_id: number;
  title: string;
  price_cents: number;
  quantity: number;
  subtotal_cents: number;
};

export type SyncSale = {
  client_ref: string;
  payment: Payment;
  sold_at: string;
  catalog_revision: number | null;
  items: SyncSaleLine[];
};

export type SyncSaleResult = {
  client_ref: string;
  status: 'recorded' | 'duplicate' | 'rejected';
  sale_id: number | null;
  order_ref: string | null;
  price_conflict: boolean;
  reason: string | null;
};

export type SyncBatchResult = {
  results: SyncSaleResult[];
  recorded: number;
  duplicates: number;
  rejected: number;
  conflicts: number;
};

/** Reconcile sales rung up offline. Idempotent per `client_ref` on the server. */
export function syncSales(token: string, sales: SyncSale[]): Promise<SyncBatchResult> {
  return request<SyncBatchResult>('/api/sales/sync', { method: 'POST', body: JSON.stringify({ sales }) }, token);
}

export type CatalogRevision = { revision: number };

export function fetchCatalogRevision(token: string): Promise<CatalogRevision> {
  return request<CatalogRevision>('/api/catalog/revision', {}, token);
}

/**
 * Is the backend reachable right now?
 *
 * Deliberately not `navigator.onLine`: that reports whether a network interface
 * exists, not whether the API can be reached, and it is wrong behind captive
 * portals and VPNs — it would claim "online" while every sale fails.
 */
export async function probeBackend(timeoutMs = 4000): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

// ------------------------------------------------------------------- reporting

export type PeriodTotals = {
  revenue: number;
  transactions: number;
  items_sold: number;
  average_sale: number;
};

export type DailyTotal = {
  /** ISO calendar date (YYYY-MM-DD). */
  date: string;
  revenue: number;
  transactions: number;
};

export type PaymentSplit = {
  payment: Payment;
  revenue: number;
  transactions: number;
  /** Fraction of period revenue, 0..1. */
  share: number;
};

export type TopItem = {
  title: string;
  quantity: number;
  revenue: number;
};

export type SalesStats = {
  range: { days: number; start: string; end: string };
  today: PeriodTotals;
  period: PeriodTotals;
  daily: DailyTotal[];
  payments: PaymentSplit[];
  top_items: TopItem[];
};

export function fetchSalesStats(token: string, days: number): Promise<SalesStats> {
  return request<SalesStats>(`/api/sales/stats?days=${days}`, {}, token);
}

export function fetchRecentSales(token: string, limit: number, offset: number): Promise<SaleReceipt[]> {
  return request<SaleReceipt[]>(`/api/sales?limit=${limit}&offset=${offset}`, {}, token);
}

export type DeletedSale = {
  id: number;
  sale_id: number;
  order_ref: string;
  total: number;
  payment: string;
  reason: string;
  deleted_by: string | null;
  deleted_at: string;
};

/**
 * Delete a recorded sale.
 *
 * The server requires a reason and keeps an audit record, so this is not a
 * silent removal — see `app/routers/sales.py`.
 */
export function deleteSale(token: string, saleId: number, reason: string): Promise<DeletedSale> {
  return request<DeletedSale>(
    `/api/sales/${saleId}`,
    { method: 'DELETE', body: JSON.stringify({ reason }) },
    token,
  );
}

export function fetchDeletedSales(token: string, limit = 50): Promise<DeletedSale[]> {
  return request<DeletedSale[]>(`/api/sales/deletions?limit=${limit}`, {}, token);
}

/**
 * Download the sales CSV for a window.
 *
 * The endpoint needs a bearer token, which a plain `<a href>` download cannot
 * send, so the file is fetched and handed to the browser as a blob. The server
 * names the file; its suggestion is preferred over anything invented here.
 */
export async function downloadSalesCsv(token: string, days: number): Promise<void> {
  const headers = new Headers({ Authorization: `Bearer ${token}` });

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/sales/export.csv?days=${days}`, { headers });
  } catch {
    throw new ApiError('Cannot reach the server. Is the backend running?', 0);
  }
  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }

  const disposition = response.headers.get('Content-Disposition') ?? '';
  const match = /filename="?([^";]+)"?/i.exec(disposition);
  const filename = match?.[1] ?? `cashier-sales-${new Date().toISOString().slice(0, 10)}.csv`;

  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
