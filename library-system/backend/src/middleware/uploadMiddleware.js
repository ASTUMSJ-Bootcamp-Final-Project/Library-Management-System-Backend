const multer = require("multer");

// store in memory so we can send buffer to Cloudinary
const storage = multer.memoryStorage();

const upload = multer({ storage });

module.exports = upload;
