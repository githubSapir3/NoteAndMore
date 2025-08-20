// ===== routes/users.js =====
const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');

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

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user.userId || req.user._id);
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        details: 'User profile not found'
      });
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        avatar: user.avatar,
        preferences: user.preferences,
        role: user.role,
        lastLogin: user.lastLogin,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Server error',
      details: 'Failed to get user profile'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  body('firstName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('First name cannot be empty')
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Last name cannot be empty')
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('avatar')
    .optional()
    .isURL()
    .withMessage('Avatar must be a valid URL')
], handleValidationErrors, async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const updates = req.body;

    // Check if username is being updated and if it's already taken
    if (updates.username) {
      const existingUser = await User.findOne({ 
        username: updates.username,
        _id: { $ne: userId }
      });
      
      if (existingUser) {
        return res.status(400).json({
          error: 'Username already exists',
          details: 'This username is already taken'
        });
      }
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        details: 'User account not found'
      });
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        avatar: user.avatar,
        preferences: user.preferences,
        role: user.role,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: 'Server error',
      details: 'Failed to update profile'
    });
  }
});

// @route   PUT /api/users/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', [
  body('theme')
    .optional()
    .isIn(['light', 'dark'])
    .withMessage('Theme must be either light or dark'),
  body('language')
    .optional()
    .isIn(['en', 'he'])
    .withMessage('Language must be either en or he'),
  body('timezone')
    .optional()
    .isString()
    .withMessage('Timezone must be a valid string'),
  body('notifications.email')
    .optional()
    .isBoolean()
    .withMessage('Email notification setting must be a boolean'),
  body('notifications.push')
    .optional()
    .isBoolean()
    .withMessage('Push notification setting must be a boolean'),
  body('notifications.reminders')
    .optional()
    .isBoolean()
    .withMessage('Reminder notification setting must be a boolean')
], handleValidationErrors, async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const { theme, language, timezone, notifications } = req.body;

    const updateData = {};
    if (theme) updateData['preferences.theme'] = theme;
    if (language) updateData['preferences.language'] = language;
    if (timezone) updateData['preferences.timezone'] = timezone;
    
    if (notifications) {
      if (notifications.email !== undefined) updateData['preferences.notifications.email'] = notifications.email;
      if (notifications.push !== undefined) updateData['preferences.notifications.push'] = notifications.push;
      if (notifications.reminders !== undefined) updateData['preferences.notifications.reminders'] = notifications.reminders;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData, updatedAt: new Date() },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        details: 'User account not found'
      });
    }

    res.json({
      message: 'Preferences updated successfully',
      preferences: user.preferences
    });

  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      error: 'Server error',
      details: 'Failed to update preferences'
    });
  }
});

// @route   PUT /api/users/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match');
      }
      return true;
    })
], handleValidationErrors, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId || req.user._id;

    // Get user with password
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        details: 'User account not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        error: 'Invalid password',
        details: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    user.updatedAt = new Date();
    await user.save();

    res.json({
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      error: 'Server error',
      details: 'Failed to change password'
    });
  }
});

// @route   DELETE /api/users/account
// @desc    Deactivate user account
// @access  Private
router.delete('/account', [
  body('password')
    .notEmpty()
    .withMessage('Password is required to deactivate account'),
  body('confirmDeactivation')
    .equals('DEACTIVATE')
    .withMessage('Please type DEACTIVATE to confirm account deactivation')
], handleValidationErrors, async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.userId || req.user._id;

    // Get user with password
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        details: 'User account not found'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        error: 'Invalid password',
        details: 'Password is incorrect'
      });
    }

    // Deactivate account instead of deleting
    user.isActive = false;
    user.updatedAt = new Date();
    await user.save();

    res.json({
      message: 'Account deactivated successfully',
      details: 'Your account has been deactivated and you will be logged out'
    });

  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json({
      error: 'Server error',
      details: 'Failed to deactivate account'
    });
  }
});

// @route   PUT /api/users/reactivate
// @desc    Reactivate user account
// @access  Public (but requires valid credentials)
router.put('/reactivate', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find deactivated user
    const user = await User.findOne({ email, isActive: false });
    if (!user) {
      return res.status(404).json({
        error: 'Account not found',
        details: 'No deactivated account found with this email'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        error: 'Invalid credentials',
        details: 'Email or password is incorrect'
      });
    }

    // Reactivate account
    user.isActive = true;
    user.lastLogin = new Date();
    user.updatedAt = new Date();
    await user.save();

    // Generate new token
    const token = user.generateAuthToken();

    res.json({
      message: 'Account reactivated successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        preferences: user.preferences,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Reactivate account error:', error);
    res.status(500).json({
      error: 'Server error',
      details: 'Failed to reactivate account'
    });
  }
});

// @route   GET /api/users/stats
// @desc    Get user account statistics
// @access  Private
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;

    // This would need to be implemented with the actual models
    // For now, returning basic user info
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        details: 'User account not found'
      });
    }

    const stats = {
      accountAge: Math.floor((new Date() - user.createdAt) / (1000 * 60 * 60 * 24)), // days
      lastLogin: user.lastLogin,
      emailVerified: user.emailVerified,
      totalLogins: 0, // Would need to track this separately
      // These would come from other collections:
      totalTasks: 0,
      completedTasks: 0, 
      totalContacts: 0,
      totalEvents: 0,
      totalShoppingLists: 0
    };

    res.json({ stats });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      error: 'Server error',
      details: 'Failed to get user statistics'
    });
  }
});

module.exports = router;