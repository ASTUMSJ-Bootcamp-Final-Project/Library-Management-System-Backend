const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  try {
    const { username, password } = req.headers;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password required in headers" });
    }

    const user = await User.findOne({ username });

    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    req.user = user; // attach user to request
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { authMiddleware };
