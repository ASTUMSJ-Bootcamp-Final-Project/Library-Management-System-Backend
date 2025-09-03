const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Please add the user name"],
    },
    email: {
      type: String,
      required: [true, "Please add the user email address"],
      unique: [true, "Email address already taken"],
    },
    password: {
      type: String,
      required: [true, "Please add the user password"],
    },
    role: {
      type: String,
      enum: ["user", "admin", "superadmin"],
      default: "user",
    },
    phone: { type: String },
    department: { type: String },
    studentId: { type: String },
    refreshToken: { type: String },
    membershipStatus: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Inactive",
    },
    membershipExpiry: { type: Date },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
