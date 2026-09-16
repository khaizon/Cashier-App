import { FC, createContext, useContext, useEffect, useReducer } from 'react';
import './Cashier.css';
import ItemSelector from './selecting/ItemSelector';
import SelectedItems from './displaying/SelectedItems';
import { AuthContext } from '../api/authContext';
import { CART_STORAGE_PREFIX } from '../offline/queue';

type CashierProps = {
  categoryItems: CategoryItem[];
};

const cashierStateReducer = (state: CashierState, { type, payload }: { type: string; payload: Item }) => {
  if (type === 'ADD') {
    const newTotal = state.total + payload.price;
    let itemExists = false;

    const updatedItems = state.items.map((item) => {
      if (item.id === payload.id) {
        itemExists = true;
        return {
          ...item,
          quantity: item.quantity + 1,
          subtotal: item.subtotal + payload.price,
        };
      }
      return item;
    });

    if (!itemExists) {
      updatedItems.push({ ...payload, quantity: 1, subtotal: payload.price });
    }

    return { items: updatedItems, total: newTotal };
  } else if (type === 'REMOVE') {
    const newTotal = state.total - payload.price;
    const updatedItems = state.items.reduce((acc: SelectedItem[], item) => {
      if (item.id === payload.id) {
        if (item.quantity > 1) {
          return [
            ...acc,
            {
              ...item,
              quantity: item.quantity - 1,
              subtotal: item.subtotal - payload.price,
            },
          ];
        }
        // Quantity is 1, remove item from array
        return acc;
      }
      return [...acc, item];
    }, []);
    return { items: updatedItems, total: newTotal };
  } else if (type === 'RESET') {
    return { items: [], total: 0 };
  }
  return state;
};

// Context is intentionally co-located with Cashier; splitting it out is a larger refactor.
// eslint-disable-next-line react-refresh/only-export-components
export const CashierContext = createContext<{
  state: CashierState;
  dispatch: React.Dispatch<{ type: string; payload: Item }>;
}>({
  state: {} as CashierState,
  dispatch: () => null,
});

/* Local rather than the ambient ``CashierState``: this file needs the concrete
   shape for the persisted-cart parsing below, and referring to the global here
   trips up the compiler's narrowing. */
type CartState = {
  items: SelectedItem[];
  total: number;
};

function readStoredCart(username: string | null): CartState {
  if (!username) return { items: [], total: 0 };
  try {
    const raw = localStorage.getItem(`${CART_STORAGE_PREFIX}.${username}`);
    if (!raw) return { items: [], total: 0 };
    const parsed = JSON.parse(raw) as Partial<CartState>;
    if (!parsed || !Array.isArray(parsed.items)) return { items: [], total: 0 };
    return { items: parsed.items, total: typeof parsed.total === 'number' ? parsed.total : 0 };
  } catch {
    return { items: [], total: 0 };
  }
}

const Cashier: FC<CashierProps> = ({ categoryItems }) => {
  const { username } = useContext(AuthContext);
  const [state, dispatch] = useReducer(cashierStateReducer, username, readStoredCart);

  useEffect(() => {
    if (!username) return;
    try {
      localStorage.setItem(`${CART_STORAGE_PREFIX}.${username}`, JSON.stringify(state));
    } catch {
      // Storage full or unavailable — the order still works, it just will not
      // survive a reload. Not worth interrupting the till for.
    }
  }, [state, username]);

  return (
    <CashierContext.Provider value={{ state, dispatch }}>
      <div className="cashierGrid">
        <ItemSelector categoryItems={categoryItems} />
        <SelectedItems />
      </div>
    </CashierContext.Provider>
  );
};

export default Cashier;
