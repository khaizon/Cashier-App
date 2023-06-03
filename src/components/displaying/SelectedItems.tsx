import { useContext, useState } from 'react';
import './SelectedItems.css';
import { CashierContext } from '../Cashier';
import { formatter } from '../../shared/functions/formatter';
import Modal from '../modals/Modal';
import ConfirmRecord from '../modals/ConfirmRecord';
import ComputeChange from '../modals/ComputeChange';

const DeleteIcon = () => (
  <div className="iconContainer">
    <svg
      clipRule="evenodd"
      fillRule="evenodd"
      strokeLinejoin="round"
      strokeMiterlimit="2"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="m12.002 2.005c5.518 0 9.998 4.48 9.998 9.997 0 5.518-4.48 9.998-9.998 9.998-5.517 0-9.997-4.48-9.997-9.998 0-5.517 4.48-9.997 9.997-9.997zm0 8.933-2.721-2.722c-.146-.146-.339-.219-.531-.219-.404 0-.75.324-.75.749 0 .193.073.384.219.531l2.722 2.722-2.728 2.728c-.147.147-.22.34-.22.531 0 .427.35.75.751.75.192 0 .384-.073.53-.219l2.728-2.728 2.729 2.728c.146.146.338.219.53.219.401 0 .75-.323.75-.75 0-.191-.073-.384-.22-.531l-2.727-2.728 2.717-2.717c.146-.147.219-.338.219-.531 0-.425-.346-.75-.75-.75-.192 0-.385.073-.531.22z"
        fillRule="nonzero"
      />
    </svg>
  </div>
);

const ResetIcon = () => (
  <div className="iconContainer">
    <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fillRule="evenodd" clipRule="evenodd" viewBox="0 0 24 24">
      <path d="M19 24h-14c-1.104 0-2-.896-2-2v-16h18v16c0 1.104-.896 2-2 2zm-7-10.414l3.293-3.293 1.414 1.414-3.293 3.293 3.293 3.293-1.414 1.414-3.293-3.293-3.293 3.293-1.414-1.414 3.293-3.293-3.293-3.293 1.414-1.414 3.293 3.293zm10-8.586h-20v-2h6v-1.5c0-.827.673-1.5 1.5-1.5h5c.825 0 1.5.671 1.5 1.5v1.5h6v2zm-8-3h-4v1h4v-1z" />
    </svg>
    &nbsp;RESET
  </div>
);

const WriteIcon = () => (
  <div className="iconContainer">
    <svg
      clipRule="evenodd"
      fillRule="evenodd"
      strokeLinejoin="round"
      strokeMiterlimit="2"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="m11.25 6c.398 0 .75.352.75.75 0 .414-.336.75-.75.75-1.505 0-7.75 0-7.75 0v12h17v-8.75c0-.414.336-.75.75-.75s.75.336.75.75v9.25c0 .621-.522 1-1 1h-18c-.48 0-1-.379-1-1v-13c0-.481.38-1 1-1zm-2.011 6.526c-1.045 3.003-1.238 3.45-1.238 3.84 0 .441.385.626.627.626.272 0 1.108-.301 3.829-1.249zm.888-.889 3.22 3.22 8.408-8.4c.163-.163.245-.377.245-.592 0-.213-.082-.427-.245-.591-.58-.578-1.458-1.457-2.039-2.036-.163-.163-.377-.245-.591-.245-.213 0-.428.082-.592.245z"
        fillRule="nonzero"
      />
    </svg>
    &nbsp;RECORD
  </div>
);

const CalculateIcon = () => (
  <div className="iconContainer">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <path d="M13 24h6c2.762 0 5-2.239 5-5v-6h-11v11zm3-7h5v1h-5v-1zm0 2h5v1h-5v-1zm-16 0c0 2.761 2.239 5 5 5h6v-11h-11v6zm3-1h2v-2h1v2h2v1h-2v2h-1v-2h-2v-1zm16-18h-6v11h11v-6c0-2.761-2.238-5-5-5zm-.5 3c.276 0 .5.224.5.5s-.224.5-.5.5-.5-.224-.5-.5.224-.5.5-.5zm0 5c-.276 0-.5-.224-.5-.5s.224-.5.5-.5.5.224.5.5-.224.5-.5.5zm2.5-2h-5v-1h5v1zm-21-1v6h11v-11h-6c-2.761 0-5 2.239-5 5zm6.914-1.622l.708.708-1.415 1.414 1.414 1.414-.707.707-1.414-1.414-1.414 1.414-.708-.707 1.414-1.414-1.414-1.414.707-.707 1.415 1.414 1.414-1.415z" />
    </svg>
    &nbsp;CHANGE
  </div>
);

const SelectedItems = () => {
  const {
    state: { items, total },
    dispatch,
  } = useContext(CashierContext);
  const [showDialog, setShowDialog] = useState(false);
  const [showComputeChange, setShowComputeChange] = useState(false);

  return (
    <div className="selectedItemsContainer">
      <div className="tableContainer">
        <table className="cashierStateTable">
          <thead>
            <tr>
              <th>Icon</th>
              <th align="left">Name</th>
              <th>Price</th>
              <th>Qty</th>
              <th>Less</th>
              <th>Sub</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 &&
              items.map(({ id, img, price, title, quantity, subtotal }) => (
                <tr key={id}>
                  <td>
                    <img className="cashierStateItemImg" src={img} width={'30px'} />
                  </td>
                  <td align="left">{title}</td>
                  <td className="price money">{formatter.format(price)}</td>
                  <td>{quantity > 1 ? <div className="qty">{quantity}</div> : quantity}</td>
                  <td>
                    <button
                      onClick={() =>
                        dispatch({
                          type: 'REMOVE',
                          payload: { id, price } as Item,
                        })
                      }
                    >
                      <DeleteIcon />
                    </button>
                  </td>
                  <td className="subtotal money">
                    <div>{formatter.format(subtotal)}</div>
                  </td>
                </tr>
              ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '1rem' }}>
                  no items in cart
                </td>
              </tr>
            )}
          </tbody>
          {items.length > 0 && (
            <tfoot>
              <tr>
                <td colSpan={4} align="right">
                  Total:
                </td>
                <td colSpan={2} className="money">
                  {formatter.format(total)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="resultContainer">
        <button onClick={() => dispatch({ type: 'RESET', payload: {} as Item })}>
          <ResetIcon />
        </button>
        <button onClick={() => setShowDialog(true)}>
          <WriteIcon />
        </button>
        <button onClick={() => setShowComputeChange(true)}>
          <CalculateIcon />
        </button>
      </div>
      <Modal visible={showDialog} setVisible={setShowDialog}>
        <ConfirmRecord />
      </Modal>
      <Modal visible={showComputeChange} setVisible={setShowComputeChange}>
        <ComputeChange />
      </Modal>
    </div>
  );
};

export default SelectedItems;
