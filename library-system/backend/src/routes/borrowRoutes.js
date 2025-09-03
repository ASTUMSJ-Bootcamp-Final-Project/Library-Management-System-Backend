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
  studentCancelReservation,
} = require("../controllers/borrowController");
const validateToken = require("../middleware/validateTokenHandler");
const adminOnly = require("../middleware/roleMiddleware");
const { checkMembership } = require("../middleware/borrowMiddleware");

const router = express.Router();
router.use(validateToken); // auth for all

router.post("/request", checkMembership, requestBorrow);

// only admin can confirm/cancel/return
router.get("/reservations", adminOnly, getAllReservations);
router.put("/:id/confirm", adminOnly, confirmBorrow);
router.put("/:id/cancel", adminOnly, cancelReservation);
router.put("/:id/return", adminOnly, returnBook);

// Student history
router.get("/history", validateToken, getBorrowHistory);
// student can cancel their own reservation
router.put("/:id/student-cancel", validateToken, studentCancelReservation);


// Admin sees all currently borrowed books
router.get("/borrowed", adminOnly, getAllBorrowedBooks);

// Admin all history
router.get("/admin-history", validateToken, getAllBorrowHistory);

module.exports = router;
