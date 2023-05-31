import {  createTheme, ThemeProvider} from '@mui/material';

import {  useState } from 'react';
import useWindowDimensions from './hooks/useWindowDimensions';
import './app.css';
import Cashier from './Cashier';
import LoginPage from './auth/LoginPage';

const theme = createTheme({
	typography: {
		fontFamily: ['Montserrat', 'Roboto', 'Indie Flower', 'Cherry Cream Soda', 'Helvetica Neue', 'Arial', 'sans-serif'].join(','),
	},
});

function App() {
	const [items, setItems] = useState([]);
	const [total, setTotal] = useState(0);
	const [received, setReceived] = useState(0);
	const { height } = useWindowDimensions();
	const [auth, setAuth] = useState({});
	const [itemData, setItemData] = useState([]);
	const [tokenClient, setTokenClient] = useState()

	return (
		<ThemeProvider theme={theme}>
			{Object.keys(auth).length === 0 && (
				<LoginPage setItems={setItemData} setAuth={setAuth} tokenClient={tokenClient} setTokenClient={(TC)=>setTokenClient(TC)}/>
			)}
			{Object.keys(auth).length !== 0 && (
				<Cashier
					props={{
						items,
						setItems,
						total,
						setTotal,
						received,
						setReceived,
						height,
						itemData,
						sheetName:"maomao",
						tokenClient
					}}
				/>
			)}
		</ThemeProvider>
	);
}

export default App;
