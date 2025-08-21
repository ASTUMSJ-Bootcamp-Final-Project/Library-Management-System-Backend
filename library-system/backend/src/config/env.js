const dotenv = require("dotenv");
dotenv.config();

const ENV = {
  APP_NAME: process.env.APP_NAME || "Library Management System",
  PORT: process.env.PORT || 3000,
  MONGO_URI: process.env.MONGO_URI,
};

module.exports = { ENV };
