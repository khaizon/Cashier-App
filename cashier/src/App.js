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

  const addItem = (indexC, indexI) => {
    let foundDuplicate = false;
    for (let i = 0; i < items.length; i += 1) {
      if (items[i].title === itemData[indexC].items[indexI].title) {
        foundDuplicate = true;
        break;
      }
    }
    if (foundDuplicate) {
      setItems(
        items.map((item) => {
          if (item.title === itemData[indexC].items[indexI].title) {
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
                padding: "10px",
                borderRadius: "5px",
              }}
            >
              {itemData.map((group, indexC) => (
                <div key={indexC}>
                  <Box
                    style={{
                      backgroundColor: "white",
                      marginTop: "5px",
                      marginBottom: "5px",
                    }}
                  >
                    <Typography
                      variant="h6"
                      style={{
                        color: group.palette3,
                      }}
                    >
                      {group.category}
                    </Typography>
                  </Box>
                  <div>
                    <Grid container spacing="10px">
                      {group.items.map((item, indexI) => (
                        <Grid item xs={6} md={6} key={indexI}>
                          <Card>
                            <CardActionArea
                              onClick={() => {
                                addItem(indexC, indexI);
                              }}
                              sx={{
                                display: "flex",
                                alignItems: "stretch",
                                justifyContent: "flex-start",
                                backgroundColor: group.palette2,
                              }}
                            >
                              <CardMedia
                                component="img"
                                style={{
                                  height: "100px",
                                  maxWidth: "100px",
                                  minWidth: "100px",
                                }}
                                image={item.img}
                                alt="green iguana"
                              />
                              <CardContent
                                sx={{
                                  padding: "10px 10px 0px 10px",
                                  display: "flex",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "space-between",
                                  }}
                                >
                                  <div>
                                    <Typography
                                      gutterBottom
                                      variant="h6"
                                      component="div"
                                      style={{
                                        wordBreak: "break-word",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        display: "-webkit-box",
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: "vertical",
                                        color: "#BB6750",
                                        marginBottom: "0px",
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
                                        color: "#F7B09D",
                                        marginBottom: "5px",
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
                <Table size="small">
                  <TableHead
                    style={{
                      backgroundColor: "#FF907C",
                      position: "sticky",
                      top: 0,
                      zIndex: "1",
                    }}
                  >
                    <TableRow>
                      <TableCell
                        style={{
                          padding: "0 10px 0 10px",
                        }}
                      >
                        <Typography
                          variant="h6"
                          style={{
                            color: "white",
                          }}
                        >
                          Icon
                        </Typography>
                      </TableCell>
                      <TableCell
                        align="left"
                        style={{
                          padding: "0 10px 0 10px",
                        }}
                      >
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
                        <TableCell
                          align="left"
                          style={{
                            padding: "0px",
                          }}
                        >
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
                            padding: "0 10px 0 10px",
                          }}
                        >
                          <Typography variant="h6">{row.title}</Typography>
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
                                backgroundColor:
                                  row.qty > 1 ? "#ffc6bd" : "white",
                                borderRadius: 7,
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                              }}
                            >
                              <Typography
                                variant={row.qty > 1 ? "h5" : "body1"}
                              >
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
                            fontWeight: "bold",
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
    category: "Stickers",
    palette1: "#FFE6E6",
    palette2: "#fff2f2",
    palette3: "#ff7d7d",
    items: [
      {
        img: "./images/sticker.jpg",
        title: "Die Cut",
        price: 2,
      },
      {
        img: "./images/stickers3combo.jpg",
        title: "3 x Die Cut",
        price: 5,
      },
      {
        img: "./images/maodonaldsticker.jpg",
        title: "Mao Donalds",
        price: 5,
      },
      {
        img: "./images/mito.jpg",
        title: "Collab",
        price: 6.5,
      },
      {
        img: "./images/stickerpack.jpg",
        title: "Pack",
        price: 6.5,
      },
      {
        img: "./images/stickersheet.jpg",
        title: "Sheet",
        price: 7,
      },
    ],
  },
  {
    category: "Key Chains",
    palette1: "#DAEAF1",
    palette2: "#f2f8fa",
    palette3: "#3fb4e8",

    items: [
      {
        img: "./images/snackskeychain.jpg",
        title: "Snacks",
        price: 5,
      },
      {
        img: "./images/blind.jpg",
        title: "Blind Bag",
        price: 7,
      },
      {
        img: "./images/keychain8.jpg",
        title: "Mao Donalds",
        price: 8,
      },
      {
        img: "./images/keychain9.jpg",
        title: "Milk / Bread",
        price: 9,
      },
    ],
  },

  {
    category: "Washi Tapes",
    palette1: "#FFF89A",
    palette2: "#f5f4e9",
    palette3: "#c2b723",

    items: [
      {
        img: "./images/washi.jpg",
        title: "washi",
        price: 7.5,
      },
    ],
  },

  {
    category: "Acrylic Pins",
    palette1: "#FFB2A6",
    palette2: "#ffedeb",
    palette3: "#ff5338",

    items: [
      {
        img: "./images/medicinepin.jpg",
        title: "Meds Pin",
        price: 6,
      },

      {
        img: "./images/pin5.jpg",
        title: "Snacks Pin",
        price: 5,
      },
    ],
  },

  {
    category: "Art Prints",
    palette1: "#FAFDD6",
    palette2: "#f9faf0",
    palette3: "#abb825",

    items: [
      {
        img: "./images/artprint.jpg",
        title: "Art Print",
        price: 4.5,
      },
      {
        img: "./images/artprint3combo.jpg",
        title: "3 x Art Print",
        price: 12,
      },
      {
        img: "./images/artprint5combo.jpg",
        title: "5 x Art Print",
        price: 22,
      },
    ],
  },

  {
    category: "Memo Pads",
    palette1: "#E4E9BE",
    palette2: "#fefff5",
    palette3: "#a5b814",

    items: [
      {
        img: "./images/memopad.jpg",
        title: "Memo Pad",
        price: 5,
      },
    ],
  },

  {
    category: "BB Tea Carriers",
    palette1: "#A2B38B",
    palette2: "#eef0eb",
    palette3: "#73b020",

    items: [
      {
        img: "./images/bbtsling.jpg",
        title: "BB Tea Sling",
        price: 8,
      },
    ],
  },
];
