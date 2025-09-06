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
const { uploadBookCover } = require("../middleware/cloudinaryUploadMiddleware");

const router = express.Router();

// Public
router.get("/", listBooks);
router.get("/:id", getBookById);

// Admin and Super Admin can manage books
router.post("/", authMiddleware, authorizeRoles("admin", "super_admin"), uploadBookCover, addBook);
router.put("/:id", authMiddleware, authorizeRoles("admin", "super_admin"), uploadBookCover, updateBook);
router.delete("/:id", authMiddleware, authorizeRoles("admin", "super_admin"), deleteBook);

module.exports = router;
