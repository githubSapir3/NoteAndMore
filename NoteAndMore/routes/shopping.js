// ===== routes/shopping.js =====
const express = require("express");
const { body, validationResult, query } = require("express-validator");
const ShoppingList = require("../models/ShoppingList");

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

// Validation rules
const validateShoppingList = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Shopping list name is required")
    .isLength({ max: 100 })
    .withMessage("Shopping list name cannot exceed 100 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
  body("dueDate")
    .optional()
    .isISO8601()
    .withMessage("Due date must be a valid date"),
  body("status")
    .optional()
    .isIn(["active", "completed", "archived"])
    .withMessage("Status must be active, completed, or archived"),
];

const validateItem = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Item name is required")
    .isLength({ max: 100 })
    .withMessage("Item name cannot exceed 100 characters"),
  body("quantity")
    .isFloat({ min: 0.01 })
    .withMessage("Quantity must be greater than 0"),
  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("currency")
    .optional()
    .isIn(["USD", "EUR", "ILS", "GBP"])
    .withMessage("Invalid currency"),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high"])
    .withMessage("Priority must be low, medium, or high"),
];

/**
 * @swagger
 * /api/shopping:
 *   get:
 *     summary: Get all shopping lists for the authenticated user
 *     tags:
 *       - Shopping
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed, archived]
 *         description: Filter lists by status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: A paginated list of shopping lists
 *       400:
 *         description: Validation error for query params
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  "/",
  [
    query("status").optional().isIn(["active", "completed", "archived"]),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 50 }),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { status = "active", page = 1, limit = 20 } = req.query;

      const filter = {
        userId: req.user._id,
        status,
      };

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [lists, totalLists] = await Promise.all([
        ShoppingList.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        ShoppingList.countDocuments(filter),
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
          limit: parseInt(limit),
        },
      });
    } catch (error) {
      console.error("Get shopping lists error:", error);
      res.status(500).json({
        error: "Server error",
        details: "Failed to fetch shopping lists",
      });
    }
  }
);

/**
 * @swagger
 * /api/shopping/{id}:
 *   get:
 *     summary: Get a single shopping list by id
 *     tags:
 *       - Shopping
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shopping list id
 *     responses:
 *       200:
 *         description: Shopping list object
 *       400:
 *         description: Invalid shopping list ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Shopping list not found or access denied
 *       500:
 *         description: Server error
 */
router.get("/:id", async (req, res) => {
  try {
    const list = await ShoppingList.findOne({
      _id: req.params.id,
      $or: [{ userId: req.user._id }, { "sharedWith.userId": req.user._id }],
    });

    if (!list) {
      return res.status(404).json({
        error: "Shopping list not found",
        details: "Shopping list not found or access denied",
      });
    }

    res.json({ list });
  } catch (error) {
    console.error("Get shopping list error:", error);
    if (error.name === "CastError") {
      return res.status(400).json({
        error: "Invalid shopping list ID",
        details: "Please provide a valid shopping list ID",
      });
    }
    res.status(500).json({
      error: "Server error",
      details: "Failed to fetch shopping list",
    });
  }
});

/**
 * @swagger
 * /api/shopping:
 *   post:
 *     summary: Create a new shopping list
 *     tags:
 *       - Shopping
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [active, completed, archived]
 *     responses:
 *       201:
 *         description: Shopping list created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post(
  "/",
  validateShoppingList,
  handleValidationErrors,
  async (req, res) => {
    try {
      const listData = {
        ...req.body,
        userId: req.user._id,
      };

      const list = new ShoppingList(listData);
      await list.save();

      res.status(201).json({
        message: "Shopping list created successfully",
        list,
      });
    } catch (error) {
      console.error("Create shopping list error:", error);
      res.status(500).json({
        error: "Server error",
        details: "Failed to create shopping list",
      });
    }
  }
);

/**
 * @swagger
 * /api/shopping/{id}:
 *   put:
 *     summary: Update an existing shopping list
 *     tags:
 *       - Shopping
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shopping list id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [active, completed, archived]
 *     responses:
 *       200:
 *         description: Shopping list updated
 *       400:
 *         description: Validation error or invalid id
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Shopping list not found or access denied
 *       500:
 *         description: Server error
 */
router.put(
  "/:id",
  validateShoppingList,
  handleValidationErrors,
  async (req, res) => {
    try {
      const list = await ShoppingList.findOneAndUpdate(
        {
          _id: req.params.id,
          $or: [
            { userId: req.user._id },
            {
              "sharedWith.userId": req.user._id,
              "sharedWith.permission": "edit",
            },
          ],
        },
        { $set: req.body },
        { new: true, runValidators: true }
      );

      if (!list) {
        return res.status(404).json({
          error: "Shopping list not found",
          details: "Shopping list not found or access denied",
        });
      }

      res.json({
        message: "Shopping list updated successfully",
        list,
      });
    } catch (error) {
      console.error("Update shopping list error:", error);
      res.status(500).json({
        error: "Server error",
        details: "Failed to update shopping list",
      });
    }
  }
);

/**
 * @swagger
 * /api/shopping/{id}:
 *   delete:
 *     summary: Delete a shopping list
 *     tags:
 *       - Shopping
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shopping list id
 *     responses:
 *       200:
 *         description: Shopping list deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Shopping list not found or access denied
 *       500:
 *         description: Server error
 */
router.delete("/:id", async (req, res) => {
  try {
    const list = await ShoppingList.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id, // Only owner can delete
    });

    if (!list) {
      return res.status(404).json({
        error: "Shopping list not found",
        details: "Shopping list not found or access denied",
      });
    }

    res.json({
      message: "Shopping list deleted successfully",
      list,
    });
  } catch (error) {
    console.error("Delete shopping list error:", error);
    res.status(500).json({
      error: "Server error",
      details: "Failed to delete shopping list",
    });
  }
});

/**
 * @swagger
 * /api/shopping/{id}/items:
 *   post:
 *     summary: Add an item to a shopping list
 *     tags:
 *       - Shopping
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shopping list id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               quantity:
 *                 type: number
 *               price:
 *                 type: number
 *               currency:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *     responses:
 *       200:
 *         description: Item added to shopping list
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Shopping list not found or access denied
 *       500:
 *         description: Server error
 */
router.post(
  "/:id/items",
  validateItem,
  handleValidationErrors,
  async (req, res) => {
    try {
      const itemData = {
        ...req.body,
        purchased: false,
        purchasedAt: null,
      };

      const list = await ShoppingList.findOneAndUpdate(
        {
          _id: req.params.id,
          $or: [
            { userId: req.user._id },
            {
              "sharedWith.userId": req.user._id,
              "sharedWith.permission": "edit",
            },
          ],
        },
        { $push: { items: itemData } },
        { new: true, runValidators: true }
      );

      if (!list) {
        return res.status(404).json({
          error: "Shopping list not found",
          details: "Shopping list not found or access denied",
        });
      }

      res.json({
        message: "Item added successfully",
        list,
      });
    } catch (error) {
      console.error("Add item error:", error);
      res.status(500).json({
        error: "Server error",
        details: "Failed to add item",
      });
    }
  }
);

/**
 * @swagger
 * /api/shopping/{id}/items/{itemId}:
 *   put:
 *     summary: Update an item in a shopping list
 *     tags:
 *       - Shopping
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               purchased:
 *                 type: boolean
 *               quantity:
 *                 type: number
 *               price:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item updated
 *       400:
 *         description: Validation error or invalid id
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Shopping list or item not found
 *       500:
 *         description: Server error
 */
router.put("/:id/items/:itemId", async (req, res) => {
  try {
    const { purchased, quantity, price, notes } = req.body;

    const updateData = {};
    if (purchased !== undefined) {
      updateData["items.$.purchased"] = purchased;
      updateData["items.$.purchasedAt"] = purchased ? new Date() : null;
    }
    if (quantity !== undefined) updateData["items.$.quantity"] = quantity;
    if (price !== undefined) updateData["items.$.price"] = price;
    if (notes !== undefined) updateData["items.$.notes"] = notes;

    const list = await ShoppingList.findOneAndUpdate(
      {
        _id: req.params.id,
        "items._id": req.params.itemId,
        $or: [
          { userId: req.user._id },
          {
            "sharedWith.userId": req.user._id,
            "sharedWith.permission": "edit",
          },
        ],
      },
      { $set: updateData },
      { new: true }
    );

    if (!list) {
      return res.status(404).json({
        error: "Shopping list or item not found",
        details: "Shopping list or item not found or access denied",
      });
    }

    res.json({
      message: "Item updated successfully",
      list,
    });
  } catch (error) {
    console.error("Update item error:", error);
    res.status(500).json({
      error: "Server error",
      details: "Failed to update item",
    });
  }
});

/**
 * @swagger
 * /api/shopping/{id}/items/{itemId}:
 *   delete:
 *     summary: Remove an item from a shopping list
 *     tags:
 *       - Shopping
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item removed
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Shopping list not found or access denied
 *       500:
 *         description: Server error
 */
router.delete("/:id/items/:itemId", async (req, res) => {
  try {
    const list = await ShoppingList.findOneAndUpdate(
      {
        _id: req.params.id,
        $or: [
          { userId: req.user._id },
          {
            "sharedWith.userId": req.user._id,
            "sharedWith.permission": "edit",
          },
        ],
      },
      { $pull: { items: { _id: req.params.itemId } } },
      { new: true }
    );

    if (!list) {
      return res.status(404).json({
        error: "Shopping list not found",
        details: "Shopping list not found or access denied",
      });
    }

    res.json({
      message: "Item removed successfully",
      list,
    });
  } catch (error) {
    console.error("Remove item error:", error);
    res.status(500).json({
      error: "Server error",
      details: "Failed to remove item",
    });
  }
});

/**
 * /api/shopping/{id}/complete:
 *   put:
 *     summary: Mark a shopping list as completed
 *     tags:
 *       - Shopping
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shopping list id
 *     responses:
 *       200:
 *         description: Shopping list marked as completed
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Shopping list not found or access denied
 *       500:
 *         description: Server error
 */
router.put("/:id/complete", async (req, res) => {
  try {
    const list = await ShoppingList.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user._id,
      },
      {
        status: "completed",
        "items.$[].purchased": true,
        "items.$[].purchasedAt": new Date(),
      },
      { new: true }
    );

    if (!list) {
      return res.status(404).json({
        error: "Shopping list not found",
        details: "Shopping list not found or access denied",
      });
    }

    res.json({
      message: "Shopping list marked as completed",
      list,
    });
  } catch (error) {
    console.error("Complete shopping list error:", error);
    res.status(500).json({
      error: "Server error",
      details: "Failed to complete shopping list",
    });
  }
});

/**
 * @swagger
 * /api/shopping/stats/summary:
 *   get:
 *     summary: Get shopping statistics summary for the authenticated user
 *     tags:
 *       - Shopping
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Shopping statistics summary
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/stats/summary", async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await ShoppingList.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalLists: { $sum: 1 },
          activeLists: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
          },
          completedLists: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          totalItems: { $sum: { $size: "$items" } },
          purchasedItems: {
            $sum: {
              $size: {
                $filter: {
                  input: "$items",
                  cond: { $eq: ["$$this.purchased", true] },
                },
              },
            },
          },
          totalEstimatedValue: { $sum: "$totalEstimatedPrice" },
          totalActualValue: { $sum: "$actualTotalPrice" },
        },
      },
    ]);

    const result = stats[0] || {
      totalLists: 0,
      activeLists: 0,
      completedLists: 0,
      totalItems: 0,
      purchasedItems: 0,
      totalEstimatedValue: 0,
      totalActualValue: 0,
    };

    res.json({ stats: result });
  } catch (error) {
    console.error("Get shopping stats error:", error);
    res.status(500).json({
      error: "Server error",
      details: "Failed to fetch shopping statistics",
    });
  }
});

module.exports = router;
