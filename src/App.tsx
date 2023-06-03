import { createContext, useState } from "react";
import "./App.css";

import Cashier from "./components/Cashier";
import LoginCard from "./components/auth/LoginCard";

export const SheetContext = createContext("");
export const TokenContext = createContext<google.accounts.oauth2.TokenClient>(
	{} as google.accounts.oauth2.TokenClient
);

function App() {
	const [sheetName, setSheetName] = useState("");
	const [tokenClient, setTokenClient] = useState<google.accounts.oauth2.TokenClient>();
	const [categoryItems, setCategoryItems] = useState<Array<CategoryItem>>([]);

	return (
		<>
			<SheetContext.Provider value={sheetName}>
				<TokenContext.Provider value={tokenClient as google.accounts.oauth2.TokenClient}>
					{!tokenClient && (
						<LoginCard
							setCategoryItems={setCategoryItems}
							setSheetName={setSheetName}
							sheetName={sheetName}
							setTokenClient={setTokenClient}
						/>
					)}
					<Cashier categoryItems={categoryItems} />
				</TokenContext.Provider>
			</SheetContext.Provider>
		</>
	);
}

export default App;
