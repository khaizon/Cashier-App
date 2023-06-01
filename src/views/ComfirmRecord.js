import { Typography, Button, Box, Modal } from '@mui/material';

import { useState } from 'react';

const modalStyle = {
	position: 'absolute',
	top: '50%',
	left: '50%',
	transform: 'translate(-50%, -50%)',
	height: 300,
	width: 300,
	bgcolor: '#ffe9e5',
	borderRadius: 1,
	boxShadow: 24,
	p: '20px',
};

// program to generate random strings

// declare all characters

function generateString(length) {
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let result = ' ';
	const charactersLength = characters.length;
	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}

	return result;
}

const ConfirmRecord = ({ props: { items, total, handleCloseConfirmRecord, openConfirmRecord, sheetName, tokenClient } }) => {
	const [payment, setPayment] = useState(0);
	const [recorded, setRecorded] = useState(false);
	const [error, setError] = useState('');

	function recordPayment() {
		var params = {
			// The ID of the spreadsheet to update.
			spreadsheetId: process.env.REACT_APP_SPREADSHEET_ID, // TODO: Update placeholder value.

			// The A1 notation of a range to search for a logical table of data.
			// Values will be appended after the last row of the table.
			range: `${sheetName}-records!A:E`, // TODO: Update placeholder value.

			// How the input data should be interpreted.
			valueInputOption: 'USER_ENTERED', // TODO: Update placeholder value.

			// How the input data should be inserted.
			insertDataOption: 'INSERT_ROWS', // TODO: Update placeholder value.
		};

		const orderID = generateString(4);

		var valueRangeBody = {
			// TODO: Add desired properties to the request body.
			values: items.map((item) => [
				orderID,
				new Date().toLocaleString(),
				item.id,
				item.title,
				item.price,
				item.qty,
				item.subtotal,
				payment === 0 ? 'cash' : 'credit',
			]),
		};

		var request = window.gapi.client.sheets.spreadsheets.values.append(params, valueRangeBody);
		request.then(
			function (response) {
				// TODO: Change code below to process the `response` object:
				setRecorded(true);
				setError('');
				console.log(response);
			},
			function (reason) {
				console.error('error: ' + reason.result.error.message);
				setError('error: login timeout. try again after signin in :)');
				tokenClient.requestAccessToken();
			}
		);
	}

	return (
		<Modal
			open={openConfirmRecord}
			onClose={() => {
				handleCloseConfirmRecord();
				setRecorded(false);
				setError('');
			}}
			aria-labelledby="modal-modal-title"
			aria-describedby="modal-modal-description"
		>
			<Box sx={modalStyle}>
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'space-between',
						height: '100%',
					}}
				>
					<div
						style={{
							overflow: 'auto',
							maxHeight: 250,
						}}
					>
						<table style={{ textAlign: 'center', width: '100%', fontFamily: 'Montserrat' }}>
							<thead>
								<tr>
									<th style={{ textAlign: 'left' }}>Name</th>
									<th>Price</th>
									<th>Qty</th>
									<th>Subtotal</th>
								</tr>
							</thead>
							<tbody>
								{items.map((item, index) => (
									<tr key={index}>
										<td style={{ textAlign: 'left' }}>{item.title}</td>
										<td>{item.price}</td>
										<td>{item.qty}</td>
										<td>{item.subtotal}</td>
									</tr>
								))}
							</tbody>
						</table>
						<div style={{ textAlign: 'right', paddingTop: 20 }}>
							<Typography variant="h6">Total: {total}</Typography>
						</div>
					</div>
					<div>{error}</div>
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
						}}
					>
						<div>
							<Button
								variant={payment === 0 ? 'contained' : 'outlined'}
								onClick={() => {
									setPayment(0);
								}}
							>
								Cash
							</Button>
							<Button
								variant={payment === 1 ? 'contained' : 'outlined'}
								onClick={() => {
									setPayment(1);
								}}
							>
								Credit
							</Button>
						</div>
						<Button
							variant="contained"
							color={recorded ? 'success' : 'error'}
							onClick={() => {
								recordPayment();
							}}
						>
							Record{recorded && 'ed'}
						</Button>
					</div>
				</div>
			</Box>
		</Modal>
	);
};

export default ConfirmRecord;
