const app = require("./app");
const { connectDB } = require("./config/db");
const { ENV } = require("./config/env");
const { runMaintenanceTasks } = require("./utils/dateUtils");
const Borrow = require("./models/Borrow");
const Book = require("./models/Book");
const reminderService = require("./services/reminderService");

const startServer = async () => {
  await connectDB();

  // Set up scheduled maintenance tasks
  const runScheduledMaintenance = async () => {
    try {
      await runMaintenanceTasks(Borrow, Book);
    } catch (error) {
      console.error("Scheduled maintenance failed:", error);
    }
  };

  // Run maintenance every hour
  setInterval(runScheduledMaintenance, 2 * 60 * 60 * 1000); // 2 hour

  // Run initial maintenance on server start
  runScheduledMaintenance();

  // Start the reminder service for email notifications
  reminderService.startScheduler();

  app.listen(ENV.PORT, () => {
    console.log(`Server running on http://localhost:${ENV.PORT}`);
    console.log("Scheduled maintenance tasks enabled (runs every hour)");
    console.log("Email reminder service started");
  });
};

startServer();
