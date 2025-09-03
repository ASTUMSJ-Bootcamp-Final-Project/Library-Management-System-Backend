const User = require("../models/userModel");

const checkMembership = async (req, res, next) => {
  try {
    // fetch the latest user from DB
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.membershipStatus !== "Active") {
      return res
        .status(403)
        .json({ message: "Payment required to borrow books." });
    }

    if (user.membershipExpiry && user.membershipExpiry < new Date()) {
      user.membershipStatus = "Inactive";
      await user.save();
      return res
        .status(403)
        .json({ message: "Membership expired. Please pay again." });
    }

    
    req.user = user;

    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { checkMembership };
