const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  screenshot: {
    url: { type: String, required: true }, // Cloudinary URL
    public_id: { type: String, required: true }, // Cloudinary public_id
  },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending",
  },
  createdAt: { type: Date, default: Date.now },
  approvedAt: { type: Date },
});

module.exports = mongoose.model("Payment", paymentSchema);
