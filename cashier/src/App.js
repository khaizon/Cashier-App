import {
  Avatar,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  createTheme,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import { Delete } from "@mui/icons-material";
import { useState } from "react";

function App() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const addItem = (index) => {
    setItems([
      ...items,
      { ...itemData[index], qty: 1, subtotal: itemData[index].price },
    ]);
    setTotal(total + itemData[index].price);
  };

  const resetItems = () => {
    setItems([]);
    setTotal(0);
  };

  const removeItem = (index) => {
    setItems(items.filter((item, i) => i !== index));
    setTotal(total - items[index].subtotal);
  };

  var formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",

    // These options are needed to round to whole numbers if that's what you want.
    //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
    //maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
  });
  return (
    <div
      className="app"
      style={{
        backgroundColor: "#ffe9e5",
      }}
    >
      <Grid
        container
        spacing={2}
        style={{
          height: window.innerHeight,
          overflow: "auto",
        }}
      >
        <Grid
          item
          xs={5}
          style={{
            height: "100%",
            overflow: "auto",
          }}
        >
          <Paper
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-around",
              gap: "10px",
              padding: "10px",
            }}
          >
            {itemData.map((item, index) => (
              <Card
                style={{
                  flex: "1 0 29%",
                }}
              >
                <CardActionArea
                  onClick={() => {
                    addItem(index);
                  }}
                >
                  <CardMedia
                    component="img"
                    height={window.innerWidth * 0.1}
                    image={item.img}
                    alt="green iguana"
                  />
                  <CardContent>
                    <Typography
                      gutterBottom
                      variant="body1"
                      component="div"
                      style={{
                        // wordBreak: "break-word",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        "-webkit-line-clamp": 3,
                        "-webkit-box-orient": "vertical",
                        color: "#BB6750",
                      }}
                    >
                      {item.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      style={{
                        color: "#F7B09D",
                      }}
                    >
                      {formatter.format(item.price)}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
          </Paper>
        </Grid>
        <Grid item xs={7}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              height: "100%",
            }}
          >
            <TableContainer
              component={Paper}
              style={{
                maxHeight: window.innerHeight - 200,
              }}
            >
              <Table sx={{}} aria-label="simple table" size="small">
                <TableHead
                  style={{
                    backgroundColor: "#FF907C",
                  }}
                >
                  <TableRow>
                    <TableCell>
                      <Typography
                        variant="h6"
                        style={{
                          color: "white",
                        }}
                      >
                        Icon
                      </Typography>
                    </TableCell>
                    <TableCell align="left">
                      <Typography
                        variant="h6"
                        style={{
                          color: "white",
                        }}
                      >
                        Name
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="h6"
                        style={{
                          color: "white",
                        }}
                      >
                        Price
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="h6"
                        style={{
                          color: "white",
                        }}
                      >
                        Qty
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="h6"
                        style={{
                          color: "white",
                        }}
                      >
                        Remove
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="h6"
                        style={{
                          color: "white",
                        }}
                      >
                        Subtotal
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((row, index) => (
                    <TableRow
                      key={row.name}
                      sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                    >
                      <TableCell align="left">
                        <Avatar src={row.img} variant="rounded" />
                      </TableCell>
                      <TableCell
                        align="left"
                        style={{
                          color: "#BB6750",
                        }}
                      >
                        {row.title}
                      </TableCell>
                      <TableCell
                        align="right"
                        style={{
                          color: "#BB6750",
                        }}
                      >
                        {formatter.format(row.price)}
                      </TableCell>
                      <TableCell
                        align="right"
                        style={{
                          color: "#BB6750",
                        }}
                      >
                        {row.qty}
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          onClick={() => removeItem(index)}
                          style={{
                            color: "#BB6750",
                          }}
                        >
                          <Delete />
                        </Button>
                      </TableCell>
                      <TableCell
                        align="right"
                        style={{
                          color: "#BB6750",
                        }}
                      >
                        {formatter.format(row.subtotal)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                margin: 20,
              }}
            >
              <Button
                variant="contained"
                onClick={() => {
                  resetItems();
                }}
                style={{
                  width: "40%",
                  height: "50px",
                  backgroundColor: "#FF907C",
                }}
                color="error"
              >
                Reset
              </Button>
              <Paper
                style={{
                  padding: "20px",
                  borderRadius: "10px",
                }}
              >
                <Typography
                  variant="h3"
                  style={{
                    color: "#BB6750",
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
  );
}

export default App;

const itemData = [
  {
    img: "./images/artprint.jpg",
    title: "Art Print",
    price: 4.5,
  },
  {
    img: "./images/artprint3combo.jpg",
    title: "Art Print x 3",
    price: 12,
  },
  {
    img: "./images/artprint5combo.jpg",
    title: "Art Print x 5",
    price: 22,
  },
  {
    img: "./images/bbtsling.jpg",
    title: "Bubble Tea Sling",
    price: 8,
  },
  {
    img: "./images/blind.jpg",
    title: "Blind Bag",
    price: 7,
  },
  {
    img: "./images/keychain8.jpg",
    title: "KeyChain (MaoDonalds)",
    price: 8,
  },
  {
    img: "./images/keychain9.jpg",
    title: "KeyChain (Milk/Bread)",
    price: 9,
  },
  {
    img: "./images/maodonaldsticker.jpg",
    title: "Maodonalds",
    price: 5,
  },
  {
    img: "./images/medicinepin.jpg",
    title: "Meds Pin",
    price: 6,
  },
  {
    img: "./images/memopad.jpg",
    title: "Memo Pad",
    price: 5,
  },
  {
    img: "./images/mito.jpg",
    title: "Collab",
    price: 6.5,
  },
  {
    img: "./images/pin5.jpg",
    title: "Snacks Pin",
    price: 5,
  },
  {
    img: "./images/sticker.jpg",
    title: "sticker",
    price: 2,
  },
  {
    img: "./images/stickers3combo.jpg",
    title: "Stickers x 3",
    price: 5,
  },
  {
    img: "./images/stickerpack.jpg",
    title: "Sticker Pack",
    price: 6.5,
  },
  {
    img: "./images/stickersheet.jpg",
    title: "Sticker Sheet",
    price: 7,
  },
  {
    img: "./images/washi.jpg",
    title: "washi",
    price: 7.5,
  },
];
