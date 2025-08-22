// ===== models/ShoppingList.js =====
const mongoose = require('mongoose');

const shoppingListSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Shopping list name is required'],
    trim: true,
    maxlength: [100, 'Shopping list name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  items: [{
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
      maxlength: [100, 'Item name cannot exceed 100 characters']
    },
    quantity: {
      type: Number,
      required: true,
      min: [0.01, 'Quantity must be greater than 0'],
      default: 1
    },
    unit: {
      type: String,
      trim: true,
      maxlength: [20, 'Unit cannot exceed 20 characters'],
      default: 'piece'
    },
    category: {
      type: String,
      trim: true,
      maxlength: [50, 'Category cannot exceed 50 characters'],
      default: 'General'
    },
    price: {
      type: Number,
      min: 0,
      default: 0
    },
    currency: {
      type: String,
      enum: ['USD', 'EUR', 'ILS', 'GBP'],
      default: 'ILS'
    },
    purchased: {
      type: Boolean,
      default: false
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [200, 'Notes cannot exceed 200 characters']
    },
    purchasedAt: {
      type: Date,
      default: null
    },
    stickers: [{
      type: String,
      trim: true
    }],
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  }],
  totalEstimatedPrice: {
    type: Number,
    min: 0,
    default: 0
  },
  actualTotalPrice: {
    type: Number,
    min: 0,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'archived'],
    default: 'active',
    index: true
  },
  sharedWith: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['view', 'edit'],
      default: 'view'
    },
    invitedAt: {
      type: Date,
      default: Date.now
    }
  }],
  dueDate: {
    type: Date
  },
  store: {
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Store name cannot exceed 100 characters']
    },
    address: {
      type: String,
      trim: true,
      maxlength: [200, 'Store address cannot exceed 200 characters']
    },
    category: {
      type: String,
      enum: ['supermarket', 'pharmacy', 'clothing', 'electronics', 'other'],
      default: 'supermarket'
    }
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }]
}, {
  timestamps: true
});

// Indexes
shoppingListSchema.index({ userId: 1, status: 1 });
shoppingListSchema.index({ userId: 1, createdAt: -1 });
shoppingListSchema.index({ 'items.category': 1 });

// Virtual for completion percentage
shoppingListSchema.virtual('completionPercentage').get(function() {
  if (this.items.length === 0) return 0;
  const purchasedItems = this.items.filter(item => item.purchased).length;
  return Math.round((purchasedItems / this.items.length) * 100);
});

// Virtual for remaining items count
shoppingListSchema.virtual('remainingItems').get(function() {
  return this.items.filter(item => !item.purchased).length;
});

// Pre-save middleware to calculate totals
shoppingListSchema.pre('save', function(next) {
  // Calculate estimated total
  this.totalEstimatedPrice = this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);

  // Calculate actual total (only purchased items)
  this.actualTotalPrice = this.items
    .filter(item => item.purchased)
    .reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);

  next();
});

const ShoppingList = mongoose.model('ShoppingList', shoppingListSchema);

module.exports = ShoppingList;