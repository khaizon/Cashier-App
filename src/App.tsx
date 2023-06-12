import { createContext, useState } from 'react';
import './App.css';

import Cashier from './components/Cashier';
import LoginCard from './components/auth/LoginCard';

export const SheetContext = createContext('maomao');
export const TokenContext = createContext<google.accounts.oauth2.TokenClient | undefined>({} as google.accounts.oauth2.TokenClient);

function App() {
  const [sheetName, setSheetName] = useState('maomao');
  const [tokenClient, setTokenClient] = useState<google.accounts.oauth2.TokenClient>();
  const [categoryItems, setCategoryItems] = useState<CategoryItem[]>([]);

  return (
    <>
      <SheetContext.Provider value={sheetName}>
        <TokenContext.Provider value={tokenClient}>
          {!tokenClient && <LoginCard setCategoryItems={setCategoryItems} setSheetName={setSheetName} setTokenClient={setTokenClient} />}
          {tokenClient && <Cashier categoryItems={categoryItems} />}
        </TokenContext.Provider>
      </SheetContext.Provider>
    </>
  );
}

export default App;
