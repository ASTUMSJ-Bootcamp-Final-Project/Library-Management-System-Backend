const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const nodemailer = require("nodemailer");

//@desc Register a user (always role=user)
const registerUser = async (userData) => {
  const { username, email, password } = userData;

  if (!username || !email || !password) {
    throw new Error("All fields are mandatory!");
  }

  const userAvailable = await User.findOne({ email });
  if (userAvailable) {
    throw new Error("User already registered!");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    username,
    email,
    password: hashedPassword,
    role: "user",
  });

  if (user) {
    return {
      _id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
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
const getAllUsers = async (currentUser) => {
  if (currentUser.role === "superadmin") {
    return await User.find().select("-password -refreshToken");
  } else if (currentUser.role === "admin") {
    return await User.find({ role: { $ne: "superadmin" } }).select(
      "-password -refreshToken"
    );
  } else {
    throw new Error("Not authorized to view users");
  }
};

//@desc Get user by ID
const getUserById = async (userId, currentUser) => {
  const user = await User.findById(userId).select("-password -refreshToken");

  if (!user) {
    throw new Error("User not found");
  }

  if (user.role === "superadmin" && currentUser.role !== "superadmin") {
    throw new Error("Not authorized to access this user");
  }

  return user;
};

//@desc Delete user
const deleteUser = async (userId, currentUser) => {
  const userToDelete = await User.findById(userId);

  if (!userToDelete) {
    throw new Error("User not found");
  }

  if (userToDelete.role === "superadmin") {
    throw new Error("Super admin account cannot be deleted");
  }

  if (userToDelete.role === "admin" && currentUser.role !== "superadmin") {
    throw new Error("Only super admin can delete admins");
  }

  await User.findByIdAndDelete(userId);

  return {
    message: "User deleted successfully",
    id: userId,
    username: userToDelete.username,
  };
};

//@desc Update user profile (username, phone, department, studentId)
const updateUser = async (userId, updateData) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  // Only allow specific fields to be updated
  const allowedFields = ["username", "phone", "department", "studentId"];
  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      user[field] = updateData[field];
    }
  });

  const updatedUser = await user.save();

  // Return user info without password and refreshToken
  return {
    id: updatedUser._id,
    username: updatedUser.username,
    email: updatedUser.email,
    phone: updatedUser.phone,
    department: updatedUser.department,
    studentId: updatedUser.studentId,
    role: updatedUser.role,
  };
};

//@desc Delete self
const deleteUserSelf = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  if (user.role === "superadmin") {
    throw new Error("Super admin cannot delete themselves");
  }

  await User.findByIdAndDelete(userId);

  return {
    message: "User account deleted successfully",
    id: userId,
  };
};

//@desc Promote user to admin (super admin only)
const promoteToAdmin = async (userId, currentUser) => {
  if (currentUser.role !== "superadmin") {
    throw new Error("Only super admin can promote users");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  if (user.role === "admin") {
    throw new Error("User is already an admin");
  }

  user.role = "admin";
  await user.save();

  return { message: "User promoted to admin successfully", id: user.id };
};

//@desc Promote user (super admin only)
const promoteUser = async (userId, superAdmin) => {
  if (superAdmin.role !== "superadmin") {
    throw new Error("Only super admin can promote users");
  }

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  if (user.role === "admin") {
    throw new Error("User is already an admin");
  }

  // Promote user
  user.role = "admin";
  await user.save();

  // Send email notification
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Library App" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: "Role Update Notification",
    text: `Hello ${user.username},\n\nYou have been promoted to Admin by the Super Admin.\n\n-Library Team`,
  };

  await transporter.sendMail(mailOptions);

  return {
    message: "User promoted to admin and notified",
    userId: user.id,
  };
};

//@desc Demote admin to user (super admin only)
const demoteUser = async (userId, superAdmin) => {
  if (superAdmin.role !== "superadmin") {
    throw new Error("Only super admin can demote admins");
  }

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  if (user.role !== "admin") {
    throw new Error("This user is not an admin");
  }

  // Demote user
  user.role = "user";
  await user.save();

  // Send email notification
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Library App" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: "Role Update Notification",
    text: `Hello ${user.username},\n\nYour admin role has been revoked by the Super Admin. You are now a regular user.\n\n-Library Team`,
  };

  await transporter.sendMail(mailOptions);

  return {
    message: "User demoted successfully and notified",
    userId: user.id,
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
  promoteUser,
  demoteUser,
};
