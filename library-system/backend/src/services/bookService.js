// services/bookService.js
const Book = require("../models/bookModel");

//@desc Get all books
const getBooks = async () => {
  return await Book.find({}).populate("addedBy", "username email");
};

//@desc Get single book
const getBook = async (bookId) => {
  const book = await Book.findById(bookId).populate(
    "addedBy",
    "username email"
  );

  if (!book) {
    throw new Error("Book not found");
  }

  return book;
};

//@desc Create new book
const createBook = async (bookData, userId, isAdmin) => {
  const { title, author, genre, publicationYear, ISBN, description } = bookData;

  if (!title || !author || !genre || !publicationYear || !ISBN) {
    throw new Error("All fields except description are mandatory!");
  }

  // Check if user is admin
  if (!isAdmin) {
    throw new Error("Only admin users can add books");
  }

  // Check if book with same ISBN already exists
  const existingBook = await Book.findOne({ ISBN });
  if (existingBook) {
    throw new Error("Book with this ISBN already exists");
  }

  const book = await Book.create({
    title,
    author,
    genre,
    publicationYear,
    ISBN,
    description,
    addedBy: userId,
  });

  return book;
};

//@desc Update book
const updateBook = async (bookId, updateData, isAdmin) => {
  const book = await Book.findById(bookId);

  if (!book) {
    throw new Error("Book not found");
  }

  // Only allow admins to update books
  if (!isAdmin) {
    throw new Error("Only admin users can update books");
  }

  const updatedBook = await Book.findByIdAndUpdate(bookId, updateData, {
    new: true,
  });

  return updatedBook;
};

//@desc Delete book
const deleteBook = async (bookId, isAdmin) => {
  const book = await Book.findById(bookId);

  if (!book) {
    throw new Error("Book not found");
  }

  // Only allow admins to delete books
  if (!isAdmin) {
    throw new Error("Only admin users can delete books");
  }

  await Book.findByIdAndDelete(bookId);

  return {
    message: "Book deleted successfully",
    id: bookId,
  };
};

module.exports = {
  getBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
};
