import { Paper, Typography, Button, Box, Modal } from '@mui/material';

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
	cursor: 'pointer',
};

const ComputeChange = ({
	props: { addReceived, formatter, total, received, setReceived, handleCloseComputeChange, openComputeChange },
}) => {
	return (
		<Modal
			open={openComputeChange}
			onClose={handleCloseComputeChange}
			aria-labelledby="compute-change"
			aria-describedby="modal-modal-description"
		>
			<Box sx={modalStyle}>
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						paddingBottom: 20,
					}}
				>
					<Button
						variant="contained"
						onClick={() => {
							setReceived(0);
						}}
						style={{
							backgroundColor: '#ffc6bd',
							color: '#BB6750',
							fontSize: '1rem',
						}}
					>
						Reset
					</Button>
					<Typography
						variant="h5"
						style={{
							color: '#ef476f',
						}}
					>
						Received
					</Typography>
					<Paper
						style={{
							padding: '5px',
							borderRadius: '5px',
						}}
					>
						<Typography
							variant="h5"
							style={{
								color: '#ef476f',
							}}
						>
							{formatter.format(received)}
						</Typography>
					</Paper>
				</div>
				<div
					style={{
						display: 'flex',
						gap: 12,
						flexWrap: 'wrap',
					}}
				>
					<Button
						variant="contained"
						style={{
							backgroundColor: '#FF907C',
							flex: '1 0 10%',
						}}
						onClick={() => {
							addReceived(50);
						}}
					>
						50
					</Button>
					<Button
						variant="contained"
						style={{
							backgroundColor: '#FF907C',
							flex: '1 0 10%',
						}}
						onClick={() => {
							addReceived(10);
						}}
					>
						10
					</Button>
					<Button
						variant="contained"
						style={{
							backgroundColor: '#FF907C',
							flex: '1 0 10%',
						}}
						onClick={() => {
							addReceived(5);
						}}
					>
						5
					</Button>
					<Button
						variant="contained"
						style={{
							backgroundColor: '#FF907C',
							flex: '1 0 10%',
						}}
						onClick={() => {
							addReceived(2);
						}}
					>
						2
					</Button>
					<Button
						variant="contained"
						style={{
							backgroundColor: '#FF907C',
							flex: '1 0 31%',
						}}
						onClick={() => {
							addReceived(0.5);
						}}
					>
						+ 0.50
					</Button>
					<Button
						variant="contained"
						style={{
							backgroundColor: '#FF907C',
							flex: '1 0 31%',
						}}
						onClick={() => {
							addReceived(-0.5);
						}}
					>
						- 0.50
					</Button>
				</div>
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						marginTop: 20,
					}}
				>
					<Typography
						variant="h5"
						style={{
							color: '#BB6750',
						}}
					>
						Less
					</Typography>
					<Paper
						style={{
							padding: '10px',
							borderRadius: '5px',
						}}
					>
						<Typography
							variant="h5"
							style={{
								color: '#BB6750',
							}}
						>
							&#40;{formatter.format(total)}&#41;
						</Typography>
					</Paper>
				</div>
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						marginTop: 20,
					}}
				>
					<Typography
						variant="h5"
						style={{
							color: '#606c38',
						}}
					>
						Change
					</Typography>
					<Paper
						style={{
							padding: '10px',
							borderRadius: '5px',
						}}
					>
						<Typography
							variant="h4"
							style={{
								color: '#606c38',
							}}
						>
							{formatter.format(received - total)}
						</Typography>
					</Paper>
				</div>
			</Box>
		</Modal>
	);
};

export default ComputeChange;
