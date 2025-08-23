const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const userService = require("../services/userService");
const { accessTokenSecret, jwtExpiresIn } = require("../config/env");

//@desc Register a user
//@route POST /api/users/register
//@access public
const registerUser = asyncHandler(async (req, res) => {
  const user = await userService.registerUser(req.body);
  res.status(201).json(user);
});

//@desc Login user
//@route POST /api/users/login
//@access public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await userService.loginUser(email, password);

  const accessToken = jwt.sign(
    {
      user: {
        username: user.username,
        email: user.email,
        id: user.id,
        isAdmin: user.isAdmin,
      },
    },
    accessTokenSecret,
    { expiresIn: jwtExpiresIn }
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

  const users = await userService.getAllUsers();
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

  const user = await userService.getUserById(req.params.id);
  res.status(200).json(user);
});

//@desc Delete user (Admin only - for deleting other users)
//@route DELETE /api/users/:id
//@access private (admin only)
const deleteUser = asyncHandler(async (req, res) => {
  // Check if user is admin
  if (!req.user.isAdmin) {
    res.status(403);
    throw new Error("Only admin users can delete users");
  }

  const result = await userService.deleteUser(req.params.id, req.user.id);
  res.status(200).json(result);
});

//@desc Update user profile (Self)
//@route PUT /api/users/profile
//@access private
const updateUserProfile = asyncHandler(async (req, res) => {
  const updatedUser = await userService.updateUser(req.user.id, req.body);
  res.status(200).json(updatedUser);
});

//@desc Delete user account (Self)
//@route DELETE /api/users/profile
//@access private
const deleteUserSelf = asyncHandler(async (req, res) => {
  const result = await userService.deleteUserSelf(req.user.id);
  res.status(200).json(result);
});

module.exports = {
  registerUser,
  loginUser,
  currentUser,
  getAllUsers,
  getUserById,
  deleteUser,
  updateUserProfile,
  deleteUserSelf,
};
