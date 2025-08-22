const express = require("express");

const {
  listBooks,
  getBookById,
  addBook,
  updateBook,
  deleteBook,
} = require("../controllers/bookController");

const { authMiddleware } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const { upload } = require("../middleware/uploadMiddleware");

const router = express.Router();

// Public
router.get("/", listBooks);
router.get("/:id", getBookById);

// Admin only with file upload
router.post("/", authMiddleware, authorizeRoles("admin"), upload.single("coverImage"), addBook);
router.put("/:id", authMiddleware, authorizeRoles("admin"), upload.single("coverImage"), updateBook);
router.delete("/:id", authMiddleware, authorizeRoles("admin"), deleteBook);

module.exports = router;
