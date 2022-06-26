import { Card, CardActionArea, CardContent, CardMedia, Grid, Paper, Box, Typography } from '@mui/material';

const ItemSelector = ({ props: { itemData, addItem, formatter } }) => {
	return (
		<Paper
			style={{
				padding: '10px',
				borderRadius: '5px',
			}}
		>
			{itemData?.map((group, indexC) => (
				<div key={indexC}>
					<Box
						style={{
							backgroundColor: 'white',
							marginTop: '5px',
							marginBottom: '5px',
						}}
					>
						<Typography
							variant="h5"
							style={{
								color: group.palette3,
								fontFamily: 'Indie Flower, Cherry Cream Soda',
							}}
						>
							{group.category}
						</Typography>
					</Box>
					<div>
						<Grid container spacing="10px">
							{group?.items.map((item, indexI) => (
								<Grid item xs={12} sm={6} key={indexI}>
									<Card>
										<CardActionArea
											onClick={() => {
												addItem(indexC, indexI);
											}}
											sx={{
												display: 'flex',
												alignItems: 'stretch',
												justifyContent: 'flex-start',
												backgroundColor: group.palette2,
											}}
										>
											<CardMedia
												component="img"
												style={{
													height: '100px',
													maxWidth: '100px',
													minWidth: '100px',
												}}
												image={`${item.img}`}
												alt={item.title}
											/>
											<CardContent
												sx={{
													padding: '10px 10px 0px 10px',
													display: 'flex',
												}}
											>
												<div
													style={{
														display: 'flex',
														flexDirection: 'column',
														justifyContent: 'space-between',
													}}
												>
													<div>
														<Typography
															gutterBottom
															variant="h6"
															component="div"
															style={{
																wordBreak: 'break-word',
																overflow: 'hidden',
																textOverflow: 'ellipsis',
																display: '-webkit-box',
																WebkitLineClamp: 2,
																WebkitBoxOrient: 'vertical',
																color: '#BB6750',
																marginBottom: '0px',
																lineHeight: 1.15,
															}}
														>
															{item.title}
														</Typography>
													</div>
													<div>
														<Typography
															variant="h6"
															style={{
																color: '#F7B09D',
																marginBottom: '5px',
															}}
														>
															{formatter.format(item.price)}
														</Typography>
													</div>
												</div>
											</CardContent>
										</CardActionArea>
									</Card>
								</Grid>
							))}
						</Grid>
					</div>
				</div>
			))}
		</Paper>
	);
};

export default ItemSelector;
