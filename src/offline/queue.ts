/**
 * Durable queue of sales rung up while the backend was unreachable.
 *
 * `localStorage` rather than IndexedDB deliberately: the existing code already
 * mirrors the catalogue there, the records are small and text-only, and the
 * service worker's precache never clears it — so a queued sale survives a page
 * reload, an app restart, and a PWA update. IndexedDB is the upgrade path if one
 * till ever queues tens of thousands of sales.
 *
 * Nothing here talks to the network. The syncer drains it.
 */

export const QUEUE_STORAGE_KEY = 'cashier.salesQueue';

/**
 * The in-progress cart lives beside the queue.
 *
 * A till on a flaky connection loses far more than a connection when the page
 * reloads: a half-rung-up order would vanish. Persisting it means a refresh, a
 * crash, or a PWA update mid-sale costs nothing.
 */
export const CART_STORAGE_PREFIX = 'cashier.cart';

/**
 * Cap on queued sales. Chosen well below the ~5 MB localStorage budget while
 * leaving room for the catalogue cache; a till that hits this has been offline
 * for a very long time and needs the warning, not silent data loss.
 */
export const MAX_QUEUED_SALES = 2000;

export type QueuedSaleLine = {
  item_id: number;
  title: string;
  price_cents: number;
  quantity: number;
};

export type QueuedSale = {
  /** UUID, and the server's idempotency key. Stable across retries. */
  client_ref: string;
  payment: 'cash' | 'paynow';
  items: QueuedSaleLine[];
  total_cents: number;
  /** ISO string from the device clock; the server clamps it. */
  sold_at: string;
  /** Catalogue revision the prices were taken from. */
  catalog_revision: number | null;
  attempts: number;
  last_error: string | null;
  /** Set when the server gave up on this entry; kept, never silently dropped. */
  quarantined?: boolean;
};

function isQueuedSale(value: unknown): value is QueuedSale {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<QueuedSale>;
  return typeof candidate.client_ref === 'string' && Array.isArray(candidate.items);
}

/** Read the queue, tolerating corrupt or absent storage. */
export function readQueue(): QueuedSale[] {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isQueuedSale);
  } catch {
    // A corrupt queue must not take the till down. The operator can see the
    // count drop to zero and re-ring anything genuinely lost.
    return [];
  }
}

function writeQueue(sales: QueuedSale[]): void {
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(sales));
  } catch {
    // Quota or private-mode failure. Nothing useful to do here; the caller
    // surfaces a warning when the queue is near its cap.
  }
}

export function makeClientRef(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for a non-secure context, where randomUUID is unavailable.
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}-${Math.random().toString(16).slice(2, 10)}`;
}

export function enqueueSale(sale: Omit<QueuedSale, 'attempts' | 'last_error'>): { ok: boolean; reason?: string } {
  const queue = readQueue();
  if (queue.length >= MAX_QUEUED_SALES) {
    return {
      ok: false,
      reason: `This device is holding ${queue.length} unsynced sales, which is the limit. Reconnect and sync before selling more.`,
    };
  }
  writeQueue([...queue, { ...sale, attempts: 0, last_error: null }]);
  return { ok: true };
}

export function removeQueuedSale(clientRef: string): void {
  writeQueue(readQueue().filter((sale) => sale.client_ref !== clientRef));
}

/** Record a failed attempt so the operator can see why, without losing the sale. */
export function markAttempt(clientRef: string, error: string): void {
  writeQueue(
    readQueue().map((sale) =>
      sale.client_ref === clientRef ? { ...sale, attempts: sale.attempts + 1, last_error: error } : sale,
    ),
  );
}

/**
 * Set aside an entry the server will never accept.
 *
 * Quarantine rather than delete: the money was taken, so the record must stay
 * visible even if it can never be reconciled automatically.
 */
export function quarantine(clientRef: string, reason: string): void {
  writeQueue(
    readQueue().map((sale) =>
      sale.client_ref === clientRef ? { ...sale, quarantined: true, last_error: reason } : sale,
    ),
  );
}

/** Entries eligible to send: everything not already set aside. */
export function pendingSales(): QueuedSale[] {
  return readQueue().filter((sale) => !sale.quarantined);
}

export function queuedCount(): number {
  return pendingSales().length;
}
