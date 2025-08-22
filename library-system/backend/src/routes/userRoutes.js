const express = require("express");
const {
  registerUser,
  loginUser,
  currentUser,
  getAllUsers,
  getUserById,
  deleteUser,
} = require("../controllers/userController");
const validateToken = require("../middleware/validateTokenHandler");
const router = express.Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected routes
router.get("/current", validateToken, currentUser);

// Admin-only routes
router.get("/", validateToken, getAllUsers); 
router.get("/:id", validateToken, getUserById);       
router.delete("/:id", validateToken, deleteUser);     

module.exports = router;
