const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { ENV } = require("../config/env"); // your JWT_SECRET

const authMiddleware = async (req, res, next) => {
  try {
    // 1. Get token from headers
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization token required" });
    }

    const token = authHeader.split(" ")[1];

    // 2. Verify JWT
    const decoded = jwt.verify(token, ENV.JWT_SECRET);

    // 3. Find the user from decoded payload
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // 4. Attach user to request
    req.user = user; // any logged-in user (user or admin)
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = { authMiddleware };
