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
  if (init.body && !headers.has('Content-Type')) {
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

export function recordSale(token: string, payment: Payment, items: { item_id: number; quantity: number }[]): Promise<SaleReceipt> {
  return request<SaleReceipt>('/api/sales', { method: 'POST', body: JSON.stringify({ payment, items }) }, token);
}
