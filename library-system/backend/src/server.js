const express = require("express");
const errorHandler = require("./middleware/errorHandler"); //custom error handling middleware
const connectDB = require("./config/db");
const { port } = require("./config/env");
require("dotenv").config();
const cors = require("cors");

connectDB();
const app = express();

app.use(express.json());
app.use(cors());

app.use("/api/books", require("./routes/bookRoutes"));
app.use("/api/users", require("./routes/userRoutes"));

app.use("/api/borrows", require("./routes/borrowRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));



app.use(errorHandler); // Global error handling middleware (catches all errors)

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
