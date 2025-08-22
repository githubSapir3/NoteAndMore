// ===== routes/tasks.js =====
const express = require("express");
const { body, validationResult, query } = require("express-validator");
const Task = require("../models/Task");

const router = express.Router();

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
 * /api/tasks:
 *   get:
 *     summary: Get all tasks for user
 *     description: Fetch all tasks with filters, pagination, and sorting.
 *     tags: [Tasks]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number (default 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Results per page (default 20, max 100)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in-progress, completed, cancelled]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, dueDate, title, priority]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: List of tasks with pagination
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Get a single task
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task found
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
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
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *               status:
 *                 type: string
 *                 enum: [pending, in-progress, completed, cancelled]
 *               category:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               stickers:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Task created successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Update a task
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Fields to update
 *     responses:
 *       200:
 *         description: Task updated successfully
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Delete a task
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/tasks/{id}/complete:
 *   put:
 *     summary: Mark task as completed
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task marked as completed
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/tasks/{id}/subtasks:
 *   put:
 *     summary: Add a subtask
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
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
 *     responses:
 *       200:
 *         description: Subtask added successfully
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/tasks/{id}/subtasks/{subtaskId}:
 *   put:
 *     summary: Update a subtask
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: subtaskId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               completed:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Subtask updated successfully
 *       404:
 *         description: Task or subtask not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/tasks/stats/summary:
 *   get:
 *     summary: Get task statistics
 *     tags: [Tasks]
 *     responses:
 *       200:
 *         description: Task statistics summary
 *       500:
 *         description: Server error
 */

// Validation rules
const validateTask = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Task title is required")
    .isLength({ max: 200 })
    .withMessage("Task title cannot exceed 200 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Task description cannot exceed 2000 characters"),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high"])
    .withMessage("Priority must be low, medium, or high"),
  body("status")
    .optional()
    .isIn(["pending", "in-progress", "completed", "cancelled"])
    .withMessage(
      "Status must be pending, in-progress, completed, or cancelled"
    ),
  body("category")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Category cannot exceed 50 characters"),
  body("dueDate")
    .optional()
    .isISO8601()
    .withMessage("Due date must be a valid date"),
  body("tags").optional().isArray().withMessage("Tags must be an array"),
  body("tags.*")
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage("Each tag cannot exceed 30 characters"),
  body("stickers")
    .optional()
    .isArray()
    .withMessage("Stickers must be an array"),
];

// Validation rules for updating tasks (all fields optional)
const validateTaskUpdate = [
  body("title")
    .optional()  
    .trim()
    .notEmpty()
    .withMessage("Task title cannot be empty")
    .isLength({ max: 200 })
    .withMessage("Task title cannot exceed 200 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Task description cannot exceed 2000 characters"),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high"])
    .withMessage("Priority must be low, medium, or high"),
  body("status")
    .optional()
    .isIn(["pending", "in-progress", "completed", "cancelled"])
    .withMessage("Status must be pending, in-progress, completed, or cancelled"),
  body("category")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Category cannot exceed 50 characters"),
  body("dueDate")
    .optional()
    .isISO8601()
    .withMessage("Due date must be a valid date"),
  body("tags").optional().isArray().withMessage("Tags must be an array"),
  body("tags.*")
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage("Each tag cannot exceed 30 characters"),
  body("stickers")
    .optional()
    .isArray()
    .withMessage("Stickers must be an array"),
];

// @route   GET /api/tasks
// @desc    Get all tasks for user with filtering and pagination
// @access  Private
router.get(
  "/",
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
    query("status")
      .optional()
      .isIn(["pending", "in-progress", "completed", "cancelled"]),
    query("priority").optional().isIn(["low", "medium", "high"]),
    query("category").optional().trim(),
    query("search").optional().trim(),
    query("sortBy")
      .optional()
      .isIn(["createdAt", "dueDate", "title", "priority"]),
    query("sortOrder").optional().isIn(["asc", "desc"]),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        priority,
        category,
        search,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      // Build filter object
      const filter = { userId: req.user._id };

      if (status) filter.status = status;
      if (priority) filter.priority = priority;
      if (category) filter.category = new RegExp(category, "i");

      if (search) {
        filter.$or = [
          { title: new RegExp(search, "i") },
          { description: new RegExp(search, "i") },
          { tags: { $in: [new RegExp(search, "i")] } },
        ];
      }

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === "asc" ? 1 : -1;

      // Execute query with pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [tasks, totalTasks] = await Promise.all([
        Task.find(filter).sort(sort).skip(skip).limit(parseInt(limit)).lean(),
        Task.countDocuments(filter),
      ]);

      // Calculate pagination info
      const totalPages = Math.ceil(totalTasks / parseInt(limit));
      const hasNextPage = parseInt(page) < totalPages;
      const hasPrevPage = parseInt(page) > 1;

      res.json({
        tasks,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalTasks,
          hasNextPage,
          hasPrevPage,
          limit: parseInt(limit),
        },
        filters: {
          status,
          priority,
          category,
          search,
        },
      });
    } catch (error) {
      console.error("Get tasks error:", error);
      res.status(500).json({
        error: "Server error",
        details: "Failed to fetch tasks",
      });
    }
  }
);

// @route   GET /api/tasks/:id
// @desc    Get single task
// @access  Private
router.get("/:id", async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!task) {
      return res.status(404).json({
        error: "Task not found",
        details: "Task not found or access denied",
      });
    }

    res.json({ task });
  } catch (error) {
    console.error("Get task error:", error);
    if (error.name === "CastError") {
      return res.status(400).json({
        error: "Invalid task ID",
        details: "Please provide a valid task ID",
      });
    }
    res.status(500).json({
      error: "Server error",
      details: "Failed to fetch task",
    });
  }
});

// @route   POST /api/tasks
// @desc    Create new task
// @access  Private
router.post("/", validateTask, handleValidationErrors, async (req, res) => {
  try {
    const taskData = {
      ...req.body,
      userId: req.user._id,
    };

    const task = new Task(taskData);
    await task.save();

    res.status(201).json({
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json({
      error: "Server error",
      details: "Failed to create task",
    });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update task
// @access  Private
router.put("/:id", validateTaskUpdate, handleValidationErrors, async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({
        error: "Task not found",
        details: "Task not found or access denied",
      });
    }

    res.json({
      message: "Task updated successfully",
      task,
    });
  } catch (error) {
    console.error("Update task error:", error);
    if (error.name === "CastError") {
      return res.status(400).json({
        error: "Invalid task ID",
        details: "Please provide a valid task ID",
      });
    }
    res.status(500).json({
      error: "Server error",
      details: "Failed to update task",
    });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete task
// @access  Private
router.delete("/:id", async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!task) {
      return res.status(404).json({
        error: "Task not found",
        details: "Task not found or access denied",
      });
    }

    res.json({
      message: "Task deleted successfully",
      task,
    });
  } catch (error) {
    console.error("Delete task error:", error);
    if (error.name === "CastError") {
      return res.status(400).json({
        error: "Invalid task ID",
        details: "Please provide a valid task ID",
      });
    }
    res.status(500).json({
      error: "Server error",
      details: "Failed to delete task",
    });
  }
});

// @route   PUT /api/tasks/:id/complete
// @desc    Mark task as completed
// @access  Private
router.put("/:id/complete", async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      {
        status: "completed",
        completedAt: new Date(),
      },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({
        error: "Task not found",
        details: "Task not found or access denied",
      });
    }

    res.json({
      message: "Task marked as completed",
      task,
    });
  } catch (error) {
    console.error("Complete task error:", error);
    res.status(500).json({
      error: "Server error",
      details: "Failed to complete task",
    });
  }
});

// @route   PUT /api/tasks/:id/subtasks
// @desc    Add subtask
// @access  Private
router.put(
  "/:id/subtasks",
  [
    body("title")
      .trim()
      .notEmpty()
      .withMessage("Subtask title is required")
      .isLength({ max: 200 })
      .withMessage("Subtask title cannot exceed 200 characters"),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { title } = req.body;

      const task = await Task.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        {
          $push: {
            subtasks: {
              title,
              completed: false,
              createdAt: new Date(),
            },
          },
        },
        { new: true }
      );

      if (!task) {
        return res.status(404).json({
          error: "Task not found",
          details: "Task not found or access denied",
        });
      }

      res.json({
        message: "Subtask added successfully",
        task,
      });
    } catch (error) {
      console.error("Add subtask error:", error);
      res.status(500).json({
        error: "Server error",
        details: "Failed to add subtask",
      });
    }
  }
);

// @route   PUT /api/tasks/:id/subtasks/:subtaskId
// @desc    Update subtask
// @access  Private
router.put("/:id/subtasks/:subtaskId", async (req, res) => {
  try {
    const { completed } = req.body;

    const task = await Task.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user._id,
        "subtasks._id": req.params.subtaskId,
      },
      {
        $set: {
          "subtasks.$.completed": completed,
          "subtasks.$.completedAt": completed ? new Date() : null,
        },
      },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({
        error: "Task or subtask not found",
        details: "Task or subtask not found or access denied",
      });
    }

    res.json({
      message: "Subtask updated successfully",
      task,
    });
  } catch (error) {
    console.error("Update subtask error:", error);
    res.status(500).json({
      error: "Server error",
      details: "Failed to update subtask",
    });
  }
});

// @route   GET /api/tasks/stats/summary
// @desc    Get task statistics
// @access  Private
router.get("/stats/summary", async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await Task.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          pending: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0] },
          },
          highPriority: {
            $sum: { $cond: [{ $eq: ["$priority", "high"] }, 1, 0] },
          },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$dueDate", null] },
                    { $lt: ["$dueDate", new Date()] },
                    { $ne: ["$status", "completed"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const result = stats[0] || {
      total: 0,
      completed: 0,
      pending: 0,
      inProgress: 0,
      highPriority: 0,
      overdue: 0,
    };

    res.json({ stats: result });
  } catch (error) {
    console.error("Get task stats error:", error);
    res.status(500).json({
      error: "Server error",
      details: "Failed to fetch task statistics",
    });
  }
});

module.exports = router;
