const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    plan: { type: String, enum: ["3 Months", "6 Months", "1 Year"], required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "waiting_for_approval", "approved", "rejected"],
      default: "waiting_for_approval",
    },
    proof: {
      url: { type: String },
      publicId: { type: String },
      thumbnailUrl: { type: String },
    },
    submittedAt: { type: Date, default: Date.now },
    approvedAt: { type: Date },
    rejectedAt: { type: Date },
    rejectedReason: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);


