import { useContext } from 'react';
import './ItemCard.css';
import { CashierContext } from '../Cashier';
import { formatter } from '../../shared/functions/formatter';

type ItemCardProps = {
  item: Item;
  bg: string;
  fg: string;
};

const ItemCard = ({ item: { img, title, price, id }, bg, fg }: ItemCardProps) => {
  const { dispatch } = useContext(CashierContext);
  return (
    <div
      className="itemCard"
      style={{
        backgroundColor: bg,
      }}
      onClick={() => dispatch({ type: 'ADD', payload: { img, title, price, id } })}
    >
      <img src={img} />
      <div className="itemNameAndPrice">
        <div className="name" style={{ color: fg }}>
          {title}
        </div>
        <div className="price money">{formatter.format(price)}</div>
      </div>
    </div>
  );
};

export default ItemCard;
