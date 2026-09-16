import { FC, useState } from 'react';

import './PendingSync.css';
import { formatter } from '../../shared/functions/formatter';
import { syncer } from '../../offline';
import type { SyncStatus } from '../../offline/syncer';
import { readQueue } from '../../offline/queue';

type PendingSyncProps = {
  status: SyncStatus;
  onClose: () => void;
};

function when(iso: string): string {
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime())
    ? iso
    : parsed.toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

/**
 * What is still sitting on this device, and whether it made it to the server.
 *
 * Quarantined entries are shown rather than hidden: the customer paid for them,
 * so an operator has to be able to see that one did not reconcile and why.
 */
const PendingSync: FC<PendingSyncProps> = ({ status, onClose }) => {
  const [syncing, setSyncing] = useState(false);
  const queue = readQueue();
  const pending = queue.filter((sale) => !sale.quarantined);
  const stuck = queue.filter((sale) => sale.quarantined);

  const syncNow = () => {
    setSyncing(true);
    syncer
      .flush()
      .catch(() => undefined)
      .finally(() => setSyncing(false));
  };

  return (
    <div className="pendingBackdrop" role="dialog" aria-modal="true" aria-label="Sales saved on this device">
      <div className="pendingCard">
        <header className="pendingHeader">
          <div>
            <h2>Saved on this device</h2>
            <p>
              {status.online ? 'Connected.' : 'No connection to the server.'}{' '}
              {pending.length === 0
                ? 'Nothing waiting to sync.'
                : `${pending.length} sale${pending.length === 1 ? '' : 's'} waiting to sync.`}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        {status.lastError && <div className="pendingNotice">{status.lastError}</div>}

        {status.conflicts > 0 && (
          <div className="pendingNotice pendingNotice--warn">
            {status.conflicts} synced sale{status.conflicts === 1 ? '' : 's'} were priced differently from the current
            catalogue. They were recorded at the price the customer paid.
          </div>
        )}

        {pending.length === 0 && stuck.length === 0 ? (
          <p className="pendingEmpty">All sales have reached the server.</p>
        ) : (
          <ul className="pendingList">
            {[...pending, ...stuck].map((sale) => (
              <li key={sale.client_ref} className={sale.quarantined ? 'pendingItem pendingItem--stuck' : 'pendingItem'}>
                <div className="pendingItemHead">
                  <span className="pendingWhen">{when(sale.sold_at)}</span>
                  <span className={`pendingPay pendingPay--${sale.payment}`}>{sale.payment}</span>
                  <span className="money pendingTotal">{formatter.format(sale.total_cents / 100)}</span>
                </div>
                <div className="pendingLines">
                  {sale.items.map((line) => `${line.quantity}× ${line.title}`).join(', ')}
                </div>
                {sale.quarantined && <div className="pendingStuck">Needs attention: {sale.last_error}</div>}
                {!sale.quarantined && sale.attempts > 0 && (
                  <div className="pendingAttempts">
                    {sale.attempts} failed attempt{sale.attempts === 1 ? '' : 's'}
                    {sale.last_error ? ` — ${sale.last_error}` : ''}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        <footer className="pendingActions">
          <button type="button" className="pendingSecondary" onClick={onClose}>
            close
          </button>
          <button
            type="button"
            className="pendingPrimary"
            onClick={syncNow}
            disabled={syncing || pending.length === 0}
            title={status.online ? undefined : 'The server is unreachable right now.'}
          >
            {syncing ? 'syncing…' : 'sync now'}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default PendingSync;
