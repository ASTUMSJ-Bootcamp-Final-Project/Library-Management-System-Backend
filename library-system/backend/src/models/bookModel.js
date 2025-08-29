const mongoose = require("mongoose");

const bookSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please add the book title"],
    },
    author: {
      type: String,
      required: [true, "Please add the author name"],
    },
    genre: {
      type: String,
      required: [true, "Please add the book genre"],
    },
    publicationYear: {
      type: Number,
      required: [true, "Please add the publication year"],
    },
    ISBN: {
      type: String,
      required: [true, "Please add the ISBN"],
      unique: true,
    },
    description: {
      type: String,
      required: false,
    },
    image: {
      url: { type: String }, // Cloudinary URL
      public_id: { type: String }, // for replacing/deleting later
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Book", bookSchema);
