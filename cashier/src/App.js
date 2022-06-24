import {
  Avatar,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Grid,
  Modal,
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
import useWindowDimensions from "./hooks/useWindowDimensions";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  height: 300,
  width: 300,
  bgcolor: "#ffe9e5",
  borderRadius: 3,
  boxShadow: 24,
  p: 4,
};

function App() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [received, setReceived] = useState(0);
  const { height, width } = useWindowDimensions();

  // modal
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const addItem = (index) => {
    let foundDuplicate = false;
    for (let i = 0; i < items.length; i += 1) {
      if (items[i].title === itemData[index].title) {
        foundDuplicate = true;
        break;
      }
    }
    if (foundDuplicate) {
      setItems(
        items.map((item) => {
          if (item.title === itemData[index].title) {
            item.qty += 1;
            item.subtotal += item.price;
          }
          return item;
        })
      );
    } else {
      setItems([...items, { ...itemData[index], qty: 1, subtotal: itemData[index].price }]);
    }

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

  const addReceived = (amt) => {
    setReceived(received + amt);
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
        padding: "10px",
      }}
    >
      <div>
        <Grid
          container
          spacing={2}
          style={{
            overflow: "auto",
          }}
        >
          <Grid
            item
            xs={5}
            style={{
              overflow: "auto",
              height: height,
            }}
          >
            <Paper
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px",
                padding: "10px",
                borderRadius: "15px",
              }}
            >
              {itemData.map((item, index) => (
                <Card
                  style={{
                    flex: "1 0 130px",
                  }}
                >
                  <CardActionArea
                    onClick={() => {
                      addItem(index);
                    }}
                  >
                    <CardMedia
                      component="img"
                      height={width * 0.1}
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
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
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
                gap: 10,
                height: "100%",
              }}
            >
              <TableContainer
                component={Paper}
                style={{
                  maxHeight: height - 150,
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
                      <TableCell align="center">
                        <Typography
                          variant="h6"
                          style={{
                            color: "white",
                          }}
                        >
                          Qty
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography
                          variant="h6"
                          style={{
                            color: "white",
                          }}
                        >
                          Del
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
                        sx={{
                          "&:last-child td, &:last-child th": { border: 0 },
                        }}
                      >
                        <TableCell align="left">
                          <Avatar
                            src={row.img}
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
                          align="center"
                          style={{
                            color: row.qty > 1 ? "white" : "#BB6750",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "stretch",
                              justifyContent: "center",
                            }}
                          >
                            <Box
                              style={{
                                height: "40px",
                                width: "40px",
                                backgroundColor: row.qty > 1 ? "#ffc6bd" : "white",
                                borderRadius: 7,
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                              }}
                            >
                              <Typography variant={row.qty > 1 ? "h5" : "body1"}>
                                {row.qty}
                              </Typography>
                            </Box>
                          </div>
                        </TableCell>
                        <TableCell align="center">
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
                  margin: 10,
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
                  <Typography variant="h5">Reset</Typography>
                </Button>
                <Paper
                  style={{
                    padding: "10px",
                    borderRadius: "10px",
                  }}
                  onClick={handleOpen}
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
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={modalStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingBottom: 20,
            }}
          >
            <Button
              variant="contained"
              onClick={() => {
                setReceived(0);
              }}
              style={{
                backgroundColor: "#ffc6bd",
                color: "#BB6750",
                fontSize: "1rem",
              }}
            >
              Reset
            </Button>
            <Typography
              variant="h5"
              style={{
                color: "#ef476f",
              }}
            >
              Received
            </Typography>
            <Paper
              style={{
                padding: "5px",
                borderRadius: "10px",
              }}
            >
              <Typography
                variant="h5"
                style={{
                  color: "#ef476f",
                }}
              >
                {formatter.format(received)}
              </Typography>
            </Paper>
          </div>
          <div
            style={{
              display: "flex",
              gap: 5,
              flexWrap: "wrap",
            }}
          >
            <Button
              variant="contained"
              style={{
                backgroundColor: "#FF907C",
                flex: "1 0 21%",
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
                backgroundColor: "#FF907C",
                flex: "1 0 21%",
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
                backgroundColor: "#FF907C",
                flex: "1 0 21%",
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
                backgroundColor: "#FF907C",
                flex: "1 0 21%",
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
                backgroundColor: "#FF907C",
                flex: "1 0 31%",
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
                backgroundColor: "#FF907C",
                flex: "1 0 31%",
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
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 20,
            }}
          >
            <Typography
              variant="h5"
              style={{
                color: "#BB6750",
              }}
            >
              Less
            </Typography>
            <Paper
              style={{
                padding: "10px",
                borderRadius: "10px",
              }}
            >
              <Typography
                variant="h5"
                style={{
                  color: "#BB6750",
                }}
              >
                &#40;{formatter.format(total)}&#41;
              </Typography>
            </Paper>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 20,
            }}
          >
            <Typography
              variant="h5"
              style={{
                color: "#606c38",
              }}
            >
              Change
            </Typography>
            <Paper
              style={{
                padding: "10px",
                borderRadius: "10px",
              }}
            >
              <Typography
                variant="h4"
                style={{
                  color: "#606c38",
                }}
              >
                {formatter.format(received - total)}
              </Typography>
            </Paper>
          </div>
        </Box>
      </Modal>
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
