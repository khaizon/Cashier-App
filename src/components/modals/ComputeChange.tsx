import { useContext, useState } from 'react';
import { CashierContext } from '../Cashier';
import './ComputeChange.css';
import { formatter } from '../../shared/functions/formatter';

const denominations = [50, 10, 5, 2, 1, 0.5];

const ComputeChange = () => {
  const {
    state: { items, total },
  } = useContext(CashierContext);
  const [received, setReceived] = useState(0);
  return (
    <div className="computeChangeContainer">
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
                  {' '}
                  <div>{formatter.format(subtotal)}</div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} align="right">
                Total:
              </td>
              <td className="money">{formatter.format(total)}</td>
            </tr>
            <tr style={{ fontSize: '1.5em' }}>
              <td colSpan={4} align="right">
                Cash Received:
              </td>
              <td className="cashReceived money">({formatter.format(received)})</td>
            </tr>
            <tr>
              <td colSpan={4} align="right">
                Balance:
              </td>
              <td className="money">
                {received - total < 0 ? `(${formatter.format(total - received)})` : formatter.format(received - total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="denomsGrid">
        {denominations.map((val, idx) => (
          <div key={idx} className="notesAdder">
            <button onClick={() => setReceived(received - val)}>-</button>
            {formatter.format(val)}
            <button onClick={() => setReceived(received + val)}>+</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ComputeChange;
