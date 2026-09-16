/**
 * Drains the offline sales queue whenever the backend is reachable.
 *
 * Correctness rests on the server, not on this loop. Every entry carries a
 * `client_ref`, and the server has a unique index on it, so a batch replayed
 * after a lost response returns the original sales instead of recording twice.
 * That is what makes it safe to retry aggressively here.
 *
 * This is intentionally a client-side poller rather than a Service Worker
 * `BackgroundSync` registration: Background Sync is Chromium-only, and replaying
 * a write from the worker would mean duplicating the queue's logic and lifetime
 * rules in a second place.
 */

import { ApiError, probeBackend, syncSales } from '../api/client';
import { pendingSales, markAttempt, quarantine, removeQueuedSale, type QueuedSale } from './queue';

export type SyncStatus = {
  online: boolean;
  pending: number;
  syncing: boolean;
  /** Set when the server refused an entry outright; it is quarantined, not lost. */
  lastError: string | null;
  /** Sales recorded at a price that no longer matches the catalogue. */
  conflicts: number;
  /** Highest order_ref confirmed by the server, for operator feedback. */
  lastOrderRef: string | null;
};

const ONLINE_POLL_MS = 60_000;
const OFFLINE_POLL_MS = 15_000;
const PROBE_TIMEOUT_MS = 4000;

/** The server rejects a batch larger than this; keep our batches inside it. */
const BATCH_SIZE = 100;

type Listener = (status: SyncStatus) => void;

export class SalesSyncer {
  private status: SyncStatus = {
    online: false,
    pending: 0,
    syncing: false,
    lastError: null,
    conflicts: 0,
    lastOrderRef: null,
  };

  private listeners = new Set<Listener>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private started = false;
  private inFlight = false;

  /** The token is read lazily: it can be replaced by a re-login mid-session. */
  private getToken: () => string | null;

  constructor(getToken: () => string | null) {
    this.getToken = getToken;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  snapshot(): SyncStatus {
    return { ...this.status, pending: this.queued() };
  }

  private queued(): number {
    try {
      return pendingSales().length;
    } catch {
      return 0;
    }
  }

  private emit(): void {
    const next = this.snapshot();
    this.status = next;
    for (const listener of this.listeners) listener(next);
  }

  start(): void {
    if (this.started) return;
    this.started = true;
    this.emit();
    void this.tick();

    window.addEventListener('online', this.onWake);
    window.addEventListener('offline', this.onWake);
    document.addEventListener('visibilitychange', this.onWake);
  }

  stop(): void {
    this.started = false;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    window.removeEventListener('online', this.onWake);
    window.removeEventListener('offline', this.onWake);
    document.removeEventListener('visibilitychange', this.onWake);
  }

  private onWake = (): void => {
    if (document.visibilityState === 'hidden') return;
    // A connectivity change or a foregrounded tab is the best moment to retry.
    void this.tick();
  };

  /** Call after a sale is recorded or queued, so feedback is immediate. */
  poke(): void {
    void this.tick();
  }

  private schedule(delay: number): void {
    if (!this.started) return;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.tick(), delay);
  }

  private async tick(): Promise<void> {
    if (!this.started) return;
    if (this.inFlight) return;

    const online = await probeBackend(PROBE_TIMEOUT_MS);
    this.status.online = online;

    if (!online) {
      this.status.syncing = false;
      this.emit();
      this.schedule(OFFLINE_POLL_MS);
      return;
    }

    if (this.queued() === 0) {
      this.status.syncing = false;
      this.emit();
      this.schedule(ONLINE_POLL_MS);
      return;
    }

    await this.flush();
    this.schedule(this.queued() > 0 ? OFFLINE_POLL_MS : ONLINE_POLL_MS);
  }

  /**
   * Send everything queued, oldest first.
   *
   * Entries are removed only once the server has answered for them. A network
   * failure stops the run (the rest will retry) rather than discarding anything.
   */
  async flush(): Promise<void> {
    if (this.inFlight) return;
    const token = this.getToken();
    if (!token) {
      // Selling offline is allowed, syncing is not: the server needs a valid
      // session to attribute the sales. The queue is untouched.
      this.status.lastError = 'Sign in to sync the sales saved on this device.';
      this.emit();
      return;
    }

    const queue = pendingSales();
    if (queue.length === 0) return;

    this.inFlight = true;
    this.status.syncing = true;
    this.emit();

    try {
      for (let start = 0; start < queue.length; start += BATCH_SIZE) {
        const batch = queue.slice(start, start + BATCH_SIZE);
        await this.sendBatch(token, batch);
      }
      this.status.lastError = null;
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 401) {
        this.status.lastError = 'Session expired — sign in again to sync.';
      } else {
        this.status.lastError = error instanceof Error ? error.message : 'Could not sync.';
      }
      // Every unsent entry stays queued with its error recorded.
      for (const sale of pendingSales()) markAttempt(sale.client_ref, this.status.lastError ?? 'sync failed');
    } finally {
      this.inFlight = false;
      this.status.syncing = false;
      this.emit();
    }
  }

  private async sendBatch(token: string, batch: QueuedSale[]): Promise<void> {
    const result = await syncSales(
      token,
      batch.map((sale) => ({
        client_ref: sale.client_ref,
        payment: sale.payment,
        sold_at: sale.sold_at,
        catalog_revision: sale.catalog_revision,
        items: sale.items.map((line) => ({
          item_id: line.item_id,
          title: line.title,
          price_cents: line.price_cents,
          quantity: line.quantity,
          subtotal_cents: line.price_cents * line.quantity,
        })),
      })),
    );

    for (const entry of result.results) {
      if (entry.status === 'rejected') {
        // Never silently drop a sale the customer paid for.
        quarantine(entry.client_ref, entry.reason ?? 'The server rejected this sale.');
        continue;
      }
      removeQueuedSale(entry.client_ref);
      if (entry.order_ref) this.status.lastOrderRef = entry.order_ref;
    }

    if (result.conflicts > 0) this.status.conflicts += result.conflicts;

    const rejected = result.results.filter((entry) => entry.status === 'rejected');
    if (rejected.length > 0) {
      this.status.lastError = `${rejected.length} sale(s) need attention — see the pending list.`;
    }
  }
}
