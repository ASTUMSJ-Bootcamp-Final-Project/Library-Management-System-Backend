const express = require("express");
const multer = require("multer");
const router = express.Router();
const {
  getBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
} = require("../controllers/bookController");
const validateToken = require("../middleware/validateTokenHandler");
const upload = require("../middleware/uploadMiddleware");

router.use(validateToken); // use for all end point for authentication

router.route("/").get(getBooks);
router.route("/:id").get(getBook);
router.route("/").post(upload.single("image"), createBook); // handle file upload
router.route("/:id").put(upload.single("image"), updateBook);
router.route("/:id").delete(deleteBook);

module.exports = router;
