const asyncHandler = require("express-async-handler");
const paymentService = require("../services/paymentService");

// @desc Student uploads a payment screenshot
// @route POST /api/payments
// @access Private
const uploadPayment = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("Screenshot is required");
  }

  console.log("User in controller:", req.user); // Debug log
  console.log("File in controller:", req.file); // Debug log

  // Make sure req.user exists and has _id
  if (!req.user || !req.user.id) {
    res.status(401);
    throw new Error("User not authenticated");
  }

  const payment = await paymentService.uploadPayment(req.user, req.file);
  res.status(201).json({
    message: "Payment uploaded successfully",
    payment,
  });
});

// @desc Admin get all payments
// @route GET /api/payments
// @access Admin
const getPayments = asyncHandler(async (req, res) => {
  const payments = await paymentService.getAllPayments();
  res.status(200).json(payments);
});

// @desc Admin approve payment
// @route PATCH /api/payments/:id/approve
// @access Admin
const approvePayment = asyncHandler(async (req, res) => {
  const payment = await paymentService.approvePayment(req.params.id);
  res.status(200).json({ message: "Payment approved", payment });
});

// @desc Admin reject payment
// @route PATCH /api/payments/:id/reject
// @access Admin
const rejectPayment = asyncHandler(async (req, res) => {
  const payment = await paymentService.rejectPayment(req.params.id);
  res.status(200).json({ message: "Payment rejected", payment });
});

module.exports = {
  uploadPayment,
  getPayments,
  approvePayment,
  rejectPayment,
};
