const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const validateToken = require("../middleware/validateTokenHandler");
const adminOnly = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

// Apply validateToken to ALL payment routes FIRST
router.use(validateToken);

// Then define the routes
router.post("/", upload.single("screenshot"), paymentController.uploadPayment);

router.get("/", adminOnly, paymentController.getPayments);
router.patch("/:id/approve", adminOnly, paymentController.approvePayment);
router.patch("/:id/reject", adminOnly, paymentController.rejectPayment);

module.exports = router;
