// ===== routes/contacts.js =====
const express = require("express");
const { body, validationResult, query } = require("express-validator");
const Contact = require("../models/Contact");

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
const validateContact = [
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ max: 50 })
    .withMessage("First name cannot exceed 50 characters"),
  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name is required")
    .isLength({ max: 50 })
    .withMessage("Last name cannot exceed 50 characters"),
  body("nickname")
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage("Nickname cannot exceed 30 characters"),
  body("phones").optional().isArray().withMessage("Phones must be an array"),
  body("phones.*.number")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Phone number is required"),
  body("phones.*.type")
    .optional()
    .isIn(["mobile", "home", "work", "other"])
    .withMessage("Invalid phone type"),
  body("emails").optional().isArray().withMessage("Emails must be an array"),
  body("emails.*.address")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email address is required"),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high"])
    .withMessage("Priority must be low, medium, or high"),
  body("birthday")
    .optional()
    .isISO8601()
    .withMessage("Birthday must be a valid date"),
];

/**
 * @swagger
 * /api/contacts:
 *   get:
 *     summary: Get all contacts for the authenticated user
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
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
 *         description: Results per page (default 20)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *       - in: query
 *         name: favorites
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of contacts with pagination
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
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
    query("search").optional().trim(),
    query("tag").optional().trim(),
    query("priority").optional().isIn(["low", "medium", "high"]),
    query("favorites").optional().isBoolean(),
    query("sortBy")
      .optional()
      .isIn(["firstName", "lastName", "lastContacted", "createdAt"]),
    query("sortOrder").optional().isIn(["asc", "desc"]),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        tag,
        priority,
        favorites,
        sortBy = "firstName",
        sortOrder = "asc",
      } = req.query;

      // Use the static method from the model
      const [contacts, totalContacts] = await Contact.searchContacts(
        req.user._id,
        search,
        {
          page,
          limit,
          tag,
          priority,
          favorites: favorites === "true",
          sortBy,
          sortOrder,
        }
      );

      // Calculate pagination info
      const totalPages = Math.ceil(totalContacts / parseInt(limit));

      res.json({
        contacts,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalContacts,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1,
          limit: parseInt(limit),
        },
      });
    } catch (error) {
      console.error("Get contacts error:", error);
      res.status(500).json({
        error: "Server error",
        details: "Failed to fetch contacts",
      });
    }
  }
);

/**
 * @swagger
 * /api/contacts/favorites:
 *   get:
 *     summary: Get favorite contacts for the authenticated user
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Favorite contacts returned
 *       500:
 *         description: Server error
 */
router.get("/favorites", async (req, res) => {
  try {
    const contacts = await Contact.findFavorites(req.user._id);

    res.json({
      contacts,
      count: contacts.length,
    });
  } catch (error) {
    console.error("Get favorite contacts error:", error);
    res.status(500).json({
      error: "Server error",
      details: "Failed to fetch favorite contacts",
    });
  }
});

/**
 * @swagger
 * /api/contacts/recent:
 *   get:
 *     summary: Get recently contacted contacts
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of recent contacts to return (default 10)
 *     responses:
 *       200:
 *         description: Recent contacts returned
 *       500:
 *         description: Server error
 */
router.get("/recent", async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const contacts = await Contact.findRecent(req.user._id, parseInt(limit));

    res.json({
      contacts,
      count: contacts.length,
    });
  } catch (error) {
    console.error("Get recent contacts error:", error);
    res.status(500).json({
      error: "Server error",
      details: "Failed to fetch recent contacts",
    });
  }
});

/**
 * @swagger
 * /api/contacts/birthdays:
 *   get:
 *     summary: Get contacts with upcoming birthdays
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *         description: Number of days ahead to look for birthdays (default 30)
 *     responses:
 *       200:
 *         description: Contacts with upcoming birthdays
 *       500:
 *         description: Server error
 */
router.get("/birthdays", async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const contacts = await Contact.findUpcomingBirthdays(
      req.user._id,
      parseInt(days)
    );

    res.json({
      contacts,
      count: contacts.length,
    });
  } catch (error) {
    console.error("Get birthday contacts error:", error);
    res.status(500).json({
      error: "Server error",
      details: "Failed to fetch birthday contacts",
    });
  }
});

/**
 * @swagger
 * /api/contacts/stats:
 *   get:
 *     summary: Get contact statistics for the authenticated user
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Contact statistics returned
 *       500:
 *         description: Server error
 */
router.get("/stats", async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await Contact.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          favorites: {
            $sum: { $cond: [{ $eq: ["$isFavorite", true] }, 1, 0] },
          },
          withPhone: {
            $sum: { $cond: [{ $gt: [{ $size: "$phones" }, 0] }, 1, 0] },
          },
          withEmail: {
            $sum: { $cond: [{ $gt: [{ $size: "$emails" }, 0] }, 1, 0] },
          },
          withBirthday: {
            $sum: { $cond: [{ $ne: ["$birthday", null] }, 1, 0] },
          },
          highPriority: {
            $sum: { $cond: [{ $eq: ["$priority", "high"] }, 1, 0] },
          },
        },
      },
    ]);

    const result = stats[0] || {
      total: 0,
      favorites: 0,
      withPhone: 0,
      withEmail: 0,
      withBirthday: 0,
      highPriority: 0,
    };

    res.json({ stats: result });
  } catch (error) {
    console.error("Get contact stats error:", error);
    res.status(500).json({
      error: "Server error",
      details: "Failed to fetch contact statistics",
    });
  }
});

/**
 * @swagger
 * /api/contacts/{id}:
 *   get:
 *     summary: Get a single contact by ID
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contact ID
 *     responses:
 *       200:
 *         description: Contact returned
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Contact not found
 *       500:
 *         description: Server error
 */
router.get("/:id", async (req, res) => {
  try {
    const contact = await Contact.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!contact) {
      return res.status(404).json({
        error: "Contact not found",
        details: "Contact not found or access denied",
      });
    }

    res.json({ contact });
  } catch (error) {
    console.error("Get contact error:", error);
    if (error.name === "CastError") {
      return res.status(400).json({
        error: "Invalid contact ID",
        details: "Please provide a valid contact ID",
      });
    }
    res.status(500).json({
      error: "Server error",
      details: "Failed to fetch contact",
    });
  }
});

/**
 * @swagger
 * /api/contacts:
 *   post:
 *     summary: Create a new contact
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               nickname:
 *                 type: string
 *               phones:
 *                 type: array
 *                 items:
 *                   type: object
 *               emails:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Contact created successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post("/", validateContact, handleValidationErrors, async (req, res) => {
  try {
    const contactData = {
      ...req.body,
      userId: req.user._id,
    };

    const contact = new Contact(contactData);
    await contact.save();

    res.status(201).json({
      message: "Contact created successfully",
      contact,
    });
  } catch (error) {
    console.error("Create contact error:", error);
    res.status(500).json({
      error: "Server error",
      details: "Failed to create contact",
    });
  }
});

/**
 * @swagger
 * /api/contacts/{id}:
 *   put:
 *     summary: Update a contact
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
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
 *     responses:
 *       200:
 *         description: Contact updated successfully
 *       400:
 *         description: Validation error or invalid ID
 *       404:
 *         description: Contact not found
 *       500:
 *         description: Server error
 */
router.put(
  "/:id",
  validateContact,
  handleValidationErrors,
  async (req, res) => {
    try {
      const contact = await Contact.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        { $set: req.body },
        { new: true, runValidators: true }
      );

      if (!contact) {
        return res.status(404).json({
          error: "Contact not found",
          details: "Contact not found or access denied",
        });
      }

      res.json({
        message: "Contact updated successfully",
        contact,
      });
    } catch (error) {
      console.error("Update contact error:", error);
      if (error.name === "CastError") {
        return res.status(400).json({
          error: "Invalid contact ID",
          details: "Please provide a valid contact ID",
        });
      }
      res.status(500).json({
        error: "Server error",
        details: "Failed to update contact",
      });
    }
  }
);

/**
 * @swagger
 * /api/contacts/{id}:
 *   delete:
 *     summary: Delete a contact
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Contact deleted successfully
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Contact not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", async (req, res) => {
  try {
    const contact = await Contact.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!contact) {
      return res.status(404).json({
        error: "Contact not found",
        details: "Contact not found or access denied",
      });
    }

    res.json({
      message: "Contact deleted successfully",
      contact,
    });
  } catch (error) {
    console.error("Delete contact error:", error);
    if (error.name === "CastError") {
      return res.status(400).json({
        error: "Invalid contact ID",
        details: "Please provide a valid contact ID",
      });
    }
    res.status(500).json({
      error: "Server error",
      details: "Failed to delete contact",
    });
  }
});

/**
 * @swagger
 * /api/contacts/{id}/favorite:
 *   put:
 *     summary: Toggle favorite status for a contact
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Favorite status toggled
 *       404:
 *         description: Contact not found
 *       500:
 *         description: Server error
 */
router.put("/:id/favorite", async (req, res) => {
  try {
    const contact = await Contact.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!contact) {
      return res.status(404).json({
        error: "Contact not found",
        details: "Contact not found or access denied",
      });
    }

    // Use the model method
    contact.toggleFavorite();
    await contact.save();

    res.json({
      message: `Contact ${
        contact.isFavorite ? "added to" : "removed from"
      } favorites`,
      contact,
    });
  } catch (error) {
    console.error("Toggle favorite error:", error);
    res.status(500).json({
      error: "Server error",
      details: "Failed to update favorite status",
    });
  }
});

/**
 * @swagger
 * /api/contacts/{id}/call-history:
 *   post:
 *     summary: Add a call history entry to a contact
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
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
 *               type:
 *                 type: string
 *                 enum: [incoming, outgoing, missed]
 *               duration:
 *                 type: integer
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Call history added
 *       400:
 *         description: Validation error
 *       404:
 *         description: Contact not found
 *       500:
 *         description: Server error
 */
router.post(
  "/:id/call-history",
  [
    body("type")
      .isIn(["incoming", "outgoing", "missed"])
      .withMessage("Call type must be incoming, outgoing, or missed"),
    body("duration")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Duration must be a positive integer"),
    body("notes")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Call notes cannot exceed 500 characters"),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { type, duration = 0, notes = "" } = req.body;

      const contact = await Contact.findOne({
        _id: req.params.id,
        userId: req.user._id,
      });

      if (!contact) {
        return res.status(404).json({
          error: "Contact not found",
          details: "Contact not found or access denied",
        });
      }

      // Use the model method
      contact.addCallHistory(type, duration, notes);
      await contact.save();

      res.json({
        message: "Call history added successfully",
        contact,
      });
    } catch (error) {
      console.error("Add call history error:", error);
      res.status(500).json({
        error: "Server error",
        details: "Failed to add call history",
      });
    }
  }
);

/**
 * @swagger
 * /api/contacts/{id}/phone:
 *   post:
 *     summary: Add a phone number to a contact
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
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
 *               number:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [mobile, home, work, other]
 *               primary:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Phone number added
 *       400:
 *         description: Validation error
 *       404:
 *         description: Contact not found
 *       500:
 *         description: Server error
 */
router.post(
  "/:id/phone",
  [
    body("number").trim().notEmpty().withMessage("Phone number is required"),
    body("type")
      .optional()
      .isIn(["mobile", "home", "work", "other"])
      .withMessage("Invalid phone type"),
    body("primary")
      .optional()
      .isBoolean()
      .withMessage("Primary must be a boolean"),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { number, type = "mobile", primary = false } = req.body;

      const contact = await Contact.findOne({
        _id: req.params.id,
        userId: req.user._id,
      });

      if (!contact) {
        return res.status(404).json({
          error: "Contact not found",
          details: "Contact not found or access denied",
        });
      }

      // Use the model method
      contact.addPhone(number, type, primary);
      await contact.save();

      res.json({
        message: "Phone number added successfully",
        contact,
      });
    } catch (error) {
      console.error("Add phone error:", error);
      res.status(500).json({
        error: "Server error",
        details: "Failed to add phone number",
      });
    }
  }
);

/**
 * @swagger
 * /api/contacts/{id}/email:
 *   post:
 *     summary: Add an email address to a contact
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
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
 *               address:
 *                 type: string
 *                 format: email
 *               type:
 *                 type: string
 *                 enum: [personal, work, other]
 *               primary:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Email added
 *       400:
 *         description: Validation error
 *       404:
 *         description: Contact not found
 *       500:
 *         description: Server error
 */
router.post(
  "/:id/email",
  [
    body("address")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email address is required"),
    body("type")
      .optional()
      .isIn(["personal", "work", "other"])
      .withMessage("Invalid email type"),
    body("primary")
      .optional()
      .isBoolean()
      .withMessage("Primary must be a boolean"),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { address, type = "personal", primary = false } = req.body;

      const contact = await Contact.findOne({
        _id: req.params.id,
        userId: req.user._id,
      });

      if (!contact) {
        return res.status(404).json({
          error: "Contact not found",
          details: "Contact not found or access denied",
        });
      }

      // Use the model method
      contact.addEmail(address, type, primary);
      await contact.save();

      res.json({
        message: "Email added successfully",
        contact,
      });
    } catch (error) {
      console.error("Add email error:", error);
      res.status(500).json({
        error: "Server error",
        details: "Failed to add email",
      });
    }
  }
);

module.exports = router;
