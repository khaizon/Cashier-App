import { useContext, useState } from 'react';
import { CashierContext } from '../Cashier';
import './ConfirmRecord.css';
import { formatter } from '../../shared/functions/formatter';
import { AuthContext } from '../../api/authContext';
import { ApiError, recordSale } from '../../api/client';
import { syncer } from '../../offline';
import { enqueueSale, makeClientRef } from '../../offline/queue';

const PAYMENT_LABELS = ['Cash', 'Paynow'] as const;

type ConfirmRecordProps = {
  /** Called once the sale is either recorded or safely queued. */
  onRecorded: () => void;
};

const ConfirmRecord = ({ onRecorded }: ConfirmRecordProps) => {
  const {
    state: { items, total },
  } = useContext(CashierContext);
  const { token, logout } = useContext(AuthContext);

  const [payment, setPayment] = useState(0);
  const [recordState, setRecordState] = useState('record');
  const [error, setError] = useState('');
  const [orderRef, setOrderRef] = useState('');
  const [queuedNote, setQueuedNote] = useState('');

  /**
   * Save the sale on this device instead of failing it.
   *
   * The prices here are the ones the catalogue gave us, so a queued sale is
   * priced at exactly what the customer was charged; the server records that
   * price rather than re-pricing from a catalogue that may have moved.
   *
   * `reuseRef` carries the key from a failed online attempt. Reusing it matters:
   * that attempt may already have been recorded, and the queued entry is then
   * correctly recognised as a duplicate instead of billing a second time.
   */
  const queueLocally = (reason: string, reuseRef?: string) => {
    const queued = enqueueSale({
      client_ref: reuseRef ?? makeClientRef(),
      payment: payment === 0 ? 'cash' : 'paynow',
      items: items.map((item) => ({
        item_id: item.id,
        title: item.title,
        price_cents: Math.round(item.price * 100),
        quantity: item.quantity,
      })),
      total_cents: Math.round(total * 100),
      sold_at: new Date().toISOString(),
      catalog_revision: null,
    });

    if (!queued.ok) {
      setRecordState('record');
      setError(queued.reason ?? 'Could not save this sale on the device.');
      return;
    }

    setError('');
    setQueuedNote(reason);
    setRecordState('queued');
    // The order is finished from the till's point of view either way.
    onRecorded();
    // Try straight away; if we are actually back online this syncs immediately.
    syncer.poke();
  };

  /**
   * One key per order, reused by every attempt.
   *
   * `useState`'s initialiser runs once, so this stays stable across retries and
   * re-renders. That stability is the whole point: an attempt carrying the same
   * key is recognised by the server as the same sale, so a lost response cannot
   * turn into a second charge.
   */
  const [clientRef] = useState(() => makeClientRef());

  const recordPayment = () => {
    // Selling offline is allowed with an expired session — the sale is durable
    // on the device either way, so refusing only loses money.
    if (!token) {
      queueLocally('Your session has expired. This sale is saved on the device — sign in to sync it.', clientRef);
      return;
    }

    const lineItems = items.map((item) => ({ item_id: item.id, quantity: item.quantity }));
    const paymentKind = payment === 0 ? 'cash' : 'paynow';

    recordSale(token, paymentKind, lineItems, clientRef)
      .then((receipt) => {
        setError('');
        setOrderRef(receipt.order_ref);
        setRecordState('success');
        onRecorded();
        syncer.poke();
      })
      .catch((err: unknown) => {
        setOrderRef('');
        if (err instanceof ApiError && err.status === 401) {
          logout();
          return;
        }

        if (err instanceof ApiError && err.status === 0) {
          // A transport failure. The request may or may not have been recorded —
          // the *response* is what went missing. Queueing is safe either way
          // because the entry carries the same `clientRef`: if the sale did land,
          // the sync is recognised as a duplicate; if it did not, the sync
          // records it. Exactly one sale results, and the syncer does the
          // retrying rather than a tight in-place loop.
          queueLocally(
            'No connection to the server. This sale is saved on the device and will sync automatically.',
            clientRef,
          );
          return;
        }

        setRecordState('record');
        setError(err instanceof Error ? err.message : 'Please try again!');
      });
  };

  return (
    <div className="confirmRecordContainer">
      Items Purchased
      <div className="denseTable">
        <table>
          <thead>
            <tr>
              <th>S/N</th>
              <th align="left">Name</th>
              <th>Price</th>
              <th>Qty</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.map(({ title, quantity, price, subtotal }, idx) => (
              <tr key={idx}>
                <td>{idx + 1}</td>
                <td align="left">{title}</td>
                <td align="right" className="money">
                  <div>{formatter.format(price)}</div>
                </td>
                <td>{quantity}</td>
                <td align="right" className="money">
                  <div>{formatter.format(subtotal)}</div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td />
              <td colSpan={2} align="right">
                Total:{' '}
              </td>
              <td colSpan={2} className="money">
                {formatter.format(total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div>
        Select Payment Type&nbsp;:&nbsp;{PAYMENT_LABELS[payment]}
        <div>
          <button onClick={() => setPayment(0)}>Cash</button>
          <button onClick={() => setPayment(1)}>Paynow</button>
        </div>
      </div>
      <div>
        Confirm Record
        {error && <div className="confirmRecordError">{error}</div>}
        {recordState === 'success' && orderRef && <div className="confirmRecordSuccess">recorded as {orderRef}</div>}
        {recordState === 'queued' && (
          <div className="confirmRecordQueued" role="status">
            <strong>saved offline</strong>
            <span>{queuedNote}</span>
          </div>
        )}
        <div>
          <button
            onClick={() => {
              setRecordState('recording');
              recordPayment();
            }}
            disabled={recordState === 'recording' || recordState === 'queued'}
            className={recordState}
          >
            {recordState}!
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmRecord;
