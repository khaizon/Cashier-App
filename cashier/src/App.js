import "./App.css";
import {
  Avatar,
  Button,
  Grid,
  ImageList,
  ImageListItem,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
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
    <div className="App">
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
          xs={4}
          style={{
            height: "100%",
            overflow: "auto",
          }}
        >
          <Paper>
            <List
              sx={{ width: "100%", height: "100%", overflow: "auto" }}
              cols={3}
              rowHeight={100}
            >
              {itemData.map((item, index) => (
                <ListItem>
                  <ListItemAvatar key={item.title}>
                    <Avatar
                      variant="rounded"
                      src={item.img}
                      onClick={() => {
                        addItem(index);
                      }}
                      sx={{
                        height: 100,
                        width: 100,
                      }}
                    />
                  </ListItemAvatar>
                  <ListItemText
                    style={{
                      paddingLeft: 10,
                    }}
                    primary={<Typography variant="h5">{item.title}</Typography>}
                    secondary={
                      <Typography variant="body1">
                        {formatter.format(item.price)}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        <Grid item xs={8}>
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
                <TableHead>
                  <TableRow>
                    <TableCell>Img</TableCell>
                    <TableCell align="right">Name</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Remove</TableCell>
                    <TableCell align="right">Subtotal</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((row, index) => (
                    <TableRow
                      key={row.name}
                      sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                    >
                      <TableCell>
                        <img
                          src={`${row.img}?w=40&h=40&fit=crop&auto=format`}
                          srcSet={`${row.img}?w=40&h=40&fit=crop&auto=format&dpr=2 2x`}
                          alt={row.title}
                          style={{
                            width: 40,
                            height: 40,
                          }}
                          loading="lazy"
                        />
                      </TableCell>
                      <TableCell align="right">{row.title}</TableCell>
                      <TableCell align="right">{row.price}</TableCell>
                      <TableCell align="right">{row.qty}</TableCell>
                      <TableCell align="right">
                        <Button onClick={() => removeItem(index)}>
                          <Delete />
                        </Button>
                      </TableCell>
                      <TableCell align="right">{row.subtotal}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                margin: 20,
              }}
            >
              <Button
                variant="outlined"
                onClick={() => {
                  resetItems();
                }}
              >
                Reset
              </Button>
              <Typography variant="h3">Total: {total}</Typography>
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
    title: "Key Chain (MaoDonalds)",
    price: 8,
  },
  {
    img: "./images/keychain9.jpg",
    title: "Key Chain (Milk/Bread)",
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
