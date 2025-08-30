const mongoose = require("mongoose");

const borrowSchema = mongoose.Schema(
  {
    book: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["reserved", "borrowed", "returned", "cancelled"],
      default: "reserved",
    },
    borrowDate: { type: Date },
    dueDate: { type: Date },
    returnDate: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Borrow", borrowSchema);
