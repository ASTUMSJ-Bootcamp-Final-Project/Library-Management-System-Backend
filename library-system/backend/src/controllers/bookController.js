// controllers/bookController.js
const asyncHandler = require("express-async-handler");
const bookService = require("../services/bookService");

//@desc Get all books
//@route GET /api/books
//@access private (both users and admins can access)
const getBooks = asyncHandler(async (req, res) => {
  const books = await bookService.getBooks();
  res.status(200).json(books);
});

//@desc Get single book
//@route GET /api/books/:id
//@access private
const getBook = asyncHandler(async (req, res) => {
  const book = await bookService.getBook(req.params.id);
  res.status(200).json(book);
});

//@desc Create new book
//@route POST /api/books
//@access private
const createBook = asyncHandler(async (req, res) => {
  const book = await bookService.createBook(
    req.body,
    req.user.id,
    req.user.isAdmin
  );
  res.status(201).json(book);
});

//@desc Update book
//@route PUT /api/books/:id
//@access private
const updateBook = asyncHandler(async (req, res) => {
  const updatedBook = await bookService.updateBook(
    req.params.id,
    req.body,
    req.user.isAdmin
  );
  res.status(200).json(updatedBook);
});

//@desc Delete book
//@route DELETE /api/books/:id
//@access private
const deleteBook = asyncHandler(async (req, res) => {
  const result = await bookService.deleteBook(req.params.id, req.user.isAdmin);
  res.status(200).json(result);
});

module.exports = {
  getBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
};
