const Borrow = require("../models/Borrow");
const Book = require("../models/Book");
const { addDays, updateOverdueBooks } = require("../utils/dateUtils");

// Check if user has overdue books
const hasOverdueBooks = async (userId) => {
  const overdueBooks = await Borrow.find({
    user: userId,
    status: { $in: ["borrowed", "overdue"] },
    dueDate: { $lt: new Date() }
  });
  return overdueBooks.length > 0;
};

// Check if user has reached the maximum borrowing limit
const hasReachedBorrowingLimit = async (userId) => {
  const activeBorrows = await Borrow.find({
    user: userId,
    status: { $in: ["borrowed", "overdue"] }
  });
  return activeBorrows.length >= 3;
};

// Students can borrow a book (if copies are available)
// - Reduces availableCopies after borrowing
// - Creates a borrow record with borrowDate and dueDate
// - Enforces borrowing rules: max 3 books, no overdue books
const borrowBook = async (req, res) => {
  try {
    const { bookId, days = 14 } = req.body;

    if (!bookId) {
      return res.status(400).json({ message: "bookId is required" });
    }

    // Update overdue books status first
    await updateOverdueBooks(Borrow);

    // Check borrowing rules
    const hasOverdue = await hasOverdueBooks(req.user._id);
    if (hasOverdue) {
      return res.status(400).json({ 
        message: "Cannot borrow books. You have overdue books that need to be returned first." 
      });
    }

    const hasReachedLimit = await hasReachedBorrowingLimit(req.user._id);
    if (hasReachedLimit) {
      return res.status(400).json({ 
        message: "Cannot borrow more books. You have reached the maximum limit of 3 books." 
      });
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

// Students can return a borrowed book
// - Increases availableCopies after returning
// - Updates borrow record with returnDate and status
const returnBook = async (req, res) => {
  try {
    const { borrowId } = req.body;

    if (!borrowId) {
      return res.status(400).json({ message: "borrowId is required" });
    }

    const borrow = await Borrow.findById(borrowId);
    if (!borrow) {
      return res.status(404).json({ message: "Borrow record not found" });
    }

    // Check if the user owns this borrow record (unless admin/super_admin)
    if (req.user.role === "user" && borrow.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only return your own borrowed books" });
    }

    // Check if the book is already returned
    if (borrow.status === "returned") {
      return res.status(400).json({ message: "This book has already been returned" });
    }

    // Update borrow record
    borrow.returnDate = new Date();
    borrow.status = "returned";
    await borrow.save();

    // Increase available copies
    const book = await Book.findById(borrow.book);
    if (book) {
      book.availableCopies += 1;
      await book.save();
    }

    res.json({
      message: "Book returned successfully",
      borrow,
      book: book ? { id: book._id, availableCopies: book.availableCopies } : null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// List borrows; users see their own, admins see all
const listBorrows = async (req, res) => {
  try {
    // Update overdue books status first
    await updateOverdueBooks(Borrow);
    
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

// Get user's borrowing status
const getUserBorrowingStatus = async (req, res) => {
  try {
    // Update overdue books status first
    await updateOverdueBooks(Borrow);
    
    const userId = req.user._id;
    
    // Get all active borrows (borrowed or overdue)
    const activeBorrows = await Borrow.find({
      user: userId,
      status: { $in: ["borrowed", "overdue"] }
    }).populate({ path: "book", select: "title author isbn" });
    
    // Get overdue books
    const overdueBooks = activeBorrows.filter(borrow => 
      borrow.dueDate < new Date()
    );
    
    // Get borrowed books (not overdue)
    const borrowedBooks = activeBorrows.filter(borrow => 
      borrow.dueDate >= new Date()
    );
    
    const status = {
      totalBorrowed: activeBorrows.length,
      borrowedBooks: borrowedBooks.length,
      overdueBooks: overdueBooks.length,
      canBorrowMore: activeBorrows.length < 3,
      hasOverdueBooks: overdueBooks.length > 0,
      maxBooksAllowed: 3,
      booksRemaining: Math.max(0, 3 - activeBorrows.length),
      activeBorrows: activeBorrows,
      overdueBooks: overdueBooks,
      borrowedBooks: borrowedBooks
    };
    
    res.json(status);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { borrowBook, returnBook, listBorrows, getUserBorrowingStatus };


