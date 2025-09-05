const express = require("express");
const { 
  requestBorrow, 
  confirmCollection, 
  cancelExpiredReservations,
  returnBook, 
  confirmReturn,
  listBorrows, 
  getUserBorrowingStatus,
  getUserBorrowingHistory,
  getPendingReservations,
  getBookBorrowingHistory,
  cancelReservation
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

// Users, Admins, and Super Admins can request to return books
router.post("/return", authMiddleware, authorizeRoles("user", "admin", "super_admin"), returnBook);

// Admins confirm book returns
router.post("/confirm-return", authMiddleware, authorizeRoles("admin", "super_admin"), confirmReturn);

// Get user's borrowing status
router.get("/status", authMiddleware, authorizeRoles("user", "admin", "super_admin"), getUserBorrowingStatus);

// Get user's borrowing history with pagination
router.get("/user-history", authMiddleware, authorizeRoles("user", "admin", "super_admin"), getUserBorrowingHistory);

// Get pending reservations (admin view)
router.get("/pending-reservations", authMiddleware, authorizeRoles("admin", "super_admin"), getPendingReservations);

// Get borrowing history for a specific book (admin view)
router.get("/book/:bookId/history", authMiddleware, authorizeRoles("admin", "super_admin"), getBookBorrowingHistory);

// Cancel a reservation (users can cancel their own reservations)
router.post("/cancel-reservation", authMiddleware, authorizeRoles("user"), cancelReservation);

// List borrows; users see their own, admins/super_admins see all
router.get("/", authMiddleware, authorizeRoles("user", "admin", "super_admin"), listBorrows);

module.exports = router;


