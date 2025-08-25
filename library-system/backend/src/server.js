const express = require("express");
const errorHandler = require("./middleware/errorHandler"); //Import custom error handling middleware
const connectDB = require("./config/db");
const dotenv = require("dotenv").config();
const cors = require("cors");

connectDB();
const app = express();
const port = process.env.PORT || 5000;
app.use(cors());

app.use(express.json());
app.use("/api/books", require("./routes/bookRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use(errorHandler); // Register global error handling middleware

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
