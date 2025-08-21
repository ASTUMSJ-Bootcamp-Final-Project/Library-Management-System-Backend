const express = require("express");
const cors = require("cors");
const bookRoutes = require("./routes/bookRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

app.get("/", (req, res) => {
  res.send("Library Management System API is running");
});

app.use(cors());
app.use(express.json());

app.use("/api/books", bookRoutes);
app.use("/api/auth", userRoutes);

module.exports = app;
