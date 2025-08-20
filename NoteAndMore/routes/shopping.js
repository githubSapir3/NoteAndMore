// ===== routes/shopping.js =====
const express = require('express');
const { body, validationResult, query } = require('express-validator');
const mongoose = require('mongoose');

const router = express.Router();

// Shopping List Schema (inline for this example - you can move to models/ShoppingList.js)
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
const validateShoppingList = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Shopping list name is required')
    .isLength({ max: 100 })
    .withMessage('Shopping list name cannot exceed 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date'),
  body('status')
    .optional()
    .isIn(['active', 'completed', 'archived'])
    .withMessage('Status must be active, completed, or archived')
];

const validateItem = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Item name is required')
    .isLength({ max: 100 })
    .withMessage('Item name cannot exceed 100 characters'),
  body('quantity')
    .isFloat({ min: 0.01 })
    .withMessage('Quantity must be greater than 0'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('currency')
    .optional()
    .isIn(['USD', 'EUR', 'ILS', 'GBP'])
    .withMessage('Invalid currency'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high')
];

// @route   GET /api/shopping
// @desc    Get all shopping lists for user
// @access  Private
router.get('/', [
  query('status').optional().isIn(['active', 'completed', 'archived']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
], handleValidationErrors, async (req, res) => {
  try {
    const {
      status = 'active',
      page = 1,
      limit = 20
    } = req.query;

    const filter = { 
      userId: req.user._id,
      status
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [lists, totalLists] = await Promise.all([
      ShoppingList.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      ShoppingList.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalLists / parseInt(limit));

    res.json({
      lists,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalLists,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get shopping lists error:', error);
    res.status(500).json({
      error: 'Server error',
      details: 'Failed to fetch shopping lists'
    });
  }
});

// @route   GET /api/shopping/:id
// @desc    Get single shopping list
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const list = await ShoppingList.findOne({
      _id: req.params.id,
      $or: [
        { userId: req.user._id },
        { 'sharedWith.userId': req.user._id }
      ]
    });

    if (!list) {
      return res.status(404).json({
        error: 'Shopping list not found',
        details: 'Shopping list not found or access denied'
      });
    }

    res.json({ list });

  } catch (error) {
    console.error('Get shopping list error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'Invalid shopping list ID',
        details: 'Please provide a valid shopping list ID'
      });
    }
    res.status(500).json({
      error: 'Server error',
      details: 'Failed to fetch shopping list'
    });
  }
});

// @route   POST /api/shopping
// @desc    Create new shopping list
// @access  Private
router.post('/', validateShoppingList, handleValidationErrors, async (req, res) => {
  try {
    const listData = {
      ...req.body,
      userId: req.user._id
    };

    const list = new ShoppingList(listData);
    await list.save();

    res.status(201).json({
      message: 'Shopping list created successfully',
      list
    });

  } catch (error) {
    console.error('Create shopping list error:', error);
    res.status(500).json({
      error: 'Server error',
      details: 'Failed to create shopping list'
    });
  }
});

// @route   PUT /api/shopping/:id
// @desc    Update shopping list
// @access  Private
router.put('/:id', validateShoppingList, handleValidationErrors, async (req, res) => {
  try {
    const list = await ShoppingList.findOneAndUpdate(
      { 
        _id: req.params.id, 
        $or: [
          { userId: req.user._id },
          { 'sharedWith.userId': req.user._id, 'sharedWith.permission': 'edit' }
        ]
      },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!list) {
      return res.status(404).json({
        error: 'Shopping list not found',
        details: 'Shopping list not found or access denied'
      });
    }

    res.json({
      message: 'Shopping list updated successfully',
      list
    });

  } catch (error) {
    console.error('Update shopping list error:', error);
    res.status(500).json({
      error: 'Server error',
      details: 'Failed to update shopping list'
    });
  }
});

// @route   DELETE /api/shopping/:id
// @desc    Delete shopping list
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const list = await ShoppingList.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id // Only owner can delete
    });

    if (!list) {
      return res.status(404).json({
        error: 'Shopping list not found',
        details: 'Shopping list not found or access denied'
      });
    }

    res.json({
      message: 'Shopping list deleted successfully',
      list
    });

  } catch (error) {
    console.error('Delete shopping list error:', error);
    res.status(500).json({
      error: 'Server error',
      details: 'Failed to delete shopping list'
    });
  }
});

// @route   POST /api/shopping/:id/items
// @desc    Add item to shopping list
// @access  Private
router.post('/:id/items', validateItem, handleValidationErrors, async (req, res) => {
  try {
    const itemData = {
      ...req.body,
      purchased: false,
      purchasedAt: null
    };

    const list = await ShoppingList.findOneAndUpdate(
      { 
        _id: req.params.id,
        $or: [
          { userId: req.user._id },
          { 'sharedWith.userId': req.user._id, 'sharedWith.permission': 'edit' }
        ]
      },
      { $push: { items: itemData } },
      { new: true, runValidators: true }
    );

    if (!list) {
      return res.status(404).json({
        error: 'Shopping list not found',
        details: 'Shopping list not found or access denied'
      });
    }

    res.json({
      message: 'Item added successfully',
      list
    });

  } catch (error) {
    console.error('Add item error:', error);
    res.status(500).json({
      error: 'Server error',
      details: 'Failed to add item'
    });
  }
});

// @route   PUT /api/shopping/:id/items/:itemId
// @desc    Update item in shopping list
// @access  Private
router.put('/:id/items/:itemId', async (req, res) => {
  try {
    const { purchased, quantity, price, notes } = req.body;
    
    const updateData = {};
    if (purchased !== undefined) {
      updateData['items.$.purchased'] = purchased;
      updateData['items.$.purchasedAt'] = purchased ? new Date() : null;
    }
    if (quantity !== undefined) updateData['items.$.quantity'] = quantity;
    if (price !== undefined) updateData['items.$.price'] = price;
    if (notes !== undefined) updateData['items.$.notes'] = notes;

    const list = await ShoppingList.findOneAndUpdate(
      { 
        _id: req.params.id,
        'items._id': req.params.itemId,
        $or: [
          { userId: req.user._id },
          { 'sharedWith.userId': req.user._id, 'sharedWith.permission': 'edit' }
        ]
      },
      { $set: updateData },
      { new: true }
    );

    if (!list) {
      return res.status(404).json({
        error: 'Shopping list or item not found',
        details: 'Shopping list or item not found or access denied'
      });
    }

    res.json({
      message: 'Item updated successfully',
      list
    });

  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({
      error: 'Server error',
      details: 'Failed to update item'
    });
  }
});

// @route   DELETE /api/shopping/:id/items/:itemId
// @desc    Remove item from shopping list
// @access  Private
router.delete('/:id/items/:itemId', async (req, res) => {
  try {
    const list = await ShoppingList.findOneAndUpdate(
      { 
        _id: req.params.id,
        $or: [
          { userId: req.user._id },
          { 'sharedWith.userId': req.user._id, 'sharedWith.permission': 'edit' }
        ]
      },
      { $pull: { items: { _id: req.params.itemId } } },
      { new: true }
    );

    if (!list) {
      return res.status(404).json({
        error: 'Shopping list not found',
        details: 'Shopping list not found or access denied'
      });
    }

    res.json({
      message: 'Item removed successfully',
      list
    });

  } catch (error) {
    console.error('Remove item error:', error);
    res.status(500).json({
      error: 'Server error',
      details: 'Failed to remove item'
    });
  }
});

// @route   PUT /api/shopping/:id/complete
// @desc    Mark shopping list as completed
// @access  Private
router.put('/:id/complete', async (req, res) => {
  try {
    const list = await ShoppingList.findOneAndUpdate(
      { 
        _id: req.params.id,
        userId: req.user._id
      },
      { 
        status: 'completed',
        'items.$[].purchased': true,
        'items.$[].purchasedAt': new Date()
      },
      { new: true }
    );

    if (!list) {
      return res.status(404).json({
        error: 'Shopping list not found',
        details: 'Shopping list not found or access denied'
      });
    }

    res.json({
      message: 'Shopping list marked as completed',
      list
    });

  } catch (error) {
    console.error('Complete shopping list error:', error);
    res.status(500).json({
      error: 'Server error',
      details: 'Failed to complete shopping list'
    });
  }
});

// @route   GET /api/shopping/stats/summary
// @desc    Get shopping statistics
// @access  Private
router.get('/stats/summary', async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await ShoppingList.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalLists: { $sum: 1 },
          activeLists: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          completedLists: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          totalItems: { $sum: { $size: '$items' } },
          purchasedItems: {
            $sum: {
              $size: {
                $filter: {
                  input: '$items',
                  cond: { $eq: ['$$this.purchased', true] }
                }
              }
            }
          },
          totalEstimatedValue: { $sum: '$totalEstimatedPrice' },
          totalActualValue: { $sum: '$actualTotalPrice' }
        }
      }
    ]);

    const result = stats[0] || {
      totalLists: 0,
      activeLists: 0,
      completedLists: 0,
      totalItems: 0,
      purchasedItems: 0,
      totalEstimatedValue: 0,
      totalActualValue: 0
    };

    res.json({ stats: result });

  } catch (error) {
    console.error('Get shopping stats error:', error);
    res.status(500).json({
      error: 'Server error',
      details: 'Failed to fetch shopping statistics'
    });
  }
});

module.exports = router;