const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const { upload, uploadToCloudinary } = require("../middleware/cloudinaryUploadMiddleware");
const {
  submitPayment,
  getMyPayments,
  listPayments,
  approvePayment,
  rejectPayment,
} = require("../controllers/paymentController");

const router = express.Router();

// Current user submits membership payment with image proof
router.post(
  "/submit",
  authMiddleware,
  authorizeRoles("user", "admin", "super_admin"),
  upload.single("paymentProof"),
  uploadToCloudinary,
  submitPayment
);

// Current user's payment history
router.get("/history", authMiddleware, getMyPayments);

// Admin endpoints
router.get("/", authMiddleware, authorizeRoles("admin", "super_admin"), listPayments);
router.post("/:paymentId/approve", authMiddleware, authorizeRoles("admin", "super_admin"), approvePayment);
router.post("/:paymentId/reject", authMiddleware, authorizeRoles("admin", "super_admin"), rejectPayment);

module.exports = router;


