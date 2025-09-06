const Book = require("../models/Book");
const cloudinaryService = require("../services/cloudinaryService");

// List all books (Public)
const listBooks = async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get book by ID (Public)
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
    const { title, author, isbn, category, publicationYear, totalCopies, description } = req.body;

    const existing = await Book.findOne({ isbn });
    if (existing) return res.status(400).json({ message: "Book with this ISBN already exists" });

    // Prepare book data
    const bookData = {
      title,
      author,
      isbn,
      category,
      publicationYear,
      totalCopies,
      availableCopies: totalCopies,
      description,
    };

    // Handle cover image upload
    if (req.cloudinaryResult) {
      bookData.coverImage = {
        url: req.cloudinaryResult.url,
        publicId: req.cloudinaryResult.publicId,
        thumbnailUrl: req.cloudinaryResult.thumbnailUrl,
        responsiveUrls: req.cloudinaryResult.responsiveUrls,
      };
    } else if (req.file) {
      // Fallback to legacy file handling if Cloudinary is not configured
      bookData.legacyCoverImage = req.file.filename;
    }

    // Check for upload errors
    if (req.uploadError) {
      console.warn('Image upload failed, creating book without cover:', req.uploadError);
    }

    const book = new Book(bookData);
    await book.save();

    res.status(201).json({ 
      message: "Book added successfully", 
      book,
      uploadStatus: req.cloudinaryResult ? 'cloudinary_success' : req.file ? 'legacy_success' : 'no_image'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update book (Admin only)
const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    const existingBook = await Book.findById(id);
    if (!existingBook) return res.status(404).json({ message: "Book not found" });

    // Handle new cover image upload
    if (req.cloudinaryResult) {
      // Delete old image if it exists
      if (existingBook.coverImage && existingBook.coverImage.publicId) {
        try {
          await cloudinaryService.deleteImage(existingBook.coverImage.publicId);
        } catch (deleteError) {
          console.warn('Failed to delete old cover image:', deleteError);
        }
      }

      // Set new cover image
      updates.coverImage = {
        url: req.cloudinaryResult.url,
        publicId: req.cloudinaryResult.publicId,
        thumbnailUrl: req.cloudinaryResult.thumbnailUrl,
        responsiveUrls: req.cloudinaryResult.responsiveUrls,
      };
    } else if (req.file) {
      // Fallback to legacy file handling
      updates.legacyCoverImage = req.file.filename;
    }

    // Check for upload errors
    if (req.uploadError) {
      console.warn('Image upload failed during update:', req.uploadError);
    }

    const book = await Book.findByIdAndUpdate(id, updates, { new: true });

    res.json({ 
      message: "Book updated", 
      book,
      uploadStatus: req.cloudinaryResult ? 'cloudinary_success' : req.file ? 'legacy_success' : 'no_change'
    });
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

    // Delete cover image from Cloudinary if it exists
    if (book.coverImage && book.coverImage.publicId) {
      try {
        await cloudinaryService.deleteImage(book.coverImage.publicId);
      } catch (deleteError) {
        console.warn('Failed to delete cover image from Cloudinary:', deleteError);
      }
    }

    await book.deleteOne();
    res.json({ message: "Book deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { listBooks, getBookById, addBook, updateBook, deleteBook };
