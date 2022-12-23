require("dotenv").config();

const PORT = 3000;
const express = require("express");
const app = express();
const apiRouter = require("./api");
const morgan = require("morgan");
const { client } = require("./db");

client.connect();

app.listen(PORT, () => {
  console.log("yay! your server is up on port ", PORT);
});

/*************** ONLY MIDDLEWARES GO HERE ***************/

app.use(morgan("dev"));

app.use(express.json());

app.use((req, res, next) => {
  console.log("<---BODY SNATCHER STARTS HERE--->");
  console.log(req.body);
  console.log("<---BODY SNATCHER ENDS HERE--->");

  next();
});

app.use("/api", apiRouter);
