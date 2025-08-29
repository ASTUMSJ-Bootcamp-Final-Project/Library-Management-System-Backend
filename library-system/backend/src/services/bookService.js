const Book = require("../models/bookModel");
const cloudinary = require("../utils/cloudinary");

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
const createBook = async (bookData, userId, role, file) => {
  const { title, author, genre, publicationYear, ISBN, description } = bookData;

  if (!title || !author || !genre || !publicationYear || !ISBN) {
    throw new Error("All fields except description are mandatory!");
  }

  // Only admin can create
  if (role !== "admin") {
    throw new Error("Only admin users can add books");
  }

  // Prevent duplicate ISBN
  const existingBook = await Book.findOne({ ISBN });
  if (existingBook) {
    throw new Error("Book with this ISBN already exists");
  }

  let imageUpload;

  if (file) {
    imageUpload = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "libraryManagement" },
        (err, result) => {
          if (err) reject(new Error("Cloudinary upload failed"));
          else resolve(result);
        }
      );
      stream.end(file.buffer);
    });
  }

  const book = await Book.create({
    title,
    author,
    genre,
    publicationYear,
    ISBN,
    description,
    image: imageUpload
      ? { url: imageUpload.secure_url, public_id: imageUpload.public_id }
      : null,
    addedBy: userId,
  });

  return book;
};

//@desc Update book
const updateBook = async (bookId, updateData, role, file) => {
  const book = await Book.findById(bookId);
  if (!book) {
    throw new Error("Book not found");
  }

  if (role !== "admin") {
    throw new Error("Only admin users can update books");
  }

  let updatedData = { ...updateData };

  // If new image provided, upload to cloudinary
  if (file) {
    const uploadRes = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "libraryManagement" },
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
      stream.end(file.buffer);
    });
    updatedData.image = {
      url: uploadRes.secure_url,
      public_id: uploadRes.public_id,
    };
  }

  const updatedBook = await Book.findByIdAndUpdate(bookId, updatedData, {
    new: true,
  });

  return updatedBook;
};

//@desc Delete book
const deleteBook = async (bookId, role) => {
  const book = await Book.findById(bookId);

  if (!book) {
    throw new Error("Book not found");
  }

  // Only allow admins to delete books
  if (role !== "admin") {
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
