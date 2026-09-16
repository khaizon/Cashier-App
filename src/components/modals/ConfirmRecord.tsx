import { useContext, useState } from 'react';
import { CashierContext } from '../Cashier';
import './ConfirmRecord.css';
import { formatter } from '../../shared/functions/formatter';
import { AuthContext } from '../../App';
import { ApiError, recordSale } from '../../api/client';

const PAYMENT_LABELS = ['Cash', 'Paynow'] as const;

const ConfirmRecord = () => {
  const {
    state: { items, total },
  } = useContext(CashierContext);
  const { token, logout } = useContext(AuthContext);

  const [payment, setPayment] = useState(0);
  const [recordState, setRecordState] = useState('record');
  const [error, setError] = useState('');
  const [orderRef, setOrderRef] = useState('');

  const recordPayment = () => {
    if (!token) {
      setError('Your session expired. Please sign in again.');
      setRecordState('record');
      return;
    }

    recordSale(
      token,
      payment === 0 ? 'cash' : 'paynow',
      items.map((item) => ({ item_id: item.id, quantity: item.quantity }))
    )
      .then((receipt) => {
        setError('');
        setOrderRef(receipt.order_ref);
        setRecordState('success');
      })
      .catch((err: unknown) => {
        setRecordState('record');
        setOrderRef('');
        if (err instanceof ApiError && err.status === 401) {
          logout();
          return;
        }
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
        <div>
          <button
            onClick={() => {
              setRecordState('recording');
              recordPayment();
            }}
            disabled={recordState === 'recording'}
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
