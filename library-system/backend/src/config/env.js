const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  port: process.env.PORT || 5000,
  connectionString: process.env.CONNECTION_STRING,
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
  adminSecretCode: process.env.ADMIN_SECRET_CODE,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "4320m",
};
