import { createContext, useReducer } from "react";
import "./Cashier.css";
import ItemSelector from "./selecting/ItemSelector";
import SelectedItems from "./displaying/SelectedItems";

type CashierProps = {
	categoryItems: CategoryItem[];
};

const cashierStateReducer = (state: CashierState, { type, payload }: { type: string; payload: Item }) => {
	if (type === "ADD") {
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
	} else if (type === "REMOVE") {
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
	} else if (type === "RESET") {
    return {items: [], total: 0}
  }
	return state;
};

export const CashierContext = createContext<{
  state: CashierState;
  dispatch: React.Dispatch<{type:string, payload: Item}>;
}>({
  state: {} as CashierState,
  dispatch: () => null
})

const Cashier = ({ categoryItems }: CashierProps) => {
  const [state, dispatch] = useReducer(cashierStateReducer, {
    items: [],
    total: 0,
  } as CashierState)
	return (
    <CashierContext.Provider value={{state, dispatch}}>
		<div className="cashierGrid">
			<ItemSelector categoryItems={categoryItems}/>
			<SelectedItems />
		</div>
    </CashierContext.Provider>
	);
};

export default Cashier;
