/**
 * The one syncer instance for the app.
 *
 * A single instance matters: the poll timer, the in-flight guard, and the status
 * subscribers all assume they are looking at the same queue. Creating a second
 * one would double-poll and could race two flushes against the same entries.
 */

import { SalesSyncer } from './syncer';

let tokenReader: () => string | null = () => null;

export const syncer = new SalesSyncer(() => tokenReader());

/** Point the syncer at the current session. Called once by App. */
export function setSyncTokenReader(reader: () => string | null): void {
  tokenReader = reader;
}
