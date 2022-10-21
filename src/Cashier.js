import { Grid, Paper, Typography, Button } from '@mui/material';
import { useState } from 'react';
import ConfirmRecord from './views/ComfirmRecord';
import ComputeChange from './views/ComputeChange';
import ItemSelector from './views/ItemSelector';
import SelectedItems from './views/SelectedItems';

const Cashier = ({ props: { items, setItems, total, setTotal, received, setReceived, height, itemData, sheetName } }) => {
	// modal
	const [openComputeChange, setOpenComputeChange] = useState(false);
	const handleOpenComputeChange = () => setOpenComputeChange(true);
	const handleCloseComputeChange = () => setOpenComputeChange(false);

	const [openConfirmRecord, setOpenConfirmRecord] = useState(false);
	const handleOpenConfirmRecord = () => setOpenConfirmRecord(true);
	const handleCloseConfirmRecord = () => setOpenConfirmRecord(false);

	const addItem = (indexC, indexI) => {
		let foundDuplicate = false;
		for (let i = 0; i < items.length; i += 1) {
			if (items[i].id === itemData[indexC].items[indexI].id) {
				foundDuplicate = true;
				break;
			}
		}
		if (foundDuplicate) {
			setItems(
				items.map((item) => {
					if (item.id === itemData[indexC].items[indexI].id) {
						item.qty += 1;
						item.subtotal += item.price;
					}
					return item;
				})
			);
		} else {
			setItems([
				...items,
				{
					...itemData[indexC].items[indexI],
					qty: 1,
					subtotal: itemData[indexC].items[indexI].price,
				},
			]);
		}

		setTotal(total + itemData[indexC].items[indexI].price);
	};

	const resetItems = () => {
		setItems([]);
		setTotal(0);
	};

	const removeItem = (index) => {
		setItems(items.filter((item, i) => i !== index));
		setTotal(total - items[index].subtotal);
	};

	const addReceived = (amt) => {
		setReceived(received + amt);
	};

	var formatter = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',

		// These options are needed to round to whole numbers if that's what you want.
		//minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
		//maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
	});

	return (
		<div
			className="app"
			style={{
				backgroundColor: '#ffe9e5',
				padding: '10px',
				height: height - 20,
			}}
		>
			<div>
				<Grid
					container
					spacing={2}
					style={{
						overflow: 'auto',
						borderRadius: '5px',
					}}
				>
					<Grid
						item
						xs={11}
						sm={6}
						style={{
							overflow: 'auto',
							height: height,
						}}
					>
						<ItemSelector props={{ addItem, itemData, formatter }} />
					</Grid>
					<Grid item xs={12} sm={6}>
						<div
							style={{
								display: 'flex',
								flexDirection: 'column',
								justifyContent: 'space-between',
								gap: 10,
								height: '100%',
							}}
						>
							<SelectedItems props={{ items, formatter, height, removeItem }} />
							<div
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'flex-end',
									margin: 10,
								}}
							>
								<Button
									variant="contained"
									onClick={() => {
										resetItems();
									}}
									style={{
										width: '20%',
										height: '50px',
										backgroundColor: '#FF907C',
									}}
									color="error"
								>
									<Typography variant="h5">Reset</Typography>
								</Button>
								<Button
									variant="contained"
									onClick={() => {
										handleOpenConfirmRecord();
									}}
									style={{
										width: '20%',
										height: '50px',
										backgroundColor: '#FF907C',
									}}
									color="error"
								>
									<Typography variant="h5">Record</Typography>
								</Button>
								<Paper
									style={{
										padding: '10px',
										borderRadius: '5px',
									}}
									onClick={handleOpenComputeChange}
								>
									<Typography
										variant="h3"
										style={{
											color: '#BB6750',
										}}
									>
										Total: {formatter.format(total)}
									</Typography>
								</Paper>
							</div>
						</div>
					</Grid>
				</Grid>
			</div>
			<ConfirmRecord props={{ items, total, handleCloseConfirmRecord, openConfirmRecord, sheetName }} />
			<ComputeChange props={{ addReceived, formatter, total, received, setReceived, handleCloseComputeChange, openComputeChange }} />
		</div>
	);
};

export default Cashier;
