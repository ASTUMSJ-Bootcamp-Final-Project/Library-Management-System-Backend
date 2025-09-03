const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { authMiddleware } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const router = express.Router();
const emailService = require("../services/emailService");

// Register new user (only regular users, admins must be created by super admin)
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Username, email, and password are required" });
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: "Username or email already exists" });
    }

    // Only allow user role registration through this endpoint
    const user = new User({ username, email, password, role: "user" });
    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create Super Admin (only one allowed)
router.post("/super-admin", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Username, email, and password are required" });
    }

    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ role: "super_admin" });
    if (existingSuperAdmin) {
      return res.status(400).json({ message: "Super Admin already exists. Only one Super Admin is allowed." });
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: "Username or email already exists" });
    }

    const superAdmin = new User({ username, email, password, role: "super_admin" });
    await superAdmin.save();

    res.status(201).json({ 
      message: "Super Admin created successfully",
      user: {
        id: superAdmin._id,
        username: superAdmin.username,
        email: superAdmin.email,
        role: superAdmin.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if ((!username && !email) || !password) {
      return res.status(400).json({ message: "Username or email and password are required" });
    }

    // Select password explicitly since model sets select: false
    const user = await User.findOne({
      $or: [{ username: username || null }, { email: email || null }]
    }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ 
      message: "Login successful", 
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current user's profile (All authenticated users)
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      membershipStatus: user.membershipStatus || null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== ROLE-BASED ROUTES ====================

// Delete own account (All users)
router.delete("/profile", authMiddleware, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== SUPER ADMIN ROUTES ====================

// Create admin (Super Admin only)
router.post("/admin", authMiddleware, authorizeRoles("super_admin"), async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Username, email, and password are required" });
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: "Username or email already exists" });
    }

    const admin = new User({ username, email, password, role: "admin" });
    await admin.save();

    res.status(201).json({ message: "Admin created successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Promote user to admin (Super Admin only)
router.put("/promote/:userId", authMiddleware, authorizeRoles("super_admin"), async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(400).json({ message: "User is already an admin" });
    }

    if (user.role === "super_admin") {
      return res.status(400).json({ message: "Cannot promote super admin" });
    }

    user.role = "admin";
    await user.save();

    // Send email notification (best-effort)
    try {
      await emailService.sendEmail(
        user.email,
        "Role Updated: You have been promoted to Admin",
        `<p>Hello ${user.username},</p><p>Your account role has been updated to <strong>Admin</strong>.</p>`
      );
    } catch (e) {
      console.warn("Failed to send promotion email:", e?.message || e);
    }

    res.json({ 
      message: "User promoted to admin successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove admin (Super Admin only)
router.put("/demote/:userId", authMiddleware, authorizeRoles("super_admin"), async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "admin") {
      return res.status(400).json({ message: "Can only demote admin users" });
    }

    user.role = "user";
    await user.save();

    // Send email notification (best-effort)
    try {
      await emailService.sendEmail(
        user.email,
        "Role Updated: You have been demoted to User",
        `<p>Hello ${user.username},</p><p>Your account role has been changed to <strong>User</strong>.</p>`
      );
    } catch (e) {
      console.warn("Failed to send demotion email:", e?.message || e);
    }

    res.json({
      message: "Admin demoted to user successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete any user (Super Admin only)
router.delete("/:userId", authMiddleware, authorizeRoles("super_admin"), async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await User.findByIdAndDelete(userId);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all users (Super Admin only)
router.get("/all", authMiddleware, authorizeRoles("super_admin"), async (req, res) => {
  try {
    const users = await User.find({}).select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user membership status (Admin and Super Admin)
router.put("/membership/:userId", authMiddleware, authorizeRoles("admin", "super_admin"), async (req, res) => {
  try {
    const { userId } = req.params;
    const { membershipStatus } = req.body;

    if (!membershipStatus) {
      return res.status(400).json({ message: "membershipStatus is required" });
    }

    if (!["pending", "approved", "suspended"].includes(membershipStatus)) {
      return res.status(400).json({ message: "Invalid membership status" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.membershipStatus = membershipStatus;
    await user.save();

    res.json({
      message: "Membership status updated successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        membershipStatus: user.membershipStatus
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== ADMIN ROUTES ====================

// Delete regular user (Admin only)
router.delete("/user/:userId", authMiddleware, authorizeRoles("admin"), async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "user") {
      return res.status(403).json({ message: "Can only delete regular users" });
    }

    await User.findByIdAndDelete(userId);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all users (Admin can view but not modify other admins)
router.get("/users", authMiddleware, authorizeRoles("admin"), async (req, res) => {
  try {
    const users = await User.find({ role: { $in: ["user", "admin"] } }).select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
