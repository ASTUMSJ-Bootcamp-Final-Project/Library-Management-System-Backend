const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  isbn: { type: String, required: true, unique: true },
  category: { type: String },
  publicationYear: { type: Number },
  totalCopies: { type: Number, required: true },
  availableCopies: { type: Number, required: true },
  coverImage: { type: String },
});

module.exports = mongoose.model("Book", bookSchema);
