const Borrow = require("../models/Borrow");
const Book = require("../models/Book");
const User = require("../models/User");
const { addDays, updateOverdueBooks } = require("../utils/dateUtils");
const emailService = require("../services/emailService");

// Check if user has overdue books
const hasOverdueBooks = async (userId) => {
  const overdueBooks = await Borrow.find({
    user: userId,
    status: { $in: ["borrowed", "overdue"] },
    dueDate: { $lt: new Date() }
  });
  return overdueBooks.length > 0;
};

// Check if user has reached the maximum borrowing limit (including reservations)
const hasReachedBorrowingLimit = async (userId) => {
  const activeBorrows = await Borrow.find({
    user: userId,
    status: { $in: ["borrowed", "overdue"] }
  });
  
  const activeReservations = await Borrow.find({
    user: userId,
    status: "reserved",
    reservationExpiry: { $gt: new Date() }
  });
  
  return (activeBorrows.length + activeReservations.length) >= 3;
};

// Check if user has active reservations
const hasActiveReservations = async (userId) => {
  const activeReservations = await Borrow.find({
    user: userId,
    status: "reserved",
    reservationExpiry: { $gt: new Date() }
  });
  return activeReservations.length;
};

// Check if user's membership is approved
const isMembershipApproved = async (userId) => {
  const user = await User.findById(userId);
  return user && user.membershipStatus === "approved";
};

// Student requests to borrow a book (creates reservation)
const requestBorrow = async (req, res) => {
  try {
    const { bookId } = req.body;

    if (!bookId) {
      return res.status(400).json({ message: "bookId is required" });
    }

    // Update overdue books status first
    await updateOverdueBooks(Borrow);

    // Check membership status
    const membershipApproved = await isMembershipApproved(req.user._id);
    if (!membershipApproved) {
      return res.status(400).json({ 
        message: "Your membership is pending approval. Please complete your subscription payment to activate your library membership and start borrowing books." 
      });
    }

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
        message: "Cannot reserve more books. You have reached the maximum limit of 3 books (including borrowed and reserved books)." 
      });
    }

    // Check if user already has an active reservation for this book
    const existingReservation = await Borrow.findOne({
      user: req.user._id,
      book: bookId,
      status: "reserved",
      reservationExpiry: { $gt: new Date() }
    });

    if (existingReservation) {
      return res.status(400).json({ 
        message: "You already have an active reservation for this book." 
      });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (book.availableCopies <= 0) {
      return res.status(400).json({ message: "No copies available for borrowing" });
    }

    // Create reservation (temporarily reduce available copies)
    book.availableCopies -= 1;
    await book.save();

    const now = new Date();
    const reservationExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

    const borrow = new Borrow({
      user: req.user._id,
      book: book._id,
      status: "reserved",
      reservationExpiry,
    });

    await borrow.save();

    // Send reservation confirmation email
    try {
      const user = await User.findById(req.user._id);
      if (user && user.email) {
        await emailService.sendReservationConfirmation(
          user.email,
          user.username,
          book.title,
          reservationExpiry
        );
      }
    } catch (emailError) {
      console.error('Failed to send reservation confirmation email:', emailError);
      // Continue execution even if email fails
    }

    res.status(201).json({
      message: "Book reserved successfully. Please collect within 24 hours.",
      borrow,
      book: { id: book._id, availableCopies: book.availableCopies },
      reservationExpiry
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin confirms book collection and converts reservation to borrow
const confirmCollection = async (req, res) => {
  try {
    const { borrowId, days = 14 } = req.body;

    if (!borrowId) {
      return res.status(400).json({ message: "borrowId is required" });
    }

    // Only admins can confirm collection
    if (req.user.role !== "admin" && req.user.role !== "super_admin") {
      return res.status(403).json({ message: "Only administrators can confirm book collection" });
    }

    const borrow = await Borrow.findById(borrowId);
    if (!borrow) {
      return res.status(404).json({ message: "Borrow record not found" });
    }

    if (borrow.status !== "reserved") {
      return res.status(400).json({ message: "This record is not in reserved status" });
    }

    if (borrow.reservationExpiry < new Date()) {
      return res.status(400).json({ message: "This reservation has expired" });
    }

    // Convert reservation to borrow
    const now = new Date();
    const dueDate = addDays(now, Number(days));

    borrow.status = "borrowed";
    borrow.borrowDate = now;
    borrow.dueDate = dueDate;
    borrow.collectedByAdmin = true;
    borrow.collectedAt = now;
    await borrow.save();

    // Send borrow confirmation email
    try {
      const borrowWithDetails = await Borrow.findById(borrow._id)
        .populate('user', 'username email')
        .populate('book', 'title');
      
      if (borrowWithDetails.user && borrowWithDetails.user.email) {
        await emailService.sendBorrowConfirmation(
          borrowWithDetails.user.email,
          borrowWithDetails.user.username,
          borrowWithDetails.book.title,
          dueDate
        );
      }
    } catch (emailError) {
      console.error('Failed to send borrow confirmation email:', emailError);
      // Continue execution even if email fails
    }

    res.json({
      message: "Book collection confirmed successfully",
      borrow,
      dueDate
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cancel expired reservations and restore available copies
const cancelExpiredReservations = async (req, res) => {
  try {
    const now = new Date();
    
    // Find expired reservations
    const expiredReservations = await Borrow.find({
      status: "reserved",
      reservationExpiry: { $lt: now }
    });

    let cancelledCount = 0;
    
    for (const reservation of expiredReservations) {
      // Restore available copies first
      const book = await Book.findById(reservation.book);
      if (book) {
        book.availableCopies += 1;
        await book.save();
      }
      
      // Send reservation cancelled email
      try {
        const user = await User.findById(reservation.user);
        if (user && user.email && book) {
          await emailService.sendReservationCancellation(
            user.email,
            user.username,
            book.title,
            'Reservation expired'
          );
        }
      } catch (emailError) {
        console.error('Failed to send reservation cancellation email:', emailError);
        // Continue execution even if email fails
      }
      
      cancelledCount++;
    }

    // Delete all expired reservations completely
    const deleteResult = await Borrow.deleteMany({
      status: "reserved",
      reservationExpiry: { $lt: now }
    });

    res.json({
      message: `Cancelled and removed ${cancelledCount} expired reservations`,
      cancelledCount: deleteResult.deletedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Students can request to return a borrowed book
// - Changes status to "return_requested" 
// - Admin must confirm the return
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
      return res.status(403).json({ message: "You can only request to return your own borrowed books" });
    }

    // Check if the book is already returned or return requested
    if (borrow.status === "returned") {
      return res.status(400).json({ message: "This book has already been returned" });
    }

    if (borrow.status === "return_requested") {
      return res.status(400).json({ message: "Return has already been requested for this book" });
    }

    // Only allow requesting return for borrowed or overdue books
    if (borrow.status !== "borrowed" && borrow.status !== "overdue") {
      return res.status(400).json({ message: "This book cannot be returned in its current status" });
    }

    // Update borrow record to return requested
    borrow.status = "return_requested";
    await borrow.save();

    // Send return request notification email to admin
    try {
      const user = await User.findById(borrow.user);
      const book = await Book.findById(borrow.book);
      if (user && user.email && book) {
        await emailService.sendReturnRequestNotification(
          user.email,
          user.username,
          book.title,
          new Date()
        );
      }
    } catch (emailError) {
      console.error('Failed to send return request notification email:', emailError);
      // Continue execution even if email fails
    }

    res.json({
      message: "Return request submitted successfully. Please wait for admin confirmation.",
      borrow
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin confirms book return
// - Changes status to "returned"
// - Increases availableCopies
// - Sets returnDate
const confirmReturn = async (req, res) => {
  try {
    const { borrowId } = req.body;

    if (!borrowId) {
      return res.status(400).json({ message: "borrowId is required" });
    }

    // Only admins can confirm returns
    if (req.user.role !== "admin" && req.user.role !== "super_admin") {
      return res.status(403).json({ message: "Only administrators can confirm book returns" });
    }

    const borrow = await Borrow.findById(borrowId);
    if (!borrow) {
      return res.status(404).json({ message: "Borrow record not found" });
    }

    if (borrow.status !== "return_requested") {
      return res.status(400).json({ message: "This record is not in return_requested status" });
    }

    // Update borrow record to returned
    borrow.status = "returned";
    borrow.returnDate = new Date();
    await borrow.save();

    // Increase available copies
    const book = await Book.findById(borrow.book);
    if (book) {
      book.availableCopies += 1;
      await book.save();
    }

    // Send return confirmation email to user
    try {
      const user = await User.findById(borrow.user);
      if (user && user.email && book) {
        await emailService.sendReturnConfirmation(
          user.email,
          user.username,
          book.title,
          borrow.returnDate
        );
      }
    } catch (emailError) {
      console.error('Failed to send return confirmation email:', emailError);
      // Continue execution even if email fails
    }

    res.json({
      message: "Book return confirmed successfully",
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
      .populate({ path: "book", select: "title author isbn coverImage legacyCoverImage" })
      .populate({ path: "user", select: "username email role name" })
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
    }).populate({ path: "book", select: "title author isbn coverImage legacyCoverImage" });
    
    // Get active reservations
    const activeReservations = await Borrow.find({
      user: userId,
      status: "reserved",
      reservationExpiry: { $gt: new Date() }
    }).populate({ path: "book", select: "title author isbn coverImage legacyCoverImage" });

    // Get return requested books
    const returnRequestedBooks = await Borrow.find({
      user: userId,
      status: "return_requested"
    }).populate({ path: "book", select: "title author isbn coverImage legacyCoverImage" });
    
    // Get overdue books
    const overdueBooks = activeBorrows.filter(borrow => 
      borrow.dueDate < new Date()
    );
    
    // Get borrowed books (not overdue)
    const borrowedBooks = activeBorrows.filter(borrow => 
      borrow.dueDate >= new Date()
    );
    
    const totalActiveBooks = activeBorrows.length + activeReservations.length;
    
    const status = {
      totalBorrowed: activeBorrows.length,
      totalReserved: activeReservations.length,
      totalReturnRequested: returnRequestedBooks.length,
      borrowedBooks: borrowedBooks.length,
      overdueBooks: overdueBooks.length,
      canBorrowMore: totalActiveBooks < 3,
      hasOverdueBooks: overdueBooks.length > 0,
      maxBooksAllowed: 3,
      booksRemaining: Math.max(0, 3 - totalActiveBooks),
      activeBorrows: activeBorrows,
      activeReservations: activeReservations,
      returnRequestedBooks: returnRequestedBooks,
      overdueBooks: overdueBooks,
      borrowedBooks: borrowedBooks
    };
    
    res.json(status);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get pending reservations (for admin view)
const getPendingReservations = async (req, res) => {
  try {
    // Only admins can view pending reservations
    if (req.user.role !== "admin" && req.user.role !== "super_admin") {
      return res.status(403).json({ message: "Only administrators can view pending reservations" });
    }

    const pendingReservations = await Borrow.find({
      status: "reserved",
      reservationExpiry: { $gt: new Date() }
    })
      .populate({ path: "book", select: "title author isbn" })
      .populate({ path: "user", select: "username email role" })
      .sort({ createdAt: -1 });

    res.json(pendingReservations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get borrowing history for a specific book (for admin view)
const getBookBorrowingHistory = async (req, res) => {
  try {
    const { bookId } = req.params;
    const { page = 1, limit = 5 } = req.query;
    
    // Only admins can view book borrowing history
    if (req.user.role !== "admin" && req.user.role !== "super_admin") {
      return res.status(403).json({ message: "Only administrators can view book borrowing history" });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get total count for pagination
    const totalCount = await Borrow.countDocuments({ book: bookId });
    
    // Get borrowing history with pagination
    const borrowHistory = await Borrow.find({ book: bookId })
      .populate({ path: "book", select: "title author isbn coverImage legacyCoverImage" })
      .populate({ path: "user", select: "username email role" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalPages = Math.ceil(totalCount / parseInt(limit));
    
    res.json({
      borrowHistory,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  requestBorrow, 
  confirmCollection, 
  cancelExpiredReservations,
  returnBook, 
  confirmReturn,
  listBorrows, 
  getUserBorrowingStatus,
  getPendingReservations,
  getBookBorrowingHistory
};


