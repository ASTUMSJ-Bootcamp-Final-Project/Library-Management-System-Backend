const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const { upload, uploadToCloudinary } = require("../middleware/cloudinaryUploadMiddleware");
const { listEvents, createEvent, updateEvent } = require("../controllers/eventsController");

const router = express.Router();

router.get("/", listEvents);

router.post(
  "/",
  authMiddleware,
  authorizeRoles("admin", "super_admin"),
  upload.single("image"),
  uploadToCloudinary,
  createEvent
);

module.exports = router;

// Update existing event
router.put(
  "/:id",
  authMiddleware,
  authorizeRoles("admin", "super_admin"),
  upload.single("image"),
  uploadToCloudinary,
  updateEvent
);


