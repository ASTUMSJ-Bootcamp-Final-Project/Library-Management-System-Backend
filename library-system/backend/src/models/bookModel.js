const mongoose = require("mongoose");

const bookSchema = mongoose.Schema(
  {
    title: { type: String, required: [true, "Please add the book title"] },
    author: { type: String, required: [true, "Please add the author name"] },
    genre: { type: String, required: [true, "Please add the book genre"] },
    publicationYear: {
      type: Number,
      required: [true, "Please add the publication year"],
    },
    ISBN: {
      type: String,
      required: [true, "Please add the ISBN"],
      unique: true,
    },
    description: { type: String },
    image: {
      url: { type: String }, // Cloudinary URL
      public_id: { type: String }, // for replacing/deleting later
    },
    totalCopies: { type: Number, required: true, min: 1, default: 1 },
    availableCopies: { type: Number, required: true, default: 1 },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
  { timestamps: true }
);

// initialize availableCopies if not set
bookSchema.pre("save", function (next) {
  if (
    this.isNew &&
    (this.availableCopies === undefined || this.availableCopies === null)
  ) {
    this.availableCopies = this.totalCopies;
  }
  next();
});

module.exports = mongoose.model("Book", bookSchema);
