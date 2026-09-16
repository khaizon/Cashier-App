/**
 * REST client for the FastAPI backend.
 *
 * Replaces the old gapi/Google Sheets access. The catalog payload the backend
 * returns matches the shapes the rest of the app already uses.
 */

// 127.0.0.1 rather than localhost: uvicorn binds IPv4 by default, while Node and
// some browsers resolve `localhost` to ::1 first. Set VITE_API_BASE_URL to point
// somewhere else.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000').replace(/\/+$/, '');

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
  return img;
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

export function recordSale(token: string, payment: Payment, items: { item_id: number; quantity: number }[]): Promise<SaleReceipt> {
  return request<SaleReceipt>('/api/sales', { method: 'POST', body: JSON.stringify({ payment, items }) }, token);
}
