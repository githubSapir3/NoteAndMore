// ===== models/Task.js =====
const mongoose = require('mongoose');

const subtaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: [200, 'Subtask title cannot exceed 200 characters']
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

const attachmentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  }
}, { timestamps: true });

const taskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [200, 'Task title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Task description cannot exceed 2000 characters']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'cancelled'],
    default: 'pending',
    index: true
  },
  category: {
    type: String,
    default: 'Personal',
    index: true
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  stickers: [{
    type: String,
    trim: true
  }],
  dueDate: {
    type: Date,
    index: true
  },
  completedAt: {
    type: Date,
    default: null
  },
  reminder: {
    enabled: {
      type: Boolean,
      default: false
    },
    datetime: {
      type: Date
    },
    sent: {
      type: Boolean,
      default: false
    }
  },
  attachments: [attachmentSchema],
  subtasks: [subtaskSchema],
  estimatedTime: {
    type: Number, // in minutes
    min: 0
  },
  actualTime: {
    type: Number, // in minutes
    min: 0
  }
}, {
  timestamps: true
});

// Indexes
taskSchema.index({ userId: 1, status: 1 });
taskSchema.index({ userId: 1, dueDate: 1 });
taskSchema.index({ userId: 1, priority: 1 });
taskSchema.index({ userId: 1, category: 1 });
taskSchema.index({ tags: 1 });
taskSchema.index({ createdAt: -1 });

// Virtual for completion percentage
taskSchema.virtual('completionPercentage').get(function() {
  if (this.subtasks.length === 0) {
    return this.status === 'completed' ? 100 : 0;
  }
  
  const completed = this.subtasks.filter(subtask => subtask.completed).length;
  return Math.round((completed / this.subtasks.length) * 100);
});

// Virtual for overdue status
taskSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate || this.status === 'completed') return false;
  return new Date() > this.dueDate;
});

// Pre-save middleware
taskSchema.pre('save', function(next) {
  // Set completedAt when status changes to completed
  if (this.isModified('status')) {
    if (this.status === 'completed' && !this.completedAt) {
      this.completedAt = new Date();
    } else if (this.status !== 'completed') {
      this.completedAt = null;
    }
  }
  
  next();
});

module.exports = mongoose.model('Task', taskSchema);