const express = require("express");
const {
  requestBorrow,
  confirmBorrow,
  cancelReservation,
  returnBook,
  getBorrowHistory,
  getAllBorrowedBooks,
  getAllBorrowHistory,
  getAllReservations,
} = require("../controllers/borrowController");
const validateToken = require("../middleware/validateTokenHandler");
const adminOnly = require("../middleware/roleMiddleware");

const router = express.Router();
router.use(validateToken); // auth for all

router.post("/request", requestBorrow);

// only admin can confirm/cancel/return
router.get("/reservations", adminOnly, getAllReservations);
router.put("/:id/confirm", adminOnly, confirmBorrow);
router.put("/:id/cancel", adminOnly, cancelReservation);
router.put("/:id/return", adminOnly, returnBook);

// Student history
router.get("/history", validateToken, getBorrowHistory);

// Admin sees all currently borrowed books
router.get("/borrowed", adminOnly, getAllBorrowedBooks);

// Admin all history
router.get("/admin-history", validateToken, getAllBorrowHistory);

module.exports = router;
