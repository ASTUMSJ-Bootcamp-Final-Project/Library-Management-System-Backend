const express = require("express");
const router = express.Router();
const {
  getBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
} = require("../controllers/bookController");
const validateToken = require("../middleware/validateTokenHandler");

router.use(validateToken);
router.route("/").get(getBooks);
router.route("/:id").get(getBook);
router.route("/").post(createBook);
router.route("/:id").put(updateBook);
router.route("/:id").delete(deleteBook);

module.exports = router;
