// ===== routes/communityEvents.js =====
const express = require("express");
const { body, validationResult } = require("express-validator");
const CommunityEvent = require("../models/CommunityEvent");
const { authMiddleware, optionalAuth } = require("../middleware/auth");

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

/**
 * @swagger
 * /api/community-events:
 *   get:
 *     summary: Get all community events
 *     description: Retrieve a list of all active community events.
 *     tags: [Community Events]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [meetup, workshop, social, business, other]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [upcoming, today, this-week, past]
 *     responses:
 *       200:
 *         description: Successfully retrieved events.
 *       500:
 *         description: Server error.
 */
router.get("/", optionalAuth, async (req, res) => {
  try {
    const { category, status } = req.query;
    let query = { isActive: true };

    // Apply category filter
    if (category) {
      query.category = category;
    }

    // Apply status filter
    if (status) {
      const now = new Date();
      switch (status) {
        case 'upcoming':
          query.date = { $gte: now };
          break;
        case 'today':
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          query.date = { $gte: today, $lt: tomorrow };
          break;
        case 'this-week':
          const weekStart = new Date();
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          weekStart.setHours(0, 0, 0, 0);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 7);
          query.date = { $gte: weekStart, $lt: weekEnd };
          break;
        case 'past':
          query.date = { $lt: now };
          break;
      }
    }

    const events = await CommunityEvent.find(query)
      .populate('organizer', 'firstName lastName username avatar')
      .sort({ date: 1 });

    res.json({ events });
  } catch (error) {
    console.error("Get community events error:", error);
    res.status(500).json({
      error: "Server error",
      details: "Failed to get community events",
    });
  }
});

/**
 * @swagger
 * /api/community-events/{eventId}:
 *   get:
 *     summary: Get community event by ID
 *     description: Retrieve detailed information about a specific community event.
 *     tags: [Community Events]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved event.
 *       404:
 *         description: Event not found.
 *       500:
 *         description: Server error.
 */
router.get("/:eventId", optionalAuth, async (req, res) => {
  try {
    const event = await CommunityEvent.findById(req.params.eventId)
      .populate('organizer', 'firstName lastName username avatar')
      .populate('attendees.user', 'firstName lastName username avatar');

    if (!event) {
      return res.status(404).json({
        error: "Event not found",
        details: "Community event with this ID does not exist",
      });
    }

    if (!event.isActive) {
      return res.status(404).json({
        error: "Event not found",
        details: "This event is no longer active",
      });
    }

    res.json({ event });
  } catch (error) {
    console.error("Get community event error:", error);
    res.status(500).json({
      error: "Server error",
      details: "Failed to get community event",
    });
  }
});

/**
 * @swagger
 * /api/community-events/{eventId}/join:
 *   post:
 *     summary: Join community event
 *     description: Join a community event as an attendee.
 *     tags: [Community Events]
 *     parameters:
 *       - in: path
 *         name: eventId
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
 *                 enum: [going, maybe, not-going]
 *                 default: going
 *     responses:
 *       200:
 *         description: Successfully joined event.
 *       400:
 *         description: Validation failed or event is full.
 *       401:
 *         description: Authentication required.
 *       404:
 *         description: Event not found.
 *       500:
 *         description: Server error.
 */
router.post(
  "/:eventId/join",
  authMiddleware,
  [
    body("status")
      .optional()
      .isIn(["going", "maybe", "not-going"])
      .withMessage("Status must be going, maybe, or not-going"),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { status = "going" } = req.body;
      const eventId = req.params.eventId;
      const userId = req.user._id;

      const event = await CommunityEvent.findById(eventId);

      if (!event) {
        return res.status(404).json({
          error: "Event not found",
          details: "Community event with this ID does not exist",
        });
      }

      if (!event.isActive) {
        return res.status(400).json({
          error: "Event inactive",
          details: "This event is no longer active",
        });
      }

      // Check if event is full
      if (event.maxAttendees && event.attendeeCount >= event.maxAttendees && status === 'going') {
        return res.status(400).json({
          error: "Event full",
          details: "This event has reached maximum capacity",
        });
      }

      await event.addAttendee(userId, status);

      // Populate organizer and attendees
      await event.populate('organizer', 'firstName lastName username avatar');
      await event.populate('attendees.user', 'firstName lastName username avatar');

      res.json({
        message: "Successfully joined event",
        event,
      });
    } catch (error) {
      console.error("Join community event error:", error);
      res.status(500).json({
        error: "Server error",
        details: "Failed to join community event",
      });
    }
  }
);

/**
 * @swagger
 * /api/community-events/{eventId}/leave:
 *   delete:
 *     summary: Leave community event
 *     description: Remove yourself as an attendee from a community event.
 *     tags: [Community Events]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully left event.
 *       401:
 *         description: Authentication required.
 *       404:
 *         description: Event not found.
 *       500:
 *         description: Server error.
 */
router.delete("/:eventId/leave", authMiddleware, async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const userId = req.user._id;

    const event = await CommunityEvent.findById(eventId);

    if (!event) {
      return res.status(404).json({
        error: "Event not found",
        details: "Community event with this ID does not exist",
      });
    }

    await event.removeAttendee(userId);

    // Populate organizer and attendees
    await event.populate('organizer', 'firstName lastName username avatar');
    await event.populate('attendees.user', 'firstName lastName username avatar');

    res.json({
      message: "Successfully left event",
      event,
    });
  } catch (error) {
    console.error("Leave community event error:", error);
    res.status(500).json({
      error: "Server error",
      details: "Failed to leave community event",
    });
  }
});

/**
 * @swagger
 * /api/community-events/{eventId}/rsvp:
 *   put:
 *     summary: Update RSVP status
 *     description: Update your RSVP status for a community event.
 *     tags: [Community Events]
 *     parameters:
 *       - in: path
 *         name: eventId
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
 *                 enum: [going, maybe, not-going]
 *     responses:
 *       200:
 *         description: RSVP status updated successfully.
 *       400:
 *         description: Validation failed or event is full.
 *       401:
 *         description: Authentication required.
 *       404:
 *         description: Event not found.
 *       500:
 *         description: Server error.
 */
router.put(
  "/:eventId/rsvp",
  authMiddleware,
  [
    body("status")
      .isIn(["going", "maybe", "not-going"])
      .withMessage("Status must be going, maybe, or not-going"),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { status } = req.body;
      const eventId = req.params.eventId;
      const userId = req.user._id;

      const event = await CommunityEvent.findById(eventId);

      if (!event) {
        return res.status(404).json({
          error: "Event not found",
          details: "Community event with this ID does not exist",
        });
      }

      if (!event.isActive) {
        return res.status(400).json({
          error: "Event inactive",
          details: "This event is no longer active",
        });
      }

      // Check if event is full when changing to 'going'
      if (status === 'going' && event.maxAttendees && event.attendeeCount >= event.maxAttendees) {
        // Check if user is already going
        const existingAttendee = event.attendees.find(
          attendee => attendee.user.toString() === userId.toString() && attendee.status === 'going'
        );
        
        if (!existingAttendee) {
          return res.status(400).json({
            error: "Event full",
            details: "This event has reached maximum capacity",
          });
        }
      }

      await event.updateAttendeeStatus(userId, status);

      // Populate organizer and attendees
      await event.populate('organizer', 'firstName lastName username avatar');
      await event.populate('attendees.user', 'firstName lastName username avatar');

      res.json({
        message: "RSVP status updated successfully",
        event,
      });
    } catch (error) {
      console.error("Update RSVP status error:", error);
      res.status(500).json({
        error: "Server error",
        details: "Failed to update RSVP status",
      });
    }
  }
);

/**
 * @swagger
 * /api/community-events/my-events:
 *   get:
 *     summary: Get user's community events
 *     description: Retrieve events that the authenticated user is attending.
 *     tags: [Community Events]
 *     responses:
 *       200:
 *         description: Successfully retrieved user's events.
 *       401:
 *         description: Authentication required.
 *       500:
 *         description: Server error.
 */
router.get("/my-events", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;

    const events = await CommunityEvent.find({
      'attendees.user': userId,
      isActive: true
    })
      .populate('organizer', 'firstName lastName username avatar')
      .sort({ date: 1 });

    res.json({ events });
  } catch (error) {
    console.error("Get user's community events error:", error);
    res.status(500).json({
      error: "Server error",
      details: "Failed to get user's community events",
    });
  }
});

module.exports = router;
