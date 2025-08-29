// ===== routes/events.js =====
const express = require("express");
const { body, validationResult, query } = require("express-validator");
const Event = require("../models/Event");

const router = express.Router();

// Helper function for validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors.array().map((error) => error.msg),
    });
  }
  next();
};

// Validation rules
const validateEvent = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Event title is required")
    .isLength({ max: 200 })
    .withMessage("Event title cannot exceed 200 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Event description cannot exceed 2000 characters"),
  body("startDate")
    .optional()
    .custom((value) => {
      if (value && !Date.parse(value)) {
        throw new Error("Start date must be a valid date");
      }
      return true;
    }),
  body("endDate")
    .optional()
    .custom((value) => {
      if (value && !Date.parse(value)) {
        throw new Error("End date must be a valid date");
      }
      return true;
    }),
  body("allDay")
    .optional()
    .isBoolean()
    .withMessage("All day must be a boolean"),
  body("location.name")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Location name cannot exceed 200 characters"),
  body("color")
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage("Color must be a valid hex color"),
  body("recurrence.type")
    .optional()
    .isIn(["none", "daily", "weekly", "monthly", "yearly"])
    .withMessage("Invalid recurrence type"),
];

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Get all events for the authenticated user
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter events starting from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter events ending before this date
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, completed, cancelled]
 *     responses:
 *       200:
 *         description: Events list returned
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.get(
  "/",
  [
    query("startDate")
      .optional()
      .isISO8601()
      .withMessage("Start date must be valid"),
    query("endDate")
      .optional()
      .isISO8601()
      .withMessage("End date must be valid"),
    query("category").optional().trim(),
    query("status").optional().isIn(["scheduled", "completed", "cancelled"]),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { startDate, endDate, category, status = "scheduled" } = req.query;

      // Build filter
      const filter = { userId: req.user._id, status };

      // Date range filter
      if (startDate || endDate) {
        filter.startDate = {};
        if (startDate) filter.startDate.$gte = new Date(startDate);
        if (endDate) filter.startDate.$lte = new Date(endDate);
      }

      if (category) {
        filter.category = new RegExp(category, "i");
      }

      const events = await Event.find(filter).sort({ startDate: 1 }).lean();

      res.json({ events });
    } catch (error) {
      console.error("Get events error:", error);
      res.status(500).json({
        error: "Server error",
        details: "Failed to fetch events",
      });
    }
  }
);

/**
 * @swagger
 * /api/events/upcoming:
 *   get:
 *     summary: Get upcoming events
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *         description: Number of days ahead to include (default 7)
 *     responses:
 *       200:
 *         description: Upcoming events returned
 *       500:
 *         description: Server error
 */
router.get("/upcoming", async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const events = await Event.findUpcoming(req.user._id, parseInt(days));

    res.json({
      events,
      count: events.length,
    });
  } catch (error) {
    console.error("Get upcoming events error:", error);
    res.status(500).json({
      error: "Server error",
      details: "Failed to fetch upcoming events",
    });
  }
});

/**
 * @swagger
 * /api/events/calendar/{year}/{month}:
 *   get:
 *     summary: Get calendar events for a specific month
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Events for the requested month
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Server error
 */
router.get("/calendar/:year/:month", async (req, res) => {
  try {
    const { year, month } = req.params;

    // Validate year and month
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    if (yearNum < 1900 || yearNum > 2100 || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({
        error: "Invalid date",
        details: "Please provide valid year and month",
      });
    }

    const events = await Event.findByMonth(req.user._id, yearNum, monthNum);

    res.json({
      events,
      month: monthNum,
      year: yearNum,
      totalEvents: events.length,
    });
  } catch (error) {
    console.error("Get calendar events error:", error);
    res.status(500).json({
      error: "Server error",
      details: "Failed to fetch calendar events",
    });
  }
});

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Get a single event by ID
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event returned
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Event not found
 *       500:
 *         description: Server error
 */
router.get("/:id", async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!event) {
      return res.status(404).json({
        error: "Event not found",
        details: "Event not found or access denied",
      });
    }

    res.json({ event });
  } catch (error) {
    console.error("Get event error:", error);
    if (error.name === "CastError") {
      return res.status(400).json({
        error: "Invalid event ID",
        details: "Please provide a valid event ID",
      });
    }
    res.status(500).json({
      error: "Server error",
      details: "Failed to fetch event",
    });
  }
});

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               allDay:
 *                 type: boolean
 *               location:
 *                 type: object
 *               color:
 *                 type: string
 *     responses:
 *       201:
 *         description: Event created
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post("/", validateEvent, handleValidationErrors, async (req, res) => {
  try {
    const eventData = {
      ...req.body,
      userId: req.user._id,
    };

    // Set default dates if not provided or invalid
    if (!eventData.startDate || !Date.parse(eventData.startDate)) {
      eventData.startDate = new Date(); // Today
    }

    if (!eventData.endDate || !Date.parse(eventData.endDate)) {
      eventData.endDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
    }

    // Validate end date is after start date
    if (new Date(eventData.endDate) < new Date(eventData.startDate)) {
      return res.status(400).json({
        error: "Invalid dates",
        details: "End date must be after start date",
      });
    }

    const event = new Event(eventData);
    await event.save();

    res.status(201).json({
      message: "Event created successfully",
      event,
    });
  } catch (error) {
    console.error("Create event error:", error);
    res.status(500).json({
      error: "Server error",
      details: "Failed to create event",
    });
  }
});

// Note: validation for event fields is applied via validateEvent
/**
 * @swagger
 * /api/events/{id}:
 *   put:
 *     summary: Update an existing event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Event updated successfully
 *       400:
 *         description: Validation error or invalid ID
 *       404:
 *         description: Event not found
 *       500:
 *         description: Server error
 */
router.put("/:id", validateEvent, handleValidationErrors, async (req, res) => {
  try {
    const updateData = { ...req.body };

    // רק אם יש תאריכים - בדוק אותם
    if (updateData.startDate && updateData.endDate) {
      if (new Date(updateData.endDate) < new Date(updateData.startDate)) {
        return res.status(400).json({
          error: "Invalid dates",
          details: "End date must be after start date",
        });
      }
    }

    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({
        error: "Event not found",
        details: "Event not found or access denied",
      });
    }

    res.json({
      message: "Event updated successfully",
      event,
    });
  } catch (error) {
    console.error("Update event error:", error);
    if (error.name === "CastError") {
      return res.status(400).json({
        error: "Invalid event ID",
        details: "Please provide a valid event ID",
      });
    }
    res.status(500).json({
      error: "Server error",
      details: "Failed to update event",
    });
  }
});

/**
 * @swagger
 * /api/events/{id}:
 *   delete:
 *     summary: Delete an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event deleted successfully
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Event not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", async (req, res) => {
  try {
    const event = await Event.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!event) {
      return res.status(404).json({
        error: "Event not found",
        details: "Event not found or access denied",
      });
    }

    res.json({
      message: "Event deleted successfully",
      event,
    });
  } catch (error) {
    console.error("Delete event error:", error);
    if (error.name === "CastError") {
      return res.status(400).json({
        error: "Invalid event ID",
        details: "Please provide a valid event ID",
      });
    }
    res.status(500).json({
      error: "Server error",
      details: "Failed to delete event",
    });
  }
});

/**
 * @swagger
 * /api/events/{id}/attendees:
 *   put:
 *     summary: Add an attendee to an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Attendee added successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Event not found
 *       500:
 *         description: Server error
 */
router.put(
  "/:id/attendees",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),
    body("name").trim().notEmpty().withMessage("Name is required"),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email, name } = req.body;

      const event = await Event.findOne({
        _id: req.params.id,
        userId: req.user._id,
      });

      if (!event) {
        return res.status(404).json({
          error: "Event not found",
          details: "Event not found or access denied",
        });
      }

      // Use the model method to add attendee
      event.addAttendee(email, name);
      await event.save();

      res.json({
        message: "Attendee added successfully",
        event,
      });
    } catch (error) {
      console.error("Add attendee error:", error);
      res.status(500).json({
        error: "Server error",
        details: "Failed to add attendee",
      });
    }
  }
);

// @route   PUT /api/events/:id/attendees/:email/status
// @desc    Update attendee status
// @access  Private
/**
 * @swagger
 * /api/events/{id}/attendees/{email}/status:
 *   put:
 *     summary: Update attendee status for an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, accepted, declined]
 *     responses:
 *       200:
 *         description: Attendee status updated successfully
 *       400:
 *         description: Validation error or invalid parameters
 *       404:
 *         description: Event not found
 *       500:
 *         description: Server error
 */
router.put(
  "/:id/attendees/:email/status",
  [
    body("status")
      .isIn(["pending", "accepted", "declined"])
      .withMessage("Status must be pending, accepted, or declined"),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { status } = req.body;
      const email = decodeURIComponent(req.params.email);

      const event = await Event.findOne({
        _id: req.params.id,
        userId: req.user._id,
      });

      if (!event) {
        return res.status(404).json({
          error: "Event not found",
          details: "Event not found or access denied",
        });
      }

      // Use the model method to update attendee status
      event.updateAttendeeStatus(email, status);
      await event.save();

      res.json({
        message: "Attendee status updated successfully",
        event,
      });
    } catch (error) {
      console.error("Update attendee status error:", error);
      res.status(500).json({
        error: "Server error",
        details: "Failed to update attendee status",
      });
    }
  }
);

module.exports = router;
