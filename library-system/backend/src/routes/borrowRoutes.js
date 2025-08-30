const express = require("express");
const { 
  requestBorrow, 
  confirmCollection, 
  cancelExpiredReservations,
  returnBook, 
  listBorrows, 
  getUserBorrowingStatus,
  getPendingReservations
} = require("../controllers/borrowController");
const { authMiddleware } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

// Students request to borrow a book (creates reservation)
router.post("/request", authMiddleware, authorizeRoles("user"), requestBorrow);

// Admins confirm book collection and convert reservation to borrow
router.post("/confirm-collection", authMiddleware, authorizeRoles("admin", "super_admin"), confirmCollection);

// Cancel expired reservations (can be called by admins or scheduled)
router.post("/cancel-expired", authMiddleware, authorizeRoles("admin", "super_admin"), cancelExpiredReservations);

// Users, Admins, and Super Admins can return books
router.post("/return", authMiddleware, authorizeRoles("user", "admin", "super_admin"), returnBook);

// Get user's borrowing status
router.get("/status", authMiddleware, authorizeRoles("user", "admin", "super_admin"), getUserBorrowingStatus);

// Get pending reservations (admin view)
router.get("/pending-reservations", authMiddleware, authorizeRoles("admin", "super_admin"), getPendingReservations);

// List borrows; users see their own, admins/super_admins see all
router.get("/", authMiddleware, authorizeRoles("user", "admin", "super_admin"), listBorrows);

module.exports = router;


