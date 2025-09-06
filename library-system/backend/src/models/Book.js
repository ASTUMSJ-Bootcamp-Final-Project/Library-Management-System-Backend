const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  isbn: { type: String, required: true, unique: true },
  category: { type: String },
  publicationYear: { type: Number },
  totalCopies: { type: Number, required: true },
  availableCopies: { type: Number, required: true },
  description: { type: String },
  
  // Cover image fields for Cloudinary integration
  coverImage: {
    url: { type: String }, // Cloudinary secure URL
    publicId: { type: String }, // Cloudinary public ID for management
    thumbnailUrl: { type: String }, // Thumbnail version URL
    responsiveUrls: {
      thumbnail: { type: String },
      small: { type: String },
      medium: { type: String },
      large: { type: String },
    }
  },
  
  // Legacy field for backward compatibility
  legacyCoverImage: { type: String },
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.model("Book", bookSchema);
