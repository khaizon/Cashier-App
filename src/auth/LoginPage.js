import { Button, Input, Paper, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

// Discovery doc URL for APIs used by the quickstart
const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';
// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

const processExcelResult = (rangeValues) => {
	const columnNames = rangeValues[0];

	const inputRows = rangeValues.slice(1).map((row) => {
		const currRow = columnNames.reduce((acc, columnName, n) => {
			let value = row[n];
			if (columnName === 'price') {
				value = parseFloat(value);
			}
			return { ...acc, [columnName]: value };
		}, {});
		return currRow;
	});

	const result = inputRows.reduce((acc, row) => {
		const { category, palette1, palette2, palette3, ...item } = row;
		const existingCategory = acc.find((item) => item.category === category);

		if (existingCategory) {
			existingCategory.items.push(item);
		} else {
			const newCategory = {
				category,
				palette1,
				palette2,
				palette3,
				items: [item],
			};
			acc.push(newCategory);
		}
		return acc;
	}, []);

	return result;
};
/**
 * Print the names and majors of students in a sample spreadsheet:
 * https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 */
const listMajors = async (sheetName, callback) => {
	let response;
	try {
		// Fetch first 10 files
		response = await window.gapi.client.sheets.spreadsheets.values.get({
			spreadsheetId: process.env.REACT_APP_SPREADSHEET_ID,
			range: `${sheetName}!A:H`,
		});
	} catch (err) {
		console.log(err);
		return;
	}
	const range = response.result;
	if (!range || !range.values || range.values.length === 0) {
		console.log('empty result');
		return;
	}
	callback(processExcelResult(range.values));
};
const LoginPage = ({ setItems, setAuth, tokenClient, setTokenClient }) => {
	const [gapiInited, setGapiInited] = useState(false);
	const [gsiInited, setGsiInited] = useState(false);
	const [sheetName, setSheetName] = useState('');
	/**
	 *  Sign in the user upon button click.
	 */
	const handleAuthClick = () => {
		const client = window.google.accounts.oauth2.initTokenClient({
			auto_select: true,
			client_id: process.env.REACT_APP_CLIENT_ID,
			scope: SCOPES,
			callback: async (resp) => {
				if (resp.error !== undefined) {
					throw resp;
				}
				setAuth(resp);
				listMajors(sheetName, (items) => {
					setItems(items);
				})
			},
		})
		setTokenClient(client);
		client.requestAccessToken({ prompt: '' });
	};

	useEffect(() => {
		async function intializeGapiClient() {
			await window.gapi.client.init({
				apiKey: process.env.REACT_APP_API_KEY,
				discoveryDocs: [DISCOVERY_DOC],
			});
			setGapiInited(true);
		}
		const gapiScript = document.createElement('script');
		gapiScript.src = 'https://apis.google.com/js/api.js';
		gapiScript.async = true;
		gapiScript.onload = () => {
			window.gapi.load('client', intializeGapiClient);
		};
		document.body.appendChild(gapiScript);
		const gsiScript = document.createElement('script');
		gsiScript.src = 'https://accounts.google.com/gsi/client';
		gsiScript.async = true;
		gsiScript.onload = () => setGsiInited(true);;
		document.body.appendChild(gsiScript);
	}, [setItems, sheetName, setAuth, setTokenClient]);
	return (
		gsiInited &&
		gapiInited && (
			<div
				style={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					backgroundColor: '#ffe9e5',
					height: '100%',
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
						Login
					</Button>
				</Paper>
			</div>
		)
	);
};

export default LoginPage;
