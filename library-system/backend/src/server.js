const app = require("./app");
const { connectDB } = require("./config/db");
const { ENV } = require("./config/env");

const startServer = async () => {
  await connectDB();

  app.listen(ENV.PORT, () => {
    console.log(`Server running on http://localhost:${ENV.PORT}`);
  });
};

startServer();
