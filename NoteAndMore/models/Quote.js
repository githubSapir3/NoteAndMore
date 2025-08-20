const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
    default: null // null for system quotes
  },
  text: {
    type: String,
    required: [true, 'Quote text is required'],
    trim: true,
    maxlength: [1000, 'Quote text cannot exceed 1000 characters']
  },
  author: {
    type: String,
    required: [true, 'Author is required'],
    trim: true,
    maxlength: [100, 'Author name cannot exceed 100 characters']
  },
  source: {
    type: String,
    trim: true,
    maxlength: [200, 'Source cannot exceed 200 characters']
  },
  category: {
    type: String,
    enum: ['motivation', 'life', 'work', 'love', 'wisdom', 'success', 'other'],
    default: 'motivation'
  },
  language: {
    type: String,
    enum: ['en', 'he'],
    default: 'en'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  isFavorite: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  usageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  createdBy: {
    type: String,
    enum: ['system', 'user'],
    default: 'user'
  }
}, {
  timestamps: true
});

// Indexes
quoteSchema.index({ category: 1, language: 1 });
quoteSchema.index({ userId: 1 }, { sparse: true });
quoteSchema.index({ isPublic: 1, rating: -1 });
quoteSchema.index({ tags: 1 });

module.exports = mongoose.model('Quote', quoteSchema);