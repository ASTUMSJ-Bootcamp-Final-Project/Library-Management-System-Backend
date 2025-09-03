const Payment = require("../models/paymentModel");
const User = require("../models/userModel");
const sendEmail = require("../utils/sendEmail");
const cloudinary = require("../utils/cloudinary");

//@desc Student uploads payment
const uploadPayment = async (user, file) => {
  if (!file) {
    throw new Error("Screenshot file is required");
  }

  // Upload to Cloudinary
  const uploadResult = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "libraryPayments" },
      (err, result) => {
        if (err) {
          console.log("Cloudinary upload error:", err);
          reject(new Error("Cloudinary upload failed"));
        } else {
          resolve(result);
        }
      }
    );
    stream.end(file.buffer);
  });

  console.log("Creating payment with:", {
    student: user.id,
    screenshot: {
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
    },
    status: "Pending",
  });

  const payment = await Payment.create({
    student: user.id,
    screenshot: {
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
    },
    status: "Pending",
  });

  console.log("Payment created successfully:", payment);
  return payment;
};

//@desc Admin get all payments
const getAllPayments = async () => {
  return await Payment.find().populate(
    "student",
    "username email membershipActive membershipExpiry"
  );
};

//@desc Approve payment + activate membership + send email
const approvePayment = async (id) => {
  const payment = await Payment.findById(id).populate(
    "student",
    "username email membershipStatus membershipExpiry role"
  );
  if (!payment) throw new Error("Payment not found");

  // Approve payment
  payment.status = "Approved";
  payment.approvedAt = new Date();
  await payment.save();

  // Activate membership (update membershipStatus & expiry)
  const student = payment.student;
  student.membershipStatus = "Active";
  student.membershipExpiry = new Date(
    Date.now() + 6 * 30 * 24 * 60 * 60 * 1000 // 6 months
  );
  await student.save();

  // Send email to student
  await sendEmail(
    student.email,
    "Payment Approved",
    `Hi ${
      student.username
    }, your payment has been approved. Membership is active until ${student.membershipExpiry.toDateString()}. You can now borrow books.`
  );

  return payment;
};


//@desc Reject payment + deactivate membership + send email
const rejectPayment = async (id) => {
  const payment = await Payment.findById(id).populate(
    "student",
    "username email membershipStatus membershipExpiry role"
  );
  if (!payment) throw new Error("Payment not found");

  payment.status = "Rejected";
  await payment.save();

  // Deactivate membership
  const student = payment.student;
  student.membershipActive = false;
  await student.save();

  await sendEmail(
    student.email,
    "Payment Rejected",
    `Hi ${student.username}, your payment was rejected. Please contact the admin or try again.`
  );

  return payment;
};

module.exports = {
  uploadPayment,
  getAllPayments,
  approvePayment,
  rejectPayment,
};
