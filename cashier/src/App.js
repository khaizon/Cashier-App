import {
	Avatar,
	Box,
	Button,
	Card,
	CardActionArea,
	CardActions,
	CardContent,
	CardMedia,
	createTheme,
	Grid,
	Input,
	Modal,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	ThemeProvider,
	Typography,
} from '@mui/material';

import { useEffect, useState } from 'react';
import useWindowDimensions from './hooks/useWindowDimensions';
import './app.css';
import Cashier from './Cashier';

const theme = createTheme({
	typography: {
		fontFamily: ['Montserrat', 'Roboto', 'Indie Flower', 'Cherry Cream Soda', 'Helvetica Neue', 'Arial', 'sans-serif'].join(','),
	},
});

const processExcelResult = (arr) => {
	const columnNames = arr[0];
	const objects = [];
	const seenCatetories = [];
	const result = [];
	for (let i = 1; i < arr.length; i += 1) {
		let temp = {};
		for (let n = 0; n < columnNames.length; n += 1) {
			temp[columnNames[n]] = arr[i][n];
		}
		objects.push(temp);
	}
	let tempItem = {};
	for (let i = 0; i < objects.length; i += 1) {
		if (!seenCatetories.includes(objects[i].category)) {
			if (Object.keys(tempItem).length > 0) result.push(tempItem);
			tempItem = {};
			tempItem.category = objects[i].category;
			tempItem.palette1 = objects[i].palette1;
			tempItem.palette2 = objects[i].palette2;
			tempItem.palette3 = objects[i].palette3;
			tempItem.items = [
				{
					id: objects[i].id,
					img: objects[i].img,
					title: objects[i].title,
					price: parseInt(objects[i].price),
				},
			];
			seenCatetories.push(objects[i].category);
			continue;
		}
		tempItem.items.push({
			id: objects[i].id,
			img: objects[i].img,
			title: objects[i].title,
			price: parseInt(objects[i].price),
		});
	}
	return result;
};

const CLIENT_ID = '598459687549-hu6l7pcfut80no9oa4b4tta2q279kqod.apps.googleusercontent.com';
const API_KEY = 'AIzaSyD2TgeAKgGUR22sNWabRVpswpJq4h2lQYY';
// Discovery doc URL for APIs used by the quickstart
const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';
// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';
let tokenClient;
let gapiInited = false;
let gisInited = false;

function App() {
	const [items, setItems] = useState([]);
	const [total, setTotal] = useState(0);
	const [received, setReceived] = useState(0);
	const { height, width } = useWindowDimensions();
	const [showAuthorize, setShowAuthorize] = useState(false);
	const [authText, setAuthText] = useState('Login');
	const [showSignout, setShowSignout] = useState(false);
	const [itemData, setItemData] = useState([]);
	const [sheetName, setSheetName] = useState([]);

	const gisLoaded = () => {
		tokenClient = window.google.accounts.oauth2.initTokenClient({
			client_id: CLIENT_ID,
			scope: SCOPES,
			callback: '', // defined later
		});
		gisInited = true;
		maybeEnableButtons();
	};

	const gapiLoaded = () => {
		window.gapi.load('client', intializeGapiClient);
	};

	function maybeEnableButtons() {
		if (gapiInited && gisInited) {
			setShowAuthorize(true);
		}
	}
	async function intializeGapiClient() {
		await window.gapi.client.init({
			apiKey: API_KEY,
			discoveryDocs: [DISCOVERY_DOC],
		});
		gapiInited = true;
		maybeEnableButtons();
	}

	/**
	 *  Sign in the user upon button click.
	 */
	function handleAuthClick() {
		tokenClient.callback = async (resp) => {
			if (resp.error !== undefined) {
				throw resp;
			}
			setShowSignout(true);
			setAuthText('refresh');
			await listMajors();
		};

		if (window.gapi.client.getToken() === null) {
			// Prompt the user to select a Google Account and ask for consent to share their data
			// when establishing a new session.
			tokenClient.requestAccessToken({ prompt: 'consent' });
		} else {
			// Skip display of account chooser and consent dialog for an existing session.
			tokenClient.requestAccessToken({ prompt: '' });
		}
	}

	/**
	 *  Sign out the user upon button click.
	 */
	function handleSignoutClick() {
		const token = window.gapi.client.getToken();
		if (token !== null) {
			window.google.accounts.oauth2.revoke(token.access_token);
			window.gapi.client.setToken('');
			setAuthText('Login');
			setShowSignout(false);
		}
	}

	/**
	 * Print the names and majors of students in a sample spreadsheet:
	 * https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
	 */
	async function listMajors() {
		let response;
		try {
			// Fetch first 10 files
			response = await window.gapi.client.sheets.spreadsheets.values.get({
				spreadsheetId: '1bKKFlt11L5WSsu8bx6PV5o7w0T3jAvXxycGIuJiH1fw',
				range: `${sheetName}!A:H`,
			});
		} catch (err) {
			console.log(err);
			return;
		}
		const range = response.result;
		processExcelResult(range.values);
		if (!range || !range.values || range.values.length == 0) {
			console.log('empty result');
			return;
		}
		setItemData(processExcelResult(range.values));
	}
	useEffect(() => {
		const gapiScript = document.createElement('script');
		gapiScript.src = 'https://apis.google.com/js/api.js';
		gapiScript.async = true;
		gapiScript.onload = () => gapiLoaded();
		document.body.appendChild(gapiScript);
		const gisScript = document.createElement('script');
		gisScript.src = 'https://accounts.google.com/gsi/client';
		gisScript.async = true;
		gisScript.onload = () => gisLoaded();
		document.body.appendChild(gisScript);
	});
	return (
		<ThemeProvider theme={theme}>
			{showAuthorize && !showSignout && (
				<div
					style={{
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						height: height,
						backgroundColor: '#ffe9e5',
					}}
				>
					<Paper
						style={{
							display: 'flex',
							flexDirection: 'column',
							justifyContent: 'center',
							alignItems: 'center',
							padding: '40px',
						}}
					>
						<Typography
							style={{
								alignSelf: 'flex-start',
								color: '#BB6750',
							}}
						>
							Sheet Name
						</Typography>
						<Input
							placeholder="maomao"
							onChange={(e) => {
								setSheetName(e.target.value);
							}}
							value={sheetName}
							onKeyPress={(e) => {
								if (e.key === 'Enter') {
									e.preventDefault();
									handleAuthClick();
									setSheetName('');
								}
							}}
							autoFocus
							color="secondary"
							style={{
								fontFamily: 'Indie Flower',
								marginTop: '10px',
								color: '#FF907C',
							}}
						/>
						<Button
							variant="contained"
							onClick={() => {
								handleAuthClick();
							}}
							style={{
								marginTop: '30px',
								backgroundColor: '#FF907C',
							}}
						>
							{authText}
						</Button>
					</Paper>
				</div>
			)}
			{showSignout && <Cashier props={{ items, setItems, total, setTotal, received, setReceived, height, itemData }} />}
		</ThemeProvider>
	);
}

export default App;
