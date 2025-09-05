const Event = require("../models/Event");

// GET /api/events
exports.listEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    res.json({ events });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/events (admin)
exports.createEvent = async (req, res) => {
  try {
    const { title, description, date, time, location, category } = req.body;
    const eventData = { title, description, date, time, location, category };

    if (req.cloudinaryResult) {
      eventData.image = {
        url: req.cloudinaryResult.url,
        publicId: req.cloudinaryResult.publicId,
        thumbnailUrl: req.cloudinaryResult.thumbnailUrl,
      };
    }

    const event = new Event(eventData);
    await event.save();

    res.status(201).json({ message: "Event created", event });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/events/:id (admin)
exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, date, time, location, category } = req.body;
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (title !== undefined) event.title = title;
    if (description !== undefined) event.description = description;
    if (date !== undefined) event.date = date;
    if (time !== undefined) event.time = time;
    if (location !== undefined) event.location = location;
    if (category !== undefined) event.category = category;

    if (req.cloudinaryResult) {
      event.image = {
        url: req.cloudinaryResult.url,
        publicId: req.cloudinaryResult.publicId,
        thumbnailUrl: req.cloudinaryResult.thumbnailUrl,
      };
    }

    await event.save();
    res.json({ message: 'Event updated', event });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


