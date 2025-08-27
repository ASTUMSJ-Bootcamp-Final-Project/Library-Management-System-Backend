const express = require("express");
const { borrowBook, returnBook, listBorrows, getUserBorrowingStatus } = require("../controllers/borrowController");
const { authMiddleware } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

// Users, Admins, and Super Admins can borrow books
router.post("/", authMiddleware, authorizeRoles("user", "admin", "super_admin"), borrowBook);

// Users, Admins, and Super Admins can return books
router.post("/return", authMiddleware, authorizeRoles("user", "admin", "super_admin"), returnBook);

// Get user's borrowing status
router.get("/status", authMiddleware, authorizeRoles("user", "admin", "super_admin"), getUserBorrowingStatus);

// List borrows; users see their own, admins/super_admins see all
router.get("/", authMiddleware, authorizeRoles("user", "admin", "super_admin"), listBorrows);

module.exports = router;


