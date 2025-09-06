const dotenv = require("dotenv");
dotenv.config();

const ENV = {
  APP_NAME: process.env.APP_NAME || "Library Management System",
  PORT: process.env.PORT || 4000,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET || "defaultsecret",
  
  // Email Configuration
  EMAIL_SERVICE: process.env.EMAIL_SERVICE, // 'gmail', 'yahoo', 'outlook', etc.
  EMAIL_USER: process.env.EMAIL_USER, // Your email address
  EMAIL_PASS: process.env.EMAIL_PASS, // App password for email service
  
  // Cloudinary Configuration
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
};

module.exports = { ENV };
