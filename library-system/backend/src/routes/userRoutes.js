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
  promoteDirectly,
  promoteUser,
  demoteUser,
  refreshAccessToken,
  logoutUser,
} = require("../controllers/userController");
const validateToken = require("../middleware/validateTokenHandler");
const router = express.Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh", refreshAccessToken);
router.post("/logout", logoutUser);

// Protected routes (all users)
router.get("/current", validateToken, currentUser);
router.put("/profile", validateToken, updateUserProfile);
router.delete("/profile", validateToken, deleteUserSelf);

// Admin & Super Admin routes
router.get("/", validateToken, getAllUsers);
router.get("/:id", validateToken, getUserById);
router.delete("/:id", validateToken, deleteUser);

// Super Admin routes
router.put("/:id/promote", validateToken, promoteUser);
router.put("/:id/demote", validateToken, demoteUser);

module.exports = router;
