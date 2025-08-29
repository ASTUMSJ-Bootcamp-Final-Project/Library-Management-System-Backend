const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const userService = require("../services/userService");
const { accessTokenSecret, jwtExpiresIn } = require("../config/env");
const User = require("../models/userModel");

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

  // create short-lived access token
  const accessToken = jwt.sign(
    {
      user: {
        username: user.username,
        email: user.email,
        id: user.id,
        role: user.role,
      },
    },
    accessTokenSecret,
    { expiresIn: jwtExpiresIn } // 60m
  );

  // create long-lived refresh token
  const refreshToken = jwt.sign({ id: user.id }, accessTokenSecret, {
    expiresIn: "7d",
  });

  // save refresh token in database
  user.refreshToken = refreshToken;
  await user.save();

  res.status(200).json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  });
});

//@desc Refresh access token
//@route POST /api/users/refresh
//@access public
const refreshAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(401);
    throw new Error("Refresh token required");
  }

  const user = await User.findOne({ refreshToken });
  if (!user) {
    res.status(403);
    throw new Error("Invalid refresh token");
  }

  jwt.verify(refreshToken, accessTokenSecret, (err, decoded) => {
    if (err || decoded.id !== user.id) {
      res.status(403);
      throw new Error("Invalid or expired refresh token");
    }

    const newAccessToken = jwt.sign(
      {
        user: {
          username: user.username,
          email: user.email,
          id: user.id,
          role: user.role,
        },
      },
      accessTokenSecret,
      { expiresIn: jwtExpiresIn }
    );

    res.json({ accessToken: newAccessToken });
  });
});

//@desc Logout user
//@route POST /api/users/logout
//@access public
const logoutUser = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  const user = await User.findOne({ refreshToken });
  if (!user) {
    return res.sendStatus(204); // no content
  }

  user.refreshToken = null;
  await user.save();

  res.json({ message: "Logged out successfully" });
});

//@desc Current user info
//@route GET /api/users/current
//@access private
const currentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id); // fetch full user info
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  res.json({
    id: req.user.id,
    username: req.user.username,
    email: req.user.email,
    phone: user.phone,
    department: user.department,
    role: req.user.role,
    studentId: user.studentId,
  });
});

//@desc Get all users
//@route GET /api/users
//@access private
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await userService.getAllUsers(req.user);
  res.status(200).json(users);
});

//@desc Get user by ID
//@route GET /api/users/:id
//@access private
const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id, req.user);
  res.status(200).json(user);
});

//@desc Delete user
//@route DELETE /api/users/:id
//@access private
const deleteUser = asyncHandler(async (req, res) => {
  const result = await userService.deleteUser(req.params.id, req.user);
  res.status(200).json(result);
});

//@desc Update user profile
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

//@desc Promote a user (Super Admin only)
//@route PUT /api/users/:id/promote
//@access Private (Super Admin)
const promoteUser = asyncHandler(async (req, res) => {
  const result = await userService.promoteUser(req.params.id, req.user);
  res.status(200).json(result);
});

//@desc Demote a user (Super Admin only)
//@route PUT /api/users/:id/demote
//@access Private (Super Admin)
const demoteUser = asyncHandler(async (req, res) => {
  const result = await userService.demoteUser(req.params.id, req.user);
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
  promoteUser,
  demoteUser,
  refreshAccessToken,
  logoutUser,
};
