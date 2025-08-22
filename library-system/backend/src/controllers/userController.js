const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

//@desc Register a user
//@route POST /api/users/register
//@access public
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, secretCode } = req.body;

  if (!username || !email || !password) {
    res.status(400);
    throw new Error("All fields are mandatory!");
  }

  const userAvailable = await User.findOne({ email });
  if (userAvailable) {
    res.status(400);
    throw new Error("User already registered!");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Check if user should be admin
  const isAdmin = secretCode === process.env.ADMIN_SECRET_CODE;

  const user = await User.create({
    username,
    email,
    password: hashedPassword,
    isAdmin,
  });

  if (user) {
    res.status(201).json({
      _id: user.id,
      email: user.email,
      username: user.username,
      isAdmin: user.isAdmin,
    });
  } else {
    res.status(400);
    throw new Error("User data is not valid");
  }
});

//@desc Login user
//@route POST /api/users/login
//@access public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("All fields are mandatory");
  }

  const user = await User.findOne({ email });

  if (user && (await bcrypt.compare(password, user.password))) {
    const accessToken = jwt.sign(
      {
        user: {
          username: user.username,
          email: user.email,
          id: user.id,
          isAdmin: user.isAdmin,
        },
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "15m" }
    );

    res.status(200).json({
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    });
  } else {
    res.status(401);
    throw new Error("Email or password is not valid");
  }
});

//@desc Current user info
//@route GET /api/users/current
//@access private
const currentUser = asyncHandler(async (req, res) => {
  res.json({
    id: req.user.id,
    username: req.user.username,
    email: req.user.email,
    isAdmin: req.user.isAdmin,
  });

  });

  //@desc Get all users (Admin only)
  //@route GET /api/users
  //@access private (admin only)
  const getAllUsers = asyncHandler(async (req, res) => {
    // Check if user is admin
    if (!req.user.isAdmin) {
      res.status(403);
      throw new Error("Only admin users can access all users");
    }

    // Get all users from database, exclude passwords
    const users = await User.find().select("-password");

    res.status(200).json(users);
  });

  //@desc Get user by ID (Admin only)
  //@route GET /api/users/:id
  //@access private (admin only)
  const getUserById = asyncHandler(async (req, res) => {
    // Check if user is admin
    if (!req.user.isAdmin) {
      res.status(403);
      throw new Error("Only admin users can access user details");
    }

    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    res.status(200).json(user);
  });

  //@desc Delete user (Admin only)
  //@route DELETE /api/users/:id
  //@access private (admin only)
  const deleteUser = asyncHandler(async (req, res) => {
    // Check if user is admin
    if (!req.user.isAdmin) {
      res.status(403);
      throw new Error("Only admin users can delete users");
    }

    // Prevent admin from deleting themselves
    if (req.params.id === req.user.id) {
      res.status(400);
      throw new Error("Admins cannot delete their own account");
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "User deleted successfully",
      id: req.params.id,
      username: user.username,
    });
  });




module.exports = {
  registerUser,
  loginUser,
  currentUser,
  getAllUsers, 
  getUserById,    
  deleteUser,
};
