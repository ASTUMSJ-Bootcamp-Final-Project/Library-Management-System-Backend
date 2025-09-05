const express = require("express");
const cors = require("cors");
const path = require("path"); // for handling file paths

const bookRoutes = require("./routes/bookRoutes");
const userRoutes = require("./routes/userRoutes");
const borrowRoutes = require("./routes/borrowRoutes");
const reminderRoutes = require("./routes/reminderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const eventsRoutes = require("./routes/eventsRoutes");

const app = express();

// Root route
app.get("/", (req, res) => {
  res.send("Library Management System API is running");
});

app.use(cors());
app.use(express.json());

// Serve uploaded files (images, docs, etc.)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/books", bookRoutes);
app.use("/api/users", userRoutes);
app.use("/api/borrow", borrowRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/events", eventsRoutes);

module.exports = app;
