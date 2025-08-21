const express = require("express");
const User = require("../models/User");
const router = express.Router();

// Register new user
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Check required fields (all 3 are mandatory)
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Username, email, and password are required" });
    }

    // Check if username or email already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: "Username or email already exists" });
    }

    // Create new user
    const user = new User({ username, email, password, role });
    await user.save();

    res.status(201).json({ message: "User registered successfully", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login (by username OR email + password)
router.post("/login", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Require at least one of username/email and password
    if ((!username && !email) || !password) {
      return res.status(400).json({ message: "Username or email and password are required" });
    }

    // Find user by username or email
    const user = await User.findOne({
      $or: [{ username: username || null }, { email: email || null }]
    });

    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({ message: "Login successful", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
