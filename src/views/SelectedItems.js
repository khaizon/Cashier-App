import { Delete } from '@mui/icons-material';
import { Paper, Table, TableCell, TableContainer, TableHead, TableRow, Typography, Button, Avatar, TableBody, Box } from '@mui/material';

const SelectedItems = ({ props: { items, formatter, height, removeItem } }) => {
	return (
		<TableContainer
			component={Paper}
			style={{
				maxHeight: height - 150,
				padding: 0,
			}}
		>
			<Table size="small">
				<TableHead
					style={{
						backgroundColor: '#FF907C',
						position: 'sticky',
						top: 0,
						zIndex: '1',
					}}
				>
					<TableRow>
						<TableCell
							style={{
								padding: '0 10px 0 10px',
							}}
						>
							<Typography
								variant="h6"
								style={{
									color: 'white',
								}}
							>
								Icon
							</Typography>
						</TableCell>
						<TableCell
							align="left"
							style={{
								padding: '0 10px 0 10px',
							}}
						>
							<Typography
								variant="h6"
								style={{
									color: 'white',
								}}
							>
								Name
							</Typography>
						</TableCell>
						<TableCell align="right">
							<Typography
								variant="h6"
								style={{
									color: 'white',
								}}
							>
								Price
							</Typography>
						</TableCell>
						<TableCell align="center">
							<Typography
								variant="h6"
								style={{
									color: 'white',
								}}
							>
								Qty
							</Typography>
						</TableCell>
						<TableCell align="center">
							<Typography
								variant="h6"
								style={{
									color: 'white',
								}}
							>
								Del
							</Typography>
						</TableCell>
						<TableCell align="right">
							<Typography
								variant="h6"
								style={{
									color: 'white',
								}}
							>
								Sub
							</Typography>
						</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{items.map((row, index) => (
						<TableRow
							key={row.id}
							sx={{
								'&:last-child td, &:last-child th': { border: 0 },
							}}
						>
							<TableCell
								align="left"
								style={{
									padding: '0px',
								}}
							>
								<Avatar
									src={`${row.img}`}
									variant="rounded"
									sx={{
										width: 60,
										height: 60,
									}}
								/>
							</TableCell>
							<TableCell
								align="left"
								style={{
									color: '#BB6750',
									padding: '0 10px 0 10px',
								}}
							>
								<Typography
									variant="h6"
									style={{
										fontWeight: 400,
										padding: 0,
									}}
								>
									{row.title}
								</Typography>
							</TableCell>
							<TableCell
								align="center"
								style={{
									color: '#BB6750',
									padding: 0,
								}}
							>
								{formatter.format(row.price)}
							</TableCell>
							<TableCell
								align="center"
								style={{
									color: row.qty > 1 ? 'white' : '#BB6750',
									padding: 0,
								}}
							>
								<div
									style={{
										display: 'flex',
										alignItems: 'stretch',
										justifyContent: 'center',
									}}
								>
									<Box
										style={{
											height: '40px',
											width: '40px',
											backgroundColor: row.qty > 1 ? '#ffc6bd' : 'white',
											borderRadius: 7,
											display: 'flex',
											justifyContent: 'center',
											alignItems: 'center',
										}}
									>
										<Typography variant={row.qty > 1 ? 'h5' : 'body1'}>{row.qty}</Typography>
									</Box>
								</div>
							</TableCell>
							<TableCell
								align="center"
								style={{
									padding: 0,
								}}
							>
								<Button
									onClick={() => removeItem(index)}
									style={{
										color: '#BB6750',
									}}
								>
									<Delete />
								</Button>
							</TableCell>
							<TableCell
								align="center"
								style={{
									color: '#BB6750',
									fontWeight: 'bold',
								}}
							>
								{formatter.format(row.subtotal)}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</TableContainer>
	);
};

export default SelectedItems;
