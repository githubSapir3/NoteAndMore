// ===== models/CommunityEvent.js =====
const mongoose = require('mongoose');

const communityEventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [100, 'Event title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    trim: true,
    maxlength: [1000, 'Event description cannot exceed 1000 characters']
  },
  date: {
    type: Date,
    required: [true, 'Event date is required']
  },
  time: {
    type: String,
    required: [true, 'Event time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time in HH:MM format']
  },
  location: {
    type: String,
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Event organizer is required']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  maxAttendees: {
    type: Number,
    min: [1, 'Maximum attendees must be at least 1'],
    default: null // null means unlimited
  },
  attendees: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['going', 'maybe', 'not-going'],
      default: 'going'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  category: {
    type: String,
    enum: ['meetup', 'workshop', 'social', 'business', 'other'],
    default: 'other'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, 'Tag cannot exceed 20 characters']
  }],
  image: {
    type: String,
    default: null
  },
  // Event settings
  settings: {
    allowComments: {
      type: Boolean,
      default: true
    },
    requireRSVP: {
      type: Boolean,
      default: false
    },
    isPublic: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Indexes
communityEventSchema.index({ date: 1 });
communityEventSchema.index({ organizer: 1 });
communityEventSchema.index({ isActive: 1 });
communityEventSchema.index({ category: 1 });
communityEventSchema.index({ 'attendees.user': 1 });

// Virtual for event status
communityEventSchema.virtual('status').get(function() {
  const now = new Date();
  const eventDate = new Date(this.date);
  
  if (eventDate < now) return 'past';
  if (eventDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000) return 'today';
  if (eventDate.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000) return 'this-week';
  return 'upcoming';
});

// Virtual for attendee count
communityEventSchema.virtual('attendeeCount').get(function() {
  return this.attendees.filter(attendee => attendee.status === 'going').length;
});

// Virtual for available spots
communityEventSchema.virtual('availableSpots').get(function() {
  if (!this.maxAttendees) return 'unlimited';
  return Math.max(0, this.maxAttendees - this.attendeeCount);
});

// Method to add attendee
communityEventSchema.methods.addAttendee = function(userId, status = 'going') {
  // Check if user is already an attendee
  const existingAttendee = this.attendees.find(
    attendee => attendee.user.toString() === userId.toString()
  );
  
  if (existingAttendee) {
    existingAttendee.status = status;
    existingAttendee.joinedAt = new Date();
  } else {
    // Check if event is full
    if (this.maxAttendees && this.attendeeCount >= this.maxAttendees) {
      throw new Error('Event is full');
    }
    
    this.attendees.push({
      user: userId,
      status,
      joinedAt: new Date()
    });
  }
  
  return this.save();
};

// Method to remove attendee
communityEventSchema.methods.removeAttendee = function(userId) {
  this.attendees = this.attendees.filter(
    attendee => attendee.user.toString() !== userId.toString()
  );
  return this.save();
};

// Method to update attendee status
communityEventSchema.methods.updateAttendeeStatus = function(userId, status) {
  const attendee = this.attendees.find(
    attendee => attendee.user.toString() === userId.toString()
  );
  
  if (attendee) {
    attendee.status = status;
    attendee.joinedAt = new Date();
    return this.save();
  }
  
  throw new Error('Attendee not found');
};

// Static method to get upcoming events
communityEventSchema.statics.getUpcomingEvents = function() {
  return this.find({
    date: { $gte: new Date() },
    isActive: true
  }).populate('organizer', 'firstName lastName username avatar')
    .sort({ date: 1 });
};

// Static method to get events by category
communityEventSchema.statics.getEventsByCategory = function(category) {
  return this.find({
    category,
    isActive: true
  }).populate('organizer', 'firstName lastName username avatar')
    .sort({ date: 1 });
};

// Remove password from JSON output
communityEventSchema.methods.toJSON = function() {
  const event = this.toObject();
  return event;
};

module.exports = mongoose.model('CommunityEvent', communityEventSchema);
