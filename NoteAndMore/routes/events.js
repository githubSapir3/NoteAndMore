const express = require('express');
const { body, validationResult, query } = require('express-validator');
const mongoose = require('mongoose');

const router = express.Router();

// Event Schema (inline for this example - you can move to models/Event.js)
const eventSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [200, 'Event title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Event description cannot exceed 2000 characters']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
    index: true
  },
  endDate: {
    type: Date,
    validate: {
      validator: function(value) {
        return !value || value >= this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  allDay: {
    type: Boolean,
    default: false
  },
  location: {
    name: {
      type: String,
      trim: true,
      maxlength: [200, 'Location name cannot exceed 200 characters']
    },
    address: {
      type: String,
      trim: true,
      maxlength: [500, 'Address cannot exceed 500 characters']
    },
    coordinates: {
      lat: { type: Number, min: -90, max: 90 },
      lng: { type: Number, min: -180, max: 180 }
    }
  },
  recurrence: {
    type: {
      type: String,
      enum: ['none', 'daily', 'weekly', 'monthly', 'yearly'],
      default: 'none'
    },
    interval: {
      type: Number,
      min: 1,
      default: 1
    },
    endDate: Date,
    daysOfWeek: [{
      type: Number,
      min: 0,
      max: 6
    }]
  },
  reminders: [{
    type: {
      type: String,
      enum: ['notification', 'email', 'sms'],
      default: 'notification'
    },
    minutesBefore: {
      type: Number,
      min: 0,
      default: 15
    },
    sent: {
      type: Boolean,
      default: false
    }
  }],
  attendees: [{
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    name: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending'
    }
  }],
  color: {
    type: String,
    default: '#3174ad',
    match: [/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color']
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  category: {
    type: String,
    default: 'General',
    maxlength: [50, 'Category cannot exceed 50 characters']
  }
}, {
  timestamps: true
});

// Indexes
eventSchema.index({ userId: 1, startDate: 1 });
eventSchema.index({ userId: 1, endDate: 1 });
eventSchema.index({ userId: 1, category: 1 });

const Event = mongoose.model('Event', eventSchema);

// Helper function for validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(error => error.msg)
    });
  }
  next();
};

// Validation rules
const validateEvent = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Event title is required')
    .isLength({ max: 200 })
    .withMessage('Event title cannot exceed 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Event description cannot exceed 2000 characters'),
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  body('allDay')
    .optional()
    .isBoolean()
    .withMessage('All day must be a boolean'),
  body('location.name')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Location name cannot exceed 200 characters'),
  body('color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color must be a valid hex color'),
  body('recurrence.type')
    .optional()
    .isIn(['none', 'daily', 'weekly', 'monthly', 'yearly'])
    .withMessage('Invalid recurrence type')
];

// @route   GET /api/events
// @desc    Get all events for user with filtering
// @access  Private
router.get('/', [
  query('startDate').optional().isISO8601().withMessage('Start date must be valid'),
  query('endDate').optional().isISO8601().withMessage('End date must be valid'),
  query('category').optional().trim(),
  query('status').optional().isIn(['scheduled', 'completed', 'cancelled'])
], handleValidationErrors, async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      category,
      status = 'scheduled'
    } = req.query;

    // Build filter
    const filter = { userId: req.user._id, status };

    // Date range filter
    if (startDate || endDate) {
      filter.startDate = {};
      if (startDate) filter.startDate.$gte = new Date(startDate);
      if (endDate) filter.startDate.$lte = new Date(endDate);
    }

    if (category) {
      filter.category = new RegExp(category, 'i');
    }

    const events = await Event.find(filter)
      .sort({ startDate: 1 })
      .lean();

    res.json({ events });

  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      error: 'Server error',
      details: 'Failed to fetch events'
    });
  }
});

// @route   GET /api/events/:id
// @desc    Get single event
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!event) {
      return res.status(404).json({
        error: 'Event not found',
        details: 'Event not found or access denied'
      });
    }

    res.json({ event });

  } catch (error) {
    console.error('Get event error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'Invalid event ID',
        details: 'Please provide a valid event ID'
      });
    }
    res.status(500).json({
      error: 'Server error',
      details: 'Failed to fetch event'
    });
  }
});

// @route   POST /api/events
// @desc    Create new event
// @access  Private
router.post('/', validateEvent, handleValidationErrors, async (req, res) => {
  try {
    const eventData = {
      ...req.body,
      userId: req.user._id
    };

    // Validate end date is after start date
    if (eventData.endDate && new Date(eventData.endDate) < new Date(eventData.startDate)) {
      return res.status(400).json({
        error: 'Invalid dates',
        details: 'End date must be after start date'
      });
    }

    const event = new Event(eventData);
    await event.save();

    res.status(201).json({
      message: 'Event created successfully',
      event
    });

  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      error: 'Server error',
      details: 'Failed to create event'
    });
  }
});

// @route   PUT /api/events/:id
// @desc    Update event
// @access  Private
router.put('/:id', validateEvent, handleValidationErrors, async (req, res) => {
  try {
    // Validate end date is after start date if both provided
    if (req.body.endDate && req.body.startDate) {
      if (new Date(req.body.endDate) < new Date(req.body.startDate)) {
        return res.status(400).json({
          error: 'Invalid dates',
          details: 'End date must be after start date'
        });
      }
    }

    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({
        error: 'Event not found',
        details: 'Event not found or access denied'
      });
    }

    res.json({
      message: 'Event updated successfully',
      event
    });

  } catch (error) {
    console.error('Update event error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'Invalid event ID',
        details: 'Please provide a valid event ID'
      });
    }
    res.status(500).json({
      error: 'Server error',
      details: 'Failed to update event'
    });
  }
});

// @route   DELETE /api/events/:id
// @desc    Delete event
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const event = await Event.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!event) {
      return res.status(404).json({
        error: 'Event not found',
        details: 'Event not found or access denied'
      });
    }

    res.json({
      message: 'Event deleted successfully',
      event
    });

  } catch (error) {
    console.error('Delete event error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'Invalid event ID',
        details: 'Please provide a valid event ID'
      });
    }
    res.status(500).json({
      error: 'Server error',
      details: 'Failed to delete event'
    });
  }
});

// @route   GET /api/events/calendar/:year/:month
// @desc    Get events for specific month
// @access  Private
router.get('/calendar/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    
    // Validate year and month
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    
    if (yearNum < 1900 || yearNum > 2100 || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({
        error: 'Invalid date',
        details: 'Please provide valid year and month'
      });
    }

    // Calculate start and end of month
    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59);

    const events = await Event.find({
      userId: req.user._id,
      status: 'scheduled',
      $or: [
        // Events that start in this month
        {
          startDate: {
            $gte: startDate,
            $lte: endDate
          }
        },
        // Events that span across this month
        {
          startDate: { $lt: startDate },
          endDate: { $gte: startDate }
        }
      ]
    }).sort({ startDate: 1 });

    res.json({ 
      events,
      month: monthNum,
      year: yearNum,
      totalEvents: events.length
    });

  } catch (error) {
    console.error('Get calendar events error:', error);
    res.status(500).json({
      error: 'Server error',
      details: 'Failed to fetch calendar events'
    });
  }
});

// @route   GET /api/events/upcoming
// @desc    Get upcoming events (next 7 days)
// @access  Private
router.get('/upcoming', async (req, res) => {
  try {
    const now = new Date();
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const events = await Event.find({
      userId: req.user._id,
      status: 'scheduled',
      startDate: {
        $gte: now,
        $lte: nextWeek
      }
    }).sort({ startDate: 1 }).limit(10);

    res.json({ 
      events,
      count: events.length
    });

  } catch (error) {
    console.error('Get upcoming events error:', error);
    res.status(500).json({
      error: 'Server error',
      details: 'Failed to fetch upcoming events'
    });
  }
});

// @route   PUT /api/events/:id/attendees
// @desc    Add attendee to event
// @access  Private
router.put('/:id/attendees', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
], handleValidationErrors, async (req, res) => {
  try {
    const { email, name } = req.body;

    const event = await Event.findOneAndUpdate(
      { 
        _id: req.params.id, 
        userId: req.user._id,
        'attendees.email': { $ne: email } // Don't add if already exists
      },
      { 
        $push: { 
          attendees: { 
            email,
            name,
            status: 'pending'
          }
        }
      },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({
        error: 'Event not found or attendee already exists',
        details: 'Event not found, access denied, or attendee already added'
      });
    }

    res.json({
      message: 'Attendee added successfully',
      event
    });

  } catch (error) {
    console.error('Add attendee error:', error);
    res.status(500).json({
      error: 'Server error',
      details: 'Failed to add attendee'
    });
  }
});

module.exports = router;