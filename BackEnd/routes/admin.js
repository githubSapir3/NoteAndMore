// ===== routes/admin.js =====
const express = require("express");
const { body, validationResult, query } = require("express-validator");
const User = require("../models/User");
const CommunityEvent = require("../models/CommunityEvent");
const { adminRequired } = require("../middleware/auth");

const router = express.Router();

// Apply admin middleware to all routes
router.use(adminRequired);

// Helper function for validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors.array().map((error) => error.msg),
    });
  }
  next();
};

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     description: Retrieve a list of all users with pagination and filtering.
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [user, premium, admin]
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved users.
 *       403:
 *         description: Admin access required.
 *       500:
 *         description: Server error.
 */
router.get("/users", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      role,
      isActive,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    // Apply filters
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    const users = await User.find(query)
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / parseInt(limit));

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalUsers,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      error: "Server error",
      details: "Failed to get users",
    });
  }
});

/**
 * @swagger
 * /api/admin/users/{userId}:
 *   get:
 *     summary: Get user by ID (Admin only)
 *     description: Retrieve detailed information about a specific user.
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved user.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Server error.
 */
router.get("/users/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');

    if (!user) {
      return res.status(404).json({
        error: "User not found",
        details: "User with this ID does not exist",
      });
    }

    res.json({ user });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      error: "Server error",
      details: "Failed to get user",
    });
  }
});

/**
 * @swagger
 * /api/admin/users/{userId}/role:
 *   put:
 *     summary: Update user role (Admin only)
 *     description: Change the role of a user (user, premium, admin).
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, premium, admin]
 *     responses:
 *       200:
 *         description: User role updated successfully.
 *       400:
 *         description: Validation failed.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Server error.
 */
router.put(
  "/users/:userId/role",
  [
    body("role")
      .isIn(["user", "premium", "admin"])
      .withMessage("Role must be user, premium, or admin"),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { role } = req.body;
      const userId = req.params.userId;

      // Prevent admin from changing their own role
      if (userId === req.user._id.toString()) {
        return res.status(400).json({
          error: "Cannot change own role",
          details: "You cannot change your own role",
        });
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { role, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({
          error: "User not found",
          details: "User with this ID does not exist",
        });
      }

      res.json({
        message: "User role updated successfully",
        user,
      });
    } catch (error) {
      console.error("Update user role error:", error);
      res.status(500).json({
        error: "Server error",
        details: "Failed to update user role",
      });
    }
  }
);

/**
 * @swagger
 * /api/admin/users/{userId}/status:
 *   put:
 *     summary: Toggle user active status (Admin only)
 *     description: Activate or deactivate a user account.
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User status updated successfully.
 *       400:
 *         description: Validation failed.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Server error.
 */
router.put(
  "/users/:userId/status",
  [
    body("isActive")
      .isBoolean()
      .withMessage("isActive must be a boolean"),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { isActive } = req.body;
      const userId = req.params.userId;

      // Prevent admin from deactivating themselves
      if (userId === req.user._id.toString()) {
        return res.status(400).json({
          error: "Cannot deactivate own account",
          details: "You cannot deactivate your own account",
        });
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { isActive, updatedAt: new Date() },
        { new: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({
          error: "User not found",
          details: "User with this ID does not exist",
        });
      }

      res.json({
        message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
        user,
      });
    } catch (error) {
      console.error("Update user status error:", error);
      res.status(500).json({
        error: "Server error",
        details: "Failed to update user status",
      });
    }
  }
);

/**
 * @swagger
 * /api/admin/users/{userId}:
 *   delete:
 *     summary: Delete user (Admin only)
 *     description: Permanently delete a user account.
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully.
 *       400:
 *         description: Cannot delete own account.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Server error.
 */
router.delete("/users/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    // Prevent admin from deleting themselves
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        error: "Cannot delete own account",
        details: "You cannot delete your own account",
      });
    }

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
        details: "User with this ID does not exist",
      });
    }

    res.json({
      message: "User deleted successfully",
      userId: user._id,
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      error: "Server error",
      details: "Failed to delete user",
    });
  }
});

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get admin dashboard statistics (Admin only)
 *     description: Retrieve statistics for the admin dashboard.
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Successfully retrieved statistics.
 *       500:
 *         description: Server error.
 */
router.get("/stats", async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      premiumUsers,
      adminUsers,
      newUsersThisMonth,
      totalEvents
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'premium' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({
        createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
      }),
      CommunityEvent.countDocuments()
    ]);

    const stats = {
      users: {
        total: totalUsers,
        active: activeUsers,
        premium: premiumUsers,
        admin: adminUsers,
        newThisMonth: newUsersThisMonth
      },
      events: {
        total: totalEvents
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version
      }
    };

    res.json({ stats });
  } catch (error) {
    console.error("Get admin stats error:", error);
    res.status(500).json({
      error: "Server error",
      details: "Failed to get admin statistics",
    });
  }
});

/**
 * @swagger
 * /api/admin/events:
 *   post:
 *     summary: Create community event (Admin only)
 *     description: Create a new community event that all users are invited to.
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               time:
 *                 type: string
 *               location:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [meetup, workshop, social, business, other]
 *               maxAttendees:
 *                 type: number
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Community event created successfully.
 *       400:
 *         description: Validation failed.
 *       500:
 *         description: Server error.
 */
router.post(
  "/events",
  [
    body("title")
      .trim()
      .notEmpty()
      .withMessage("Event title is required")
      .isLength({ max: 100 })
      .withMessage("Event title cannot exceed 100 characters"),
    body("description")
      .trim()
      .notEmpty()
      .withMessage("Event description is required")
      .isLength({ max: 1000 })
      .withMessage("Event description cannot exceed 1000 characters"),
    body("date")
      .isISO8601()
      .withMessage("Valid date is required"),
    body("time")
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("Valid time in HH:MM format is required"),
    body("location")
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage("Location cannot exceed 200 characters"),
    body("category")
      .optional()
      .isIn(["meetup", "workshop", "social", "business", "other"])
      .withMessage("Invalid category"),
    body("maxAttendees")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Maximum attendees must be at least 1"),
    body("tags")
      .optional()
      .isArray()
      .withMessage("Tags must be an array"),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const eventData = {
        ...req.body,
        organizer: req.user._id,
        date: new Date(req.body.date)
      };

      const event = new CommunityEvent(eventData);
      await event.save();

      // Populate organizer info
      await event.populate('organizer', 'firstName lastName username avatar');

      res.status(201).json({
        message: "Community event created successfully",
        event,
      });
    } catch (error) {
      console.error("Create community event error:", error);
      res.status(500).json({
        error: "Server error",
        details: "Failed to create community event",
      });
    }
  }
);

/**
 * @swagger
 * /api/admin/events:
 *   get:
 *     summary: Get all community events (Admin only)
 *     description: Retrieve a list of all community events.
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Successfully retrieved events.
 *       500:
 *         description: Server error.
 */
router.get("/events", async (req, res) => {
  try {
    const events = await CommunityEvent.find()
      .populate('organizer', 'firstName lastName username avatar')
      .sort({ date: -1 });

    res.json({ events });
  } catch (error) {
    console.error("Get community events error:", error);
    res.status(500).json({
      error: "Server error",
      details: "Failed to get community events",
    });
  }
});

/**
 * @swagger
 * /api/admin/events/{eventId}:
 *   put:
 *     summary: Update community event (Admin only)
 *     description: Update an existing community event.
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               time:
 *                 type: string
 *               location:
 *                 type: string
 *               category:
 *                 type: string
 *               maxAttendees:
 *                 type: number
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Event updated successfully.
 *       400:
 *         description: Validation failed.
 *       404:
 *         description: Event not found.
 *       500:
 *         description: Server error.
 */
router.put(
  "/events/:eventId",
  [
    body("title")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Event title cannot be empty")
      .isLength({ max: 100 })
      .withMessage("Event title cannot exceed 100 characters"),
    body("description")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Event description cannot be empty")
      .isLength({ max: 1000 })
      .withMessage("Event description cannot exceed 1000 characters"),
    body("date")
      .optional()
      .isISO8601()
      .withMessage("Valid date is required"),
    body("time")
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("Valid time in HH:MM format is required"),
    body("location")
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage("Location cannot exceed 200 characters"),
    body("category")
      .optional()
      .isIn(["meetup", "workshop", "social", "business", "other"])
      .withMessage("Invalid category"),
    body("maxAttendees")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Maximum attendees must be at least 1"),
    body("isActive")
      .optional()
      .isBoolean()
      .withMessage("isActive must be a boolean"),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const eventId = req.params.eventId;
      const updates = req.body;

      if (updates.date) {
        updates.date = new Date(updates.date);
      }

      const event = await CommunityEvent.findByIdAndUpdate(
        eventId,
        { ...updates, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).populate('organizer', 'firstName lastName username avatar');

      if (!event) {
        return res.status(404).json({
          error: "Event not found",
          details: "Community event with this ID does not exist",
        });
      }

      res.json({
        message: "Event updated successfully",
        event,
      });
    } catch (error) {
      console.error("Update community event error:", error);
      res.status(500).json({
        error: "Server error",
        details: "Failed to update community event",
      });
    }
  }
);

/**
 * @swagger
 * /api/admin/events/{eventId}:
 *   delete:
 *     summary: Delete community event (Admin only)
 *     description: Delete a community event.
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event deleted successfully.
 *       404:
 *         description: Event not found.
 *       500:
 *         description: Server error.
 */
router.delete("/events/:eventId", async (req, res) => {
  try {
    const eventId = req.params.eventId;

    const event = await CommunityEvent.findByIdAndDelete(eventId);

    if (!event) {
      return res.status(404).json({
        error: "Event not found",
        details: "Community event with this ID does not exist",
      });
    }

    res.json({
      message: "Event deleted successfully",
      eventId: event._id,
    });
  } catch (error) {
    console.error("Delete community event error:", error);
    res.status(500).json({
      error: "Server error",
      details: "Failed to delete community event",
    });
  }
});

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard overview (Admin only)
 *     description: Retrieve comprehensive statistics and overview for the admin dashboard.
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Successfully retrieved dashboard data.
 *       500:
 *         description: Server error.
 */
router.get("/dashboard", async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      premiumUsers,
      adminUsers,
      newUsersThisMonth,
      newUsersThisWeek,
      totalEvents,
      upcomingEvents,
      userGrowthData
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'premium' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({
        createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
      }),
      User.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }),
      CommunityEvent.countDocuments(),
      CommunityEvent.countDocuments({ 
        date: { $gte: new Date() },
        isActive: true 
      }),
      User.aggregate([
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
        { $limit: 12 }
      ])
    ]);

    const dashboardData = {
      users: {
        total: totalUsers,
        active: activeUsers,
        premium: premiumUsers,
        admin: adminUsers,
        newThisMonth: newUsersThisMonth,
        newThisWeek: newUsersThisWeek,
        growth: userGrowthData
      },
      events: {
        total: totalEvents,
        upcoming: upcomingEvents
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        timestamp: new Date().toISOString()
      }
    };

    res.json({ dashboard: dashboardData });
  } catch (error) {
    console.error("Get admin dashboard error:", error);
    res.status(500).json({
      error: "Server error",
      details: "Failed to get admin dashboard data",
    });
  }
});

/**
 * @swagger
 * /api/admin/users/bulk-actions:
 *   post:
 *     summary: Perform bulk actions on users (Admin only)
 *     description: Perform actions like bulk deactivation, role changes, or deletion on multiple users.
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [activate, deactivate, changeRole, delete]
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               role:
 *                 type: string
 *                 enum: [user, premium, admin]
 *                 description: Required when action is changeRole
 *     responses:
 *       200:
 *         description: Bulk action completed successfully.
 *       400:
 *         description: Validation failed.
 *       500:
 *         description: Server error.
 */
router.post("/users/bulk-actions", [
  body("action").isIn(["activate", "deactivate", "changeRole", "delete"]).withMessage("Invalid action"),
  body("userIds").isArray().withMessage("User IDs must be an array"),
  body("userIds.*").isMongoId().withMessage("Invalid user ID"),
  body("role").optional().isIn(["user", "premium", "admin"]).withMessage("Invalid role")
], handleValidationErrors, async (req, res) => {
  try {
    const { action, userIds, role } = req.body;
    
    // Prevent admin from performing actions on themselves
    const filteredUserIds = userIds.filter(id => id !== req.user._id.toString());
    
    if (filteredUserIds.length === 0) {
      return res.status(400).json({
        error: "No valid users selected",
        details: "Cannot perform actions on yourself"
      });
    }

    let result;
    let message;

    switch (action) {
      case 'activate':
        result = await User.updateMany(
          { _id: { $in: filteredUserIds } },
          { $set: { isActive: true, updatedAt: new Date() } }
        );
        message = `${result.modifiedCount} users activated successfully`;
        break;

      case 'deactivate':
        result = await User.updateMany(
          { _id: { $in: filteredUserIds } },
          { $set: { isActive: false, updatedAt: new Date() } }
        );
        message = `${result.modifiedCount} users deactivated successfully`;
        break;

      case 'changeRole':
        if (!role) {
          return res.status(400).json({
            error: "Role required",
            details: "Role is required when changing user roles"
          });
        }
        result = await User.updateMany(
          { _id: { $in: filteredUserIds } },
          { $set: { role, updatedAt: new Date() } }
        );
        message = `${result.modifiedCount} users' roles changed to ${role} successfully`;
        break;

      case 'delete':
        result = await User.deleteMany({ _id: { $in: filteredUserIds } });
        message = `${result.deletedCount} users deleted successfully`;
        break;
    }

    res.json({
      message,
      action,
      affectedUsers: result.modifiedCount || result.deletedCount || 0
    });
  } catch (error) {
    console.error("Bulk actions error:", error);
    res.status(500).json({
      error: "Server error",
      details: "Failed to perform bulk actions",
    });
  }
});

/**
 * @swagger
 * /api/admin/users/{userId}/usage:
 *   get:
 *     summary: Get user usage statistics (Admin only)
 *     description: Retrieve detailed usage statistics for a specific user.
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User usage statistics retrieved successfully.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Server error.
 */
router.get("/users/:userId/usage", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');

    if (!user) {
      return res.status(404).json({
        error: "User not found",
        details: "User with this ID does not exist",
      });
    }

    const usageStats = {
      userId: user._id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      usage: user.usage,
      premiumFeatures: user.premiumFeatures,
      limits: {
        tasks: user.role === 'user' ? 5 : 'unlimited',
        events: user.role === 'user' ? 5 : 'unlimited',
        contacts: user.role === 'user' ? 5 : 'unlimited',
        shoppingLists: user.role === 'user' ? 5 : 'unlimited',
        categories: user.role === 'user' ? 5 : 'unlimited'
      },
      canCreate: {
        tasks: user.canCreateTask,
        events: user.canCreateEvent,
        contacts: user.canCreateContact,
        shoppingLists: user.canCreateShoppingList,
        categories: user.canCreateCategory
      }
    };

    res.json({ usageStats });
  } catch (error) {
    console.error("Get user usage error:", error);
    res.status(500).json({
      error: "Server error",
      details: "Failed to get user usage statistics",
    });
  }
});

/**
 * @swagger
 * /api/admin/users/{userId}/reset-usage:
 *   post:
 *     summary: Reset user usage counters (Admin only)
 *     description: Reset the usage counters for a specific user.
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               resetType:
 *                 type: string
 *                 enum: [all, tasks, events, contacts, shoppingLists, categories]
 *                 description: Type of usage to reset
 *     responses:
 *       200:
 *         description: Usage reset successfully.
 *       400:
 *         description: Validation failed.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Server error.
 */
router.post("/users/:userId/reset-usage", [
  body("resetType").isIn(["all", "tasks", "events", "contacts", "shoppingLists", "categories"]).withMessage("Invalid reset type")
], handleValidationErrors, async (req, res) => {
  try {
    const { resetType } = req.body;
    const userId = req.params.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: "User not found",
        details: "User with this ID does not exist",
      });
    }

    if (resetType === 'all') {
      user.usage = {
        tasks: 0,
        events: 0,
        contacts: 0,
        shoppingLists: 0,
        categories: 0
      };
    } else {
      user.usage[resetType] = 0;
    }

    await user.save();

    res.json({
      message: `Usage for ${resetType === 'all' ? 'all categories' : resetType} reset successfully`,
      user: {
        id: user._id,
        email: user.email,
        usage: user.usage
      }
    });
  } catch (error) {
    console.error("Reset usage error:", error);
    res.status(500).json({
      error: "Server error",
      details: "Failed to reset user usage",
    });
  }
});

module.exports = router;
