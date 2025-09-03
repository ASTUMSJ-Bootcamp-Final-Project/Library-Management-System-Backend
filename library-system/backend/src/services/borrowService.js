const Borrow = require("../models/borrowModel");
const Book = require("../models/bookModel");
const User = require("../models/userModel");
const sendEmail = require("../utils/sendEmail");

//@desc Student requests to borrow (reserve)
const requestBorrow = async (bookId, userId) => {
  const user = await User.findById(userId);
  const book = await Book.findById(bookId);
  if (!user) throw new Error("User not found");
  if (!book) throw new Error("Book not found");

  // rules
  const activeBorrows = await Borrow.find({ user: userId, status: "borrowed" });
  if (activeBorrows.length >= 3) throw new Error("Borrow limit exceeded");

  const overdue = await Borrow.findOne({
    user: userId,
    status: "borrowed",
    dueDate: { $lt: new Date() },
  });
  if (overdue) throw new Error("You have overdue books");

  if (!book.availableCopies || book.availableCopies < 1) {
    throw new Error("No copies available");
  }

  // reserve (lock a copy)
  book.availableCopies -= 1;
  await book.save();

  const borrow = await Borrow.create({
    book: bookId,
    user: userId,
    status: "reserved",
  });

  await sendEmail(
    user.email,
    "Book Reserved",
    `Your reservation for "${book.title}" is confirmed. Please collect within 24 hours.`
  );

  return borrow;
};

//@desc Confirm borrow when student collects (admin)
const confirmBorrow = async (borrowId) => {
  const borrow = await Borrow.findById(borrowId).populate("book user");
  if (!borrow) throw new Error("Reservation not found");
  if (borrow.status !== "reserved")
    throw new Error("Only reserved items can be confirmed");

  borrow.status = "borrowed";
  borrow.borrowDate = new Date();
  borrow.dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days
  await borrow.save();

  await sendEmail(
    borrow.user.email,
    "Borrow Confirmed",
    `You borrowed "${
      borrow.book.title
    }". Due date: ${borrow.dueDate.toDateString()}`
  );

  return borrow;
};

//@desc Cancel reservation (increase availableCopies back)
const cancelReservation = async (borrowId) => {
  const borrow = await Borrow.findById(borrowId).populate("book user");
  if (!borrow) throw new Error("Reservation not found");
  if (borrow.status !== "reserved")
    throw new Error("Only reserved items can be cancelled");

  borrow.status = "cancelled";
  await borrow.save();

  borrow.book.availableCopies += 1;
  await borrow.book.save();

  await sendEmail(
    borrow.user.email,
    "Reservation Cancelled",
    `Your reservation for "${borrow.book.title}" has been cancelled.`
  );

  return borrow;
};

//@desc Return a borrowed book
const returnBook = async (borrowId) => {
  const borrow = await Borrow.findById(borrowId).populate("book user");
  if (!borrow) throw new Error("Borrow record not found");
  if (borrow.status !== "borrowed")
    throw new Error("Only borrowed items can be returned");

  borrow.status = "returned";
  borrow.returnDate = new Date();
  await borrow.save();

  borrow.book.availableCopies += 1;
  await borrow.book.save();

  await sendEmail(
    borrow.user.email,
    "Book Returned",
    `You have returned "${borrow.book.title}". Thank you!`
  );

  const overdue = borrow.dueDate && borrow.returnDate > borrow.dueDate;
  return { borrow, overdue: Boolean(overdue) };
};

//@desc Get borrow history for a student
const getBorrowHistory = async (userId) => {
  return await Borrow.find({ user: userId })
    .populate("book", "title author")
    .sort({ createdAt: -1 });
};

//@desc Get all borrow history (admin)
const getAllBorrowHistory = async () => {
  return await Borrow.find({})
    .populate("book", "title author")
    .populate("user", "username email")
    .sort({ createdAt: -1 });
};

//@desc Admin sees all current borrowed books
const getAllBorrowed = async () => {
  return await Borrow.find({ status: "borrowed" })
    .populate("book", "title author ISBN")
    .populate("user", "username email studentId department")
    .sort({ borrowDate: -1 });
};

//@desc Admin Gets Reservations
const getAllReservations = async () => {
  return await Borrow.find({ status: "reserved" })
    .populate("book", "title author")
    .populate("user", "username email")
    .sort({ createdAt: -1 });
};

// @desc Student cancels own reservation
const studentCancelReservation = async (borrowId, userId) => {
  const borrow = await Borrow.findById(borrowId).populate("book user");
  if (!borrow) throw new Error("Reservation not found");

  // make sure it belongs to the student
  if (borrow.user._id.toString() !== userId.toString()) {
    throw new Error("You can only cancel your own reservations");
  }

  // only allow cancel if still reserved
  if (borrow.status !== "reserved") {
    throw new Error("You cannot cancel after the book is borrowed or returned");
  }

  borrow.status = "cancelled";
  await borrow.save();

  // give copy back
  borrow.book.availableCopies += 1;
  await borrow.book.save();

  await sendEmail(
    borrow.user.email,
    "Reservation Cancelled",
    `Your reservation for "${borrow.book.title}" has been cancelled.`
  );

  return borrow;
};

module.exports = {
  requestBorrow,
  confirmBorrow,
  cancelReservation,
  returnBook,
  getBorrowHistory,
  getAllBorrowHistory,
  getAllReservations,
  studentCancelReservation,
};
