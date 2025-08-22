// ===== models/Event.js =====
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
      maxlength: [200, "Event title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Event description cannot exceed 2000 characters"],
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
      index: true,
    },
    endDate: {
      type: Date,
      validate: {
        validator: function (value) {
          return !value || value >= this.startDate;
        },
        message: "End date must be after start date",
      },
    },
    allDay: {
      type: Boolean,
      default: false,
    },
    location: {
      name: {
        type: String,
        trim: true,
        maxlength: [200, "Location name cannot exceed 200 characters"],
      },
      address: {
        type: String,
        trim: true,
        maxlength: [500, "Address cannot exceed 500 characters"],
      },
      coordinates: {
        lat: { type: Number, min: -90, max: 90 },
        lng: { type: Number, min: -180, max: 180 },
      },
    },
    recurrence: {
      type: {
        type: String,
        enum: ["none", "daily", "weekly", "monthly", "yearly"],
        default: "none",
      },
      interval: {
        type: Number,
        min: 1,
        default: 1,
      },
      endDate: Date,
      daysOfWeek: [
        {
          type: Number,
          min: 0,
          max: 6,
        },
      ],
    },
    reminders: [
      {
        type: {
          type: String,
          enum: ["notification", "email", "sms"],
          default: "notification",
        },
        minutesBefore: {
          type: Number,
          min: 0,
          default: 15,
        },
        sent: {
          type: Boolean,
          default: false,
        },
      },
    ],
    attendees: [
      {
        email: {
          type: String,
          trim: true,
          lowercase: true,
        },
        name: {
          type: String,
          trim: true,
        },
        status: {
          type: String,
          enum: ["pending", "accepted", "declined"],
          default: "pending",
        },
      },
    ],
    color: {
      type: String,
      default: "#3174ad",
      match: [/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color"],
    },
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled"],
      default: "scheduled",
    },
    category: {
      type: String,
      default: "General",
      maxlength: [50, "Category cannot exceed 50 characters"],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
eventSchema.index({ userId: 1, startDate: 1 });
eventSchema.index({ userId: 1, endDate: 1 });
eventSchema.index({ userId: 1, category: 1 });

// Virtual for duration calculation
eventSchema.virtual('duration').get(function() {
  if (this.endDate && this.startDate) {
    return Math.abs(this.endDate - this.startDate) / (1000 * 60 * 60); // hours
  }
  return null;
});

// Virtual for checking if event is upcoming
eventSchema.virtual('isUpcoming').get(function() {
  return this.startDate > new Date() && this.status === 'scheduled';
});

// Virtual for checking if event is ongoing
eventSchema.virtual('isOngoing').get(function() {
  const now = new Date();
  return this.startDate <= now && 
         (!this.endDate || this.endDate >= now) && 
         this.status === 'scheduled';
});

// Virtual for checking if event is overdue
eventSchema.virtual('isOverdue').get(function() {
  const now = new Date();
  return this.endDate ? this.endDate < now && this.status === 'scheduled' : false;
});

// Pre-save middleware
eventSchema.pre('save', function(next) {
  // Set default end date to 1 hour after start if not provided
  if (this.startDate && !this.endDate && !this.allDay) {
    this.endDate = new Date(this.startDate.getTime() + 60 * 60 * 1000);
  }
  
  // For all-day events, set times appropriately
  if (this.allDay) {
    if (this.startDate) {
      this.startDate.setHours(0, 0, 0, 0);
    }
    if (this.endDate) {
      this.endDate.setHours(23, 59, 59, 999);
    }
  }
  
  next();
});

// Instance method to add attendee
eventSchema.methods.addAttendee = function(email, name) {
  const existingAttendee = this.attendees.find(a => a.email === email);
  if (!existingAttendee) {
    this.attendees.push({ email, name, status: 'pending' });
  }
  return this;
};

// Instance method to update attendee status
eventSchema.methods.updateAttendeeStatus = function(email, status) {
  const attendee = this.attendees.find(a => a.email === email);
  if (attendee) {
    attendee.status = status;
  }
  return this;
};

// Static method to find upcoming events for user
eventSchema.statics.findUpcoming = function(userId, days = 7) {
  const now = new Date();
  const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  
  return this.find({
    userId,
    status: 'scheduled',
    startDate: {
      $gte: now,
      $lte: futureDate
    }
  }).sort({ startDate: 1 });
};

// Static method to find events for specific month
eventSchema.statics.findByMonth = function(userId, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  
  return this.find({
    userId,
    status: 'scheduled',
    $or: [
      {
        startDate: {
          $gte: startDate,
          $lte: endDate
        }
      },
      {
        startDate: { $lt: startDate },
        endDate: { $gte: startDate }
      }
    ]
  }).sort({ startDate: 1 });
};

module.exports = mongoose.model('Event', eventSchema);