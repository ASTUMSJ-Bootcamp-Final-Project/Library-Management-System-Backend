const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const { adminSecretCode } = require("../config/env");

//@desc Register a user
const registerUser = async (userData) => {
  const { username, email, password, secretCode } = userData;

  if (!username || !email || !password) {
    throw new Error("All fields are mandatory!");
  }

  const userAvailable = await User.findOne({ email });
  if (userAvailable) {
    throw new Error("User already registered!");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Check if user should be admin
  const isAdmin = secretCode === adminSecretCode;

  const user = await User.create({
    username,
    email,
    password: hashedPassword,
    isAdmin,
  });

  if (user) {
    return {
      _id: user.id,
      email: user.email,
      username: user.username,
      isAdmin: user.isAdmin,
    };
  } else {
    throw new Error("User data is not valid");
  }
};

//@desc Login user
const loginUser = async (email, password) => {
  if (!email || !password) {
    throw new Error("All fields are mandatory");
  }

  const user = await User.findOne({ email });

  if (user && (await bcrypt.compare(password, user.password))) {
    return user;
  } else {
    throw new Error("Email or password is not valid");
  }
};

//@desc Get all users
const getAllUsers = async () => {
  return await User.find().select("-password");
};

//@desc Get user by ID
const getUserById = async (userId) => {
  const user = await User.findById(userId).select("-password");

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

//@desc Delete user (Admin only - for deleting other users)
const deleteUser = async (userId, currentUserId) => {
  const userToDelete = await User.findById(userId);

  if (!userToDelete) {
    throw new Error("User not found");
  }

  // Prevent admin from deleting themselves
  if (userId === currentUserId) {
    throw new Error("Admins cannot delete their own account");
  }

  // Prevent admin from deleting other admins
  if (userToDelete.isAdmin) {
    throw new Error("Admins cannot delete other admin accounts");
  }

  await User.findByIdAndDelete(userId);

  return {
    message: "User deleted successfully",
    id: userId,
    username: userToDelete.username,
  };
};

//@desc Update user profile (Self)
const updateUser = async (userId, updateData) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  // If updating password, hash it
  if (updateData.password) {
    updateData.password = await bcrypt.hash(updateData.password, 10);
  }

  const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
  }).select("-password");

  return updatedUser;
};

//@desc Delete user (Self - user deleting their own account)
const deleteUserSelf = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  await User.findByIdAndDelete(userId);

  return {
    message: "User account deleted successfully",
    id: userId,
  };
};

module.exports = {
  registerUser,
  loginUser,
  getAllUsers,
  getUserById,
  deleteUser,
  updateUser,
  deleteUserSelf,
};
