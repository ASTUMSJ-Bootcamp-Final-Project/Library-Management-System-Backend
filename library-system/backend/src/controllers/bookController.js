const Book = require("../models/Book");

// List all books
const listBooks = async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get book by ID
const getBookById = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await Book.findById(id);
    if (!book) return res.status(404).json({ message: "Book not found" });
    res.json(book);
  } catch (error) {
    res.status(400).json({ message: "Invalid Book ID" });
  }
};

// Add a book (Admin only)
const addBook = async (req, res) => {
  try {
    const { title, author, isbn, category, publicationYear, totalCopies } = req.body;

    const existing = await Book.findOne({ isbn });
    if (existing) return res.status(400).json({ message: "Book with this ISBN already exists" });

    const book = new Book({
      title,
      author,
      isbn,
      category,
      publicationYear,
      totalCopies,
      availableCopies: totalCopies,
    });

    await book.save();
    res.status(201).json({ message: "Book added successfully", book });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update book (Admin only)
const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const book = await Book.findByIdAndUpdate(id, updates, { new: true });
    if (!book) return res.status(404).json({ message: "Book not found" });

    res.json({ message: "Book updated", book });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete book (Admin only)
const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await Book.findById(id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    await book.deleteOne();
    res.json({ message: "Book deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { listBooks, getBookById, addBook, updateBook, deleteBook };
