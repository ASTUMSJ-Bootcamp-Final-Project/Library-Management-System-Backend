const asyncHandler = require("express-async-handler");
const Book = require("../models/bookModel");

//@desc Get all books
//@route GET /api/books
//@access private (both users and admins can access)
const getBooks = asyncHandler(async (req, res) => {
  const books = await Book.find({});
  res.status(200).json(books);
});

//@desc Get single book
//@route GET /api/books/:id
//@access private
const getBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);

  if (!book) {
    res.status(404);
    throw new Error("Book not found");
  }

  // if (book.user_id.toString() !== req.user.id) {
  //   res.status(403);
  //   throw new Error("User don't have permission to view other user books");
  // }

  res.status(200).json(book);
});

//@desc Create new book
//@route POST /api/books
//@access private
const createBook = asyncHandler(async (req, res) => {
  const { title, author, genre, publicationYear, ISBN, description } = req.body;

  if (!title || !author || !genre || !publicationYear || !ISBN) {
    res.status(400);
    throw new Error("All fields except description are mandatory!");
  }

  // Check if user is admin
  if (!req.user.isAdmin) {
    res.status(403);
    throw new Error("Only admin users can add books");
  }

  // Check if book with same ISBN already exists
  const existingBook = await Book.findOne({ ISBN });
  if (existingBook) {
    res.status(400);
    throw new Error("Book with this ISBN already exists");
  }

  const book = await Book.create({
    title,
    author,
    genre,
    publicationYear,
    ISBN,
    description,
    addedBy: req.user.id,
  });

  res.status(201).json(book);
});

//@desc Update book
//@route PUT /api/books/:id
//@access private
const updateBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);

  if (!book) {
    res.status(404);
    throw new Error("Book not found");
  }

  // if (book.user_id.toString() !== req.user.id) {
  //   res.status(403);
  //   throw new Error("User don't have permission to update other user books");
  // }

  // Only allow admins to update books (since regular users shouldn't modify books)
  if (!req.user.isAdmin) {
    res.status(403);
    throw new Error("Only admin users can update books");
  }

  const updatedBook = await Book.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });

  res.status(200).json(updatedBook);
});

//@desc Delete book
//@route DELETE /api/books/:id
//@access private
const deleteBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);

  if (!book) {
    res.status(404);
    throw new Error("Book not found");
  }

  // if (book.user_id.toString() !== req.user.id) {
  //   res.status(403);
  //   throw new Error("User don't have permission to delete other user books");
  // }

  // Only allow admins to delete books
  if (!req.user.isAdmin) {
    res.status(403);
    throw new Error("Only admin users can delete books");
  }

  await Book.findByIdAndDelete(req.params.id);

  res
    .status(200)
    .json({ message: "Book deleted successfully", id: req.params.id });
});

module.exports = {
  getBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
};
