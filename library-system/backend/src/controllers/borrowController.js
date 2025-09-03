const asyncHandler = require("express-async-handler");
const borrowService = require("../services/borrowService");

//@desc Request a book borrow (student reserves)
//@route POST /api/borrows/request
//@access Private (student)
const requestBorrow = asyncHandler(async (req, res) => {
  if (req.user.role !== "user") {
    res.status(403);
    throw new Error("Students only");
  }
  const borrow = await borrowService.requestBorrow(
    req.body.bookId,
    req.user.id
  );
  res.status(201).json(borrow);
});

//@desc Confirm borrow when student collects
//@route PUT /api/borrows/:id/confirm
//@access Private (admin)
const confirmBorrow = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") {
    res.status(403);
    throw new Error("Admin access only");
  }
  const borrow = await borrowService.confirmBorrow(req.params.id);
  res.status(200).json(borrow);
});

//@desc Cancel reservation (if not collected)
//@route PUT /api/borrows/:id/cancel
//@access Private (admin)
const cancelReservation = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") {
    res.status(403);
    throw new Error("Admin access only");
  }
  const borrow = await borrowService.cancelReservation(req.params.id);
  res.status(200).json(borrow);
});

//@desc Return book
//@route PUT /api/borrows/:id/return
//@access Private (admin)
const returnBook = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") {
    res.status(403);
    throw new Error("Admin access only");
  }
  const result = await borrowService.returnBook(req.params.id);
  res.status(200).json(result);
});

//@desc Get student's borrow history
//@route GET /api/borrows/history
//@access Private (student)
const getBorrowHistory = asyncHandler(async (req, res) => {
  if (req.user.role !== "user") {
    res.status(403);
    throw new Error("Students only");
  }
  const history = await borrowService.getBorrowHistory(req.user.id);
  res.status(200).json(history);
});

//@desc Get all borrow history
//@route GET /api/borrows/admin-history
//@access Private (admin)
const getAllBorrowHistory = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") {
    res.status(403);
    throw new Error("Admin access only");
  }
  const history = await borrowService.getAllBorrowHistory();
  res.status(200).json(history);
});

//@desc Admin sees all currently borrowed books
//@route GET /api/borrows//borrowed
//@access Private (admin)
const getAllBorrowedBooks = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") {
    res.status(403);
    throw new Error("Admin access only");
  }
  const borrowedBooks = await borrowService.getAllBorrowed();
  res.status(200).json(borrowedBooks);
});

//@desc Get all reservations (admin)
//@route GET /api/borrows/reservations
//@access Private (admin)
const getAllReservations = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") {
    res.status(403);
    throw new Error("Admin access only");
  }
  const reservations = await borrowService.getAllReservations();
  res.status(200).json(reservations);
});


// @desc Student cancels own reservation
// @route PUT /api/borrows/:id/student-cancel
// @access Private (student)
const studentCancelReservation = asyncHandler(async (req, res) => {
  if (req.user.role !== "user") {
    res.status(403);
    throw new Error("Students only");
  }

  const borrow = await borrowService.studentCancelReservation(req.params.id, req.user.id);
  res.status(200).json(borrow);
});


module.exports = {
  requestBorrow,
  confirmBorrow,
  cancelReservation,
  returnBook,
  getBorrowHistory,
  getAllBorrowHistory,
  getAllBorrowedBooks,
  getAllReservations,
  studentCancelReservation,
};
