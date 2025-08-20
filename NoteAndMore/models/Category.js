// ===== models/Category.js =====
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
    default: null // null for system categories
  },
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },
  type: {
    type: String,
    enum: ['task', 'event', 'contact', 'shopping', 'general'],
    required: true,
    default: 'general'
  },
  color: {
    type: String,
    default: '#3174ad',
    match: [/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color']
  },
  icon: {
    type: String,
    default: '📋',
    maxlength: [10, 'Icon cannot exceed 10 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  usageCount: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Indexes
categorySchema.index({ userId: 1, type: 1 });
categorySchema.index({ type: 1, isDefault: 1 });
categorySchema.index({ userId: 1, sortOrder: 1 });

module.exports = mongoose.model('Category', categorySchema);