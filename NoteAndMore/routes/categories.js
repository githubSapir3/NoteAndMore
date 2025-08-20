
// ===== routes/categories.js =====

const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Category = require('../models/Category');

const router = express.Router();

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
const validateCategory = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ max: 50 })
    .withMessage('Category name cannot exceed 50 characters'),
  body('type')
    .isIn(['task', 'event', 'contact', 'shopping', 'general'])
    .withMessage('Invalid category type'),
  body('color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color must be a valid hex color'),
  body('icon')
    .optional()
    .isLength({ max: 10 })
    .withMessage('Icon cannot exceed 10 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description cannot exceed 200 characters')
];

// @route   GET /api/categories
// @desc    Get all categories for user
// @access  Private
router.get('/', [
  query('type').optional().isIn(['task', 'event', 'contact', 'shopping', 'general']),
  query('defaults').optional().isBoolean()
], handleValidationErrors, async (req, res) => {
  try {
    const { type, defaults } = req.query;

    // Build filter
    const filter = {
      $or: [
        { userId: req.user._id || req.user.userId },
        { isDefault: true, userId: null }
      ]
    };

    if (type) filter.type = type;
    if (defaults === 'true') filter.isDefault = true;

    const categories = await Category.find(filter)
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    res.json({ categories });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      error: 'Server error',
      details: 'Failed to fetch categories'
    });
  }
});

// @route   GET /api/categories/:id
// @desc    Get single category
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      $or: [
        { userId: req.user._id || req.user.userId },
        { isDefault: true, userId: null }
      ]
    });

    if (!category) {
      return res.status(404).json({
        error: 'Category not found',
        details: 'Category not found or access denied'
      });
    }

    res.json({ category });

  } catch (error) {
    console.error('Get category error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'Invalid category ID',
        details: 'Please provide a valid category ID'
      });
    }
    res.status(500).json({
      error: 'Server error',
      details: 'Failed to fetch category'
    });
  }
});

// @route   POST /api/categories
// @desc    Create new category
// @access  Private
router.post('/', validateCategory, handleValidationErrors, async (req, res) => {
  try {
    // Check if category with same name and type exists for user
    const existingCategory = await Category.findOne({
      userId: req.user._id || req.user.userId,
      name: req.body.name,
      type: req.body.type
    });

    if (existingCategory) {
      return res.status(400).json({
        error: 'Category already exists',
        details: 'A category with this name and type already exists'
      });
    }

    const categoryData = {
      ...req.body,
      userId: req.user._id || req.user.userId,
      isDefault: false
    };

    const category = new Category(categoryData);
    await category.save();

    res.status(201).json({
      message: 'Category created successfully',
      category
    });

  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      error: 'Server error',
      details: 'Failed to create category'
    });
  }
});

// @route   PUT /api/categories/:id
// @desc    Update category
// @access  Private
router.put('/:id', validateCategory, handleValidationErrors, async (req, res) => {
  try {
    // Only allow updating user-created categories
    const category = await Category.findOneAndUpdate(
      { 
        _id: req.params.id, 
        userId: req.user._id || req.user.userId,
        isDefault: false
      },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        error: 'Category not found',
        details: 'Category not found, access denied, or cannot modify default category'
      });
    }

    res.json({
      message: 'Category updated successfully',
      category
    });

  } catch (error) {
    console.error('Update category error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'Invalid category ID',
        details: 'Please provide a valid category ID'
      });
    }
    res.status(500).json({
      error: 'Server error',
      details: 'Failed to update category'
    });
  }
});

// @route   DELETE /api/categories/:id
// @desc    Delete category
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    // Only allow deleting user-created categories
    const category = await Category.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id || req.user.userId,
      isDefault: false
    });

    if (!category) {
      return res.status(404).json({
        error: 'Category not found',
        details: 'Category not found, access denied, or cannot delete default category'
      });
    }

    res.json({
      message: 'Category deleted successfully',
      category
    });

  } catch (error) {
    console.error('Delete category error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'Invalid category ID',
        details: 'Please provide a valid category ID'
      });
    }
    res.status(500).json({
      error: 'Server error',
      details: 'Failed to delete category'
    });
  }
});

// @route   PUT /api/categories/reorder
// @desc    Reorder categories
// @access  Private
router.put('/reorder', [
  body('categories')
    .isArray()
    .withMessage('Categories must be an array'),
  body('categories.*.id')
    .isMongoId()
    .withMessage('Invalid category ID'),
  body('categories.*.sortOrder')
    .isInt({ min: 0 })
    .withMessage('Sort order must be a non-negative integer')
], handleValidationErrors, async (req, res) => {
  try {
    const { categories } = req.body;
    const userId = req.user._id || req.user.userId;

    // Update sort order for each category
    const updatePromises = categories.map(({ id, sortOrder }) =>
      Category.findOneAndUpdate(
        { 
          _id: id, 
          userId,
          isDefault: false 
        },
        { sortOrder },
        { new: true }
      )
    );

    const updatedCategories = await Promise.all(updatePromises);

    // Filter out null results (categories that couldn't be updated)
    const validUpdates = updatedCategories.filter(cat => cat !== null);

    res.json({
      message: 'Categories reordered successfully',
      categories: validUpdates
    });

  } catch (error) {
    console.error('Reorder categories error:', error);
    res.status(500).json({
      error: 'Server error',
      details: 'Failed to reorder categories'
    });
  }
});

// @route   GET /api/categories/stats
// @desc    Get category usage statistics
// @access  Private
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user._id || req.user.userId;

    const stats = await Category.aggregate([
      {
        $match: {
          $or: [
            { userId },
            { isDefault: true, userId: null }
          ]
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: 1 },
          userCreated: {
            $sum: { $cond: [{ $eq: ['$userId', userId] }, 1, 0] }
          },
          defaults: {
            $sum: { $cond: [{ $eq: ['$isDefault', true] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({ stats });

  } catch (error) {
    console.error('Get category stats error:', error);
    res.status(500).json({
      error: 'Server error',
      details: 'Failed to fetch category statistics'
    });
  }
});

module.exports = router;