const express = require("express");
const { listBooks, addBook, updateBook, deleteBook, getBookById } = require("../controllers/bookController");
const { authMiddleware } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/", authMiddleware, listBooks); // anyone with username/password
router.get("/:id", authMiddleware, getBookById);// anyone with username/password

router.post("/", authMiddleware, authorizeRoles("admin"), addBook);
router.put("/:id", authMiddleware, authorizeRoles("admin"), updateBook);
router.delete("/:id", authMiddleware, authorizeRoles("admin"), deleteBook);

module.exports = router;
