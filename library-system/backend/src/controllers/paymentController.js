const Payment = require("../models/Payment");
const User = require("../models/User");

// Submit payment with optional proof (Cloudinary middleware sets req.cloudinaryResult)
const submitPayment = async (req, res) => {
  try {
    const userId = req.user._id;
    const { plan, amount } = req.body;

    if (!plan || !amount) {
      return res.status(400).json({ message: "plan and amount are required" });
    }

    const payment = new Payment({
      user: userId,
      plan,
      amount,
      status: "waiting_for_approval",
      proof: req.cloudinaryResult
        ? {
            url: req.cloudinaryResult.url,
            publicId: req.cloudinaryResult.publicId,
            thumbnailUrl: req.cloudinaryResult.thumbnailUrl,
          }
        : undefined,
      submittedAt: new Date(),
    });

    await payment.save();

    // Update user membershipStatus to waiting_for_approval (best effort)
    try {
      await User.findByIdAndUpdate(userId, { membershipStatus: "waiting_for_approval" });
    } catch (_) {}

    return res.status(201).json({ message: "Payment submitted", payment });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get current user's payment history (paginated)
const getMyPayments = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = Math.max(parseInt(req.query.page || "1"), 1);
    const limit = Math.max(parseInt(req.query.limit || "5"), 1);

    const filter = { user: userId };
    const totalCount = await Payment.countDocuments(filter);
    const totalPages = Math.max(Math.ceil(totalCount / limit), 1);
    const payments = await Payment.find(filter)
      .sort({ submittedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return res.json({
      payments,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Admin: list payments
const listPayments = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1"), 1);
    const limit = Math.max(parseInt(req.query.limit || "10"), 1);

    const totalCount = await Payment.countDocuments({});
    const totalPages = Math.max(Math.ceil(totalCount / limit), 1);
    const payments = await Payment.find({})
      .populate("user", "username email role")
      .sort({ submittedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return res.json({
      payments,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Admin: approve payment
const approvePayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    payment.status = "approved";
    payment.approvedAt = new Date();
    await payment.save();

    // Update user to approved and set membership expiry based on plan
    const now = new Date();
    const planRaw = String(payment.plan || '').trim();
    const plan = planRaw.toLowerCase();
    // Default to 1 month if we cannot parse
    let monthsToAdd = 1;
    // Try to extract a leading integer (e.g., "6 Months", "3 month", "12 months")
    const numMatch = plan.match(/(\d+)\s*/);
    const qty = numMatch ? parseInt(numMatch[1], 10) : null;
    if (plan.includes('year')) {
      monthsToAdd = qty ? qty * 12 : 12;
    } else if (plan.includes('quarter')) {
      monthsToAdd = qty ? qty * 3 : 3;
    } else if (plan.includes('month')) {
      monthsToAdd = qty ? qty : 1;
    }
    const expiry = new Date(now);
    expiry.setMonth(expiry.getMonth() + monthsToAdd);
    await User.findByIdAndUpdate(payment.user, { membershipStatus: "approved", membershipExpiryDate: expiry });

    return res.json({ message: "Payment approved", payment });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Admin: reject payment
const rejectPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { reason } = req.body;
    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    payment.status = "rejected";
    payment.rejectedAt = new Date();
    payment.rejectedReason = reason || undefined;
    await payment.save();

    // Update user back to pending
    await User.findByIdAndUpdate(payment.user, { membershipStatus: "pending" });

    return res.json({ message: "Payment rejected", payment });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  submitPayment,
  getMyPayments,
  listPayments,
  approvePayment,
  rejectPayment,
};


