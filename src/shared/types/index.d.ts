type Item = {
  id: number;
  img: string;
  title: string;
  price: number;
};

type CategoryItem = {
  category: string;
  palette1: string;
  palette2: string;
  palette3: string;
  items: Item[];
};

type SelectedItem = {
  id: number;
  title: string;
  price: number;
  img: string;
  quantity: number;
  subtotal: number;
};

type CashierState = {
  items: SelectedItem[];
  total: number;
};
