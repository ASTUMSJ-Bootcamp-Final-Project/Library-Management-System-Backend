const express = require("express");
const errorHandler = require("./middleware/errorHandler"); //Import custom error handling middleware
const connectDB = require("./config/db");
const { port } = require("./config/env");

connectDB();
const app = express();

app.use(express.json());
app.use("/api/books", require("./routes/bookRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use(errorHandler); // Register global error handling middleware

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
