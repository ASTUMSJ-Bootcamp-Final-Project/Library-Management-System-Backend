const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    date: { type: String },
    time: { type: String },
    location: { type: String },
    category: { type: String },
    image: {
      url: { type: String },
      publicId: { type: String },
      thumbnailUrl: { type: String },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);


