const mongoose = require("mongoose");

const borrowSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    book: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
    borrowDate: { type: Date },
    dueDate: { type: Date },
    returnDate: { type: Date },
    reservationExpiry: { type: Date },
    status: {
      type: String,
      enum: ["reserved", "borrowed", "returned", "overdue", "expired"],
      default: "reserved",
    },
    collectedByAdmin: { type: Boolean, default: false },
    collectedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Borrow", borrowSchema);


