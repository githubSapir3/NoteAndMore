// ===== routes/contacts.js =====
const express = require('express');
const { body, validationResult, query } = require('express-validator');
const mongoose = require('mongoose');

const router = express.Router();

// Contact Schema (inline for this example - you can move to models/Contact.js)
const contactSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  nickname: {
    type: String,
    trim: true,
    maxlength: [30, 'Nickname cannot exceed 30 characters']
  },
  phones: [{
    number: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['mobile', 'home', 'work', 'other'],
      default: 'mobile'
    },
    primary: {
      type: Boolean,
      default: false
    }
  }],
  emails: [{
    address: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    type: {
      type: String,
      enum: ['personal', 'work', 'other'],
      default: 'personal'
    },
    primary: {
      type: Boolean,
      default: false
    }
  }],
  address: {
    street: {
      type: String,
      trim: true,
      maxlength: [200, 'Street cannot exceed 200 characters']
    },
    city: {
      type: String,
      trim: true,
      maxlength: [100, 'City cannot exceed 100 characters']
    },
    state: {
      type: String,
      trim: true,
      maxlength: [100, 'State cannot exceed 100 characters']
    },
    zipCode: {
      type: String,
      trim: true,
      maxlength: [20, 'Zip code cannot exceed 20 characters']
    },
    country: {
      type: String,
      trim: true,
      maxlength: [100, 'Country cannot exceed 100 characters']
    }
  },
  company: {
    name: {
      type: String,
      trim: true,
      maxlength: [200, 'Company name cannot exceed 200 characters']
    },
    position: {
      type: String,
      trim: true,
      maxlength: [100, 'Position cannot exceed 100 characters']
    },
    department: {
      type: String,
      trim: true,
      maxlength: [100, 'Department cannot exceed 100 characters']
    }
  },
  socialMedia: {
    facebook: {
      type: String,
      trim: true
    },
    linkedin: {
      type: String,
      trim: true
    },
    instagram: {
      type: String,
      trim: true
    },
    twitter: {
      type: String,
      trim: true
    }
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  callHistory: [{
    date: {
      type: Date,
      required: true
    },
    duration: {
      type: Number, // in seconds
      min: 0
    },
    type: {
      type: String,
      enum: ['incoming', 'outgoing', 'missed'],
      required: true
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Call notes cannot exceed 500 characters']
    }
  }],
  lastContacted: {
    type: Date,
    index: true
  },
  birthday: {
    type: Date
  },
  avatar: {
    type: String // URL to avatar image
  },
  isFavorite: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
contactSchema.index({ userId: 1, lastName: 1, firstName: 1 });
contactSchema.index({ 'phones.number': 1 });
contactSchema.index({ 'emails.address': 1 });
contactSchema.index({ userId: 1, isFavorite: 1 });
contactSchema.index({ userId: 1, tags: 1 });

// Virtual for full name
contactSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

const Contact = mongoose.model('Contact', contactSchema);

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
const validateContact = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),
  body('nickname')
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage('Nickname cannot exceed 30 characters'),
  body('phones')
    .optional()
    .isArray()
    .withMessage('Phones must be an array'),
  body('phones.*.number')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Phone number is required'),
  body('phones.*.type')
    .optional()
    .isIn(['mobile', 'home', 'work', 'other'])
    .withMessage('Invalid phone type'),
  body('emails')
    .optional()
    .isArray()
    .withMessage('Emails must be an array'),
  body('emails.*.address')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email address is required'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
  body('birthday')
    .optional()
    .isISO8601()
    .withMessage('Birthday must be a valid date')
];

// @route   GET /api/contacts
// @desc    Get all contacts for user with filtering and search
// @access  Private
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().trim(),
  query('tag').optional().trim(),
  query('priority').optional().isIn(['low', 'medium', 'high']),
  query('favorites').optional().isBoolean(),
  query('sortBy').optional().isIn(['firstName', 'lastName', 'lastContacted', 'createdAt']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], handleValidationErrors, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      tag,
      priority,
      favorites,
      sortBy = 'firstName',
      sortOrder = 'asc'
    } = req.query;

    // Build filter object
    const filter = { userId: req.user._id };

    if (priority) filter.priority = priority;
    if (favorites === 'true') filter.isFavorite = true;
    if (tag) filter.tags = { $in: [new RegExp(tag, 'i')] };

    if (search) {
      filter.$or = [
        { firstName: new RegExp(search, 'i') },
        { lastName: new RegExp(search, 'i') },
        { nickname: new RegExp(search, 'i') },
        { 'emails.address': new RegExp(search, 'i') },
        { 'phones.number': new RegExp(search, 'i') },
        { 'company.name': new RegExp(search, 'i') }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [contacts, totalContacts] = await Promise.all([
      Contact.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Contact.countDocuments(filter)
    ]);

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
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({
      error: 'Server error',
      details: 'Failed to fetch contacts'
    });
  }
});



// @route   POST /api/contacts
// @desc    Create new contact
// @access  Private
router.post('/', validateContact, handleValidationErrors, async (req, res) => {
  try {
    const contactData = {
      ...req.body,
      userId: req.user._id
    };

    // Ensure only one primary phone and email
    if (contactData.phones && contactData.phones.length > 0) {
      const primaryPhones = contactData.phones.filter(p => p.primary);
      if (primaryPhones.length > 1) {
        contactData.phones.forEach((p, index) => {
          p.primary = index === 0;
        });
      }
    }

    if (contactData.emails && contactData.emails.length > 0) {
      const primaryEmails = contactData.emails.filter(e => e.primary);
      if (primaryEmails.length > 1) {
        contactData.emails.forEach((e, index) => {
          e.primary = index === 0;
        });
      }
    }

    const contact = new Contact(contactData);
    await contact.save();

    res.status(201).json({
      message: 'Contact created successfully',
      contact
    });

  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({
      error: 'Server error',
      details: 'Failed to create contact'
    });
  }
});

// @route   PUT /api/contacts/:id
// @desc    Update contact
// @access  Private
router.put('/:id', validateContact, handleValidationErrors, async (req, res) => {
  try {
    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!contact) {
      return res.status(404).json({
        error: 'Contact not found',
        details: 'Contact not found or access denied'
      });
    }

    res.json({
      message: 'Contact updated successfully',
      contact
    });

  } catch (error) {
    console.error('Update contact error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'Invalid contact ID',
        details: 'Please provide a valid contact ID'
      });
    }
    res.status(500).json({
      error: 'Server error',
      details: 'Failed to update contact'
    });
  }
});

// @route   DELETE /api/contacts/:id
// @desc    Delete contact
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const contact = await Contact.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!contact) {
      return res.status(404).json({
        error: 'Contact not found',
        details: 'Contact not found or access denied'
      });
    }

    res.json({
      message: 'Contact deleted successfully',
      contact
    });

  } catch (error) {
    console.error('Delete contact error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'Invalid contact ID',
        details: 'Please provide a valid contact ID'
      });
    }
    res.status(500).json({
      error: 'Server error',
      details: 'Failed to delete contact'
    });
  }
});

// @route   PUT /api/contacts/:id/favorite
// @desc    Toggle contact favorite status
// @access  Private
router.put('/:id/favorite', async (req, res) => {
  try {
    const contact = await Contact.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!contact) {
      return res.status(404).json({
        error: 'Contact not found',
        details: 'Contact not found or access denied'
      });
    }

    contact.isFavorite = !contact.isFavorite;
    await contact.save();

    res.json({
      message: `Contact ${contact.isFavorite ? 'added to' : 'removed from'} favorites`,
      contact
    });

  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({
      error: 'Server error',
      details: 'Failed to update favorite status'
    });
  }
});

// @route   POST /api/contacts/:id/call-history
// @desc    Add call history entry
// @access  Private
router.post('/:id/call-history', [
  body('type')
    .isIn(['incoming', 'outgoing', 'missed'])
    .withMessage('Call type must be incoming, outgoing, or missed'),
  body('duration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Duration must be a positive integer'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Call notes cannot exceed 500 characters')
], handleValidationErrors, async (req, res) => {
  try {
    const { type, duration = 0, notes } = req.body;

    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { 
        $push: { 
          callHistory: { 
            date: new Date(),
            type,
            duration,
            notes
          }
        },
        $set: { lastContacted: new Date() }
      },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({
        error: 'Contact not found',
        details: 'Contact not found or access denied'
      });
    }

    res.json({
      message: 'Call history added successfully',
      contact
    });

  } catch (error) {
    console.error('Add call history error:', error);
    res.status(500).json({
      error: 'Server error',
      details: 'Failed to add call history'
    });
  }
});

// @route   GET /api/contacts/favorites
// @desc    Get favorite contacts
// @access  Private
router.get('/favorites', async (req, res) => {
  try {
    const contacts = await Contact.find({
      userId: req.user._id,
      isFavorite: true
    }).sort({ firstName: 1 });

    res.json({ 
      contacts,
      count: contacts.length
    });

  } catch (error) {
    console.error('Get favorite contacts error:', error);
    res.status(500).json({
      error: 'Server error',
      details: 'Failed to fetch favorite contacts'
    });
  }
});

// @route   GET /api/contacts/recent
// @desc    Get recently contacted contacts
// @access  Private
router.get('/recent', async (req, res) => {
  try {
    const contacts = await Contact.find({
      userId: req.user._id,
      lastContacted: { $exists: true, $ne: null }
    })
    .sort({ lastContacted: -1 })
    .limit(10);

    res.json({ 
      contacts,
      count: contacts.length
    });

  } catch (error) {
    console.error('Get recent contacts error:', error);
    res.status(500).json({
      error: 'Server error',
      details: 'Failed to fetch recent contacts'
    });
  }
});

// @route   GET /api/contacts/birthdays
// @desc    Get contacts with upcoming birthdays
// @access  Private
router.get('/birthdays', async (req, res) => {
  try {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());

    const contacts = await Contact.find({
      userId: req.user._id,
      birthday: { $exists: true, $ne: null }
    });

    // Filter for upcoming birthdays (next 30 days)
    const upcomingBirthdays = contacts.filter(contact => {
      const birthday = new Date(contact.birthday);
      const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
      
      // If birthday already passed this year, check next year
      if (thisYearBirthday < today) {
        thisYearBirthday.setFullYear(today.getFullYear() + 1);
      }
      
      return thisYearBirthday >= today && thisYearBirthday <= nextMonth;
    }).sort((a, b) => {
      const birthdayA = new Date(today.getFullYear(), a.birthday.getMonth(), a.birthday.getDate());
      const birthdayB = new Date(today.getFullYear(), b.birthday.getMonth(), b.birthday.getDate());
      return birthdayA - birthdayB;
    });

    res.json({ 
      contacts: upcomingBirthdays,
      count: upcomingBirthdays.length
    });

  } catch (error) {
    console.error('Get birthday contacts error:', error);
    res.status(500).json({
      error: 'Server error',
      details: 'Failed to fetch birthday contacts'
    });
  }
});

// @route   GET /api/contacts/stats
// @desc    Get contact statistics
// @access  Private
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await Contact.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          favorites: {
            $sum: { $cond: [{ $eq: ['$isFavorite', true] }, 1, 0] }
          },
          withPhone: {
            $sum: { $cond: [{ $gt: [{ $size: '$phones' }, 0] }, 1, 0] }
          },
          withEmail: {
            $sum: { $cond: [{ $gt: [{ $size: '$emails' }, 0] }, 1, 0] }
          },
          withBirthday: {
            $sum: { $cond: [{ $ne: ['$birthday', null] }, 1, 0] }
          },
          highPriority: {
            $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      total: 0,
      favorites: 0,
      withPhone: 0,
      withEmail: 0,
      withBirthday: 0,
      highPriority: 0
    };

    res.json({ stats: result });

  } catch (error) {
    console.error('Get contact stats error:', error);
    res.status(500).json({
      error: 'Server error',
      details: 'Failed to fetch contact statistics'
    });
  }
});
// @route   GET /api/contacts/:id
// @desc    Get single contact
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const contact = await Contact.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!contact) {
      return res.status(404).json({
        error: 'Contact not found',
        details: 'Contact not found or access denied'
      });
    }

    res.json({ contact });

  } catch (error) {
    console.error('Get contact error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'Invalid contact ID',
        details: 'Please provide a valid contact ID'
      });
    }
    res.status(500).json({
      error: 'Server error',
      details: 'Failed to fetch contact'
    });
  }
});
module.exports = router;