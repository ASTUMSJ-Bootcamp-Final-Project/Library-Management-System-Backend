// routes/userRoutes.js
const express = require("express");
const {
  registerUser,
  loginUser,
  currentUser,
  getAllUsers,
  getUserById,
  deleteUser,
  updateUserProfile,
  deleteUserSelf,
} = require("../controllers/userController");
const validateToken = require("../middleware/validateTokenHandler");
const router = express.Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected routes (all users)
router.get("/current", validateToken, currentUser);
router.put("/profile", validateToken, updateUserProfile);
router.delete("/profile", validateToken, deleteUserSelf);

// Admin-only routes
router.get("/", validateToken, getAllUsers);
router.get("/:id", validateToken, getUserById);
router.delete("/:id", validateToken, deleteUser);

module.exports = router;
