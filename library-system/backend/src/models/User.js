const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { 
    type: String, 
    enum: ["super_admin", "admin", "user"], 
    default: "user" 
  },
  membershipStatus: {
    type: String,
    enum: ["pending", "approved", "suspended"],
    default: "pending"
  },
  // When membership is approved, set an expiry date
  membershipExpiryDate: { type: Date },
}, { timestamps: true });

// Ensure we never expose password in JSON responses
userSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.password;
    return ret;
  }
});

userSchema.set("toObject", {
  transform: function (doc, ret) {
    delete ret.password;
    return ret;
  }
});

// Hash password before saving if modified/new
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (err) {
    next(err);
  }
});

// Hash password on findOneAndUpdate if provided
userSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  if (!update) return next();

  const password = update.password || (update.$set && update.$set.password);
  if (!password) return next();

  try {
    const saltRounds = 10;
    const hashed = await bcrypt.hash(password, saltRounds);
    if (update.password) update.password = hashed;
    if (update.$set && update.$set.password) update.$set.password = hashed;
    next();
  } catch (err) {
    next(err);
  }
});

// Instance method to compare passwords
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
