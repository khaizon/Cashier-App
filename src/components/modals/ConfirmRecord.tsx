import { useContext, useState } from 'react';
import { CashierContext } from '../Cashier';
import './ConfirmRecord.css';
import { formatter } from '../../shared/functions/formatter';
import { SheetContext, TokenContext } from '../../App';

function generateID(length: number) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = ' ';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

const ConfirmRecord = () => {
  const {
    state: { items, total },
  } = useContext(CashierContext);

  const [payment, setPayment] = useState(0);
  const [recordState, setRecordState] = useState('record');
  const [error, setError] = useState('');
  const sheetName = useContext(SheetContext);
  const tokenClient = useContext(TokenContext);

  const recordPayment = () => {
    const params = {
      // The ID of the spreadsheet to update.
      spreadsheetId: import.meta.env.VITE_SPREADSHEET_ID, // TODO: Update placeholder value.

      // The A1 notation of a range to search for a logical table of data.
      // Values will be appended after the last row of the table.
      range: `${sheetName}-records!A:E`, // TODO: Update placeholder value.

      // How the input data should be interpreted.
      valueInputOption: 'USER_ENTERED', // TODO: Update placeholder value.

      // How the input data should be inserted.
      insertDataOption: 'INSERT_ROWS', // TODO: Update placeholder value.
    };

    const orderID = generateID(4);

    const valueRangeBody = {
      // TODO: Add desired properties to the request body.
      values: items.map((item) => [
        orderID,
        new Date().toLocaleString(),
        item.id,
        item.title,
        item.price,
        item.quantity,
        item.subtotal,
        payment === 0 ? 'cash' : 'credit',
      ]),
    };

    const request = window.gapi.client.sheets.spreadsheets.values.append(params, valueRangeBody);
    request.then(
      function () {
        // TODO: Change code below to process the `response` object:
        setError('');
        setRecordState('success');
      },
      function () {
        setError('Please try again!');
        tokenClient.requestAccessToken();
      }
    );
  };
  return (
    <div className="confirmRecordContainer">
      Items Purchased
      <div className="denseTable">
        <table>
          <thead>
            <tr>
              <th>S/N</th>
              <th align='left'>Name</th>
              <th>Price</th>
              <th>Qty</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.map(({ title, quantity, price, subtotal }, idx) => (
              <tr key={idx}>
                <td>{idx + 1}</td>
                <td align='left'>{title}</td>
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
              <td colSpan={4} align="right">
                Total:{' '}
              </td>
              <td className="money">{formatter.format(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div>
        Select Payment Type&nbsp;:&nbsp;{payment === 0 ? 'Cash' : 'Paynow'}
        <div>
          <button onClick={() => setPayment(0)}>Cash</button>
          <button onClick={() => setPayment(1)}>Paynow</button>
        </div>
      </div>
      <div>
        Confirm Record
        {error && <div>{error}</div>}
        <div>
          <button
            onClick={() => {
              setRecordState('recording');
              recordPayment();
            }}
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
