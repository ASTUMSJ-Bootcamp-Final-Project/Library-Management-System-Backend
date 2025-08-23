const mongoose = require("mongoose");
const { connectionString } = require("./env");

const connectDB = async () => {
  try {
    const connect = await mongoose.connect(connectionString);
    console.log(
      "Database connected: ",
      connect.connection.host,
      connect.connection.name
    );
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};

module.exports = connectDB;
