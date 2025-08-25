const Borrow = require("../models/Borrow");
const Book = require("../models/Book");
const { addDays } = require("../utils/dateUtils");

// Students can borrow a book (if copies are available)
// - Reduces availableCopies after borrowing
// - Creates a borrow record with borrowDate and dueDate
const borrowBook = async (req, res) => {
  try {
    const { bookId, days = 14 } = req.body;

    if (!bookId) {
      return res.status(400).json({ message: "bookId is required" });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (book.availableCopies <= 0) {
      return res.status(400).json({ message: "No copies available for borrowing" });
    }

    // Reduce available copies
    book.availableCopies -= 1;
    await book.save();

    const now = new Date();
    const dueDate = addDays(now, Number(days));

    const borrow = new Borrow({
      user: req.user._id,
      book: book._id,
      borrowDate: now,
      dueDate,
      status: "borrowed",
    });

    await borrow.save();

    res.status(201).json({
      message: "Book borrowed successfully",
      borrow,
      book: { id: book._id, availableCopies: book.availableCopies },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { borrowBook };
// List borrows; users see their own, admins see all
const listBorrows = async (req, res) => {
  try {
    const isAdmin = req.user.role === "admin" || req.user.role === "super_admin";
    const filter = isAdmin ? {} : { user: req.user._id };
    const borrows = await Borrow.find(filter)
      .populate({ path: "book", select: "title author isbn" })
      .populate({ path: "user", select: "username email role" })
      .sort({ createdAt: -1 });
    res.json(borrows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { borrowBook, listBorrows };


