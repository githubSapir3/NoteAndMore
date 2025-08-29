// ===== models/User.js =====
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
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
  username: {
    type: String,
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  avatar: {
    type: String,
    default: null
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    language: {
      type: String,
      enum: ['en', 'he'],
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'Asia/Jerusalem'
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      reminders: { type: Boolean, default: true }
    }
  },
  role: {
    type: String,
    enum: ['user', 'premium', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  // Usage tracking for limits
  usage: {
    tasks: { type: Number, default: 0 },
    events: { type: Number, default: 0 },
    contacts: { type: Number, default: 0 },
    shoppingLists: { type: Number, default: 0 },
    categories: { type: Number, default: 0 }
  },
  // Premium features
  premiumFeatures: {
    unlimitedTasks: { type: Boolean, default: false },
    unlimitedEvents: { type: Boolean, default: false },
    unlimitedContacts: { type: Boolean, default: false },
    unlimitedShoppingLists: { type: Boolean, default: false },
    unlimitedCategories: { type: Boolean, default: false }
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for checking if user can create more items
userSchema.virtual('canCreateTask').get(function() {
  if (this.role === 'admin' || this.role === 'premium') return true;
  return this.usage.tasks < 5;
});

userSchema.virtual('canCreateEvent').get(function() {
  if (this.role === 'admin' || this.role === 'premium') return true;
  return this.usage.events < 5;
});

userSchema.virtual('canCreateContact').get(function() {
  if (this.role === 'admin' || this.role === 'premium') return true;
  return this.usage.contacts < 5;
});

userSchema.virtual('canCreateShoppingList').get(function() {
  if (this.role === 'admin' || this.role === 'premium') return true;
  return this.usage.shoppingLists < 5;
});

userSchema.virtual('canCreateCategory').get(function() {
  if (this.role === 'admin' || this.role === 'premium') return true;
  return this.usage.categories < 5;
});

// Method to check if user can create a specific type of item
userSchema.methods.canCreate = function(itemType) {
  const usageMap = {
    'task': 'tasks',
    'event': 'events',
    'contact': 'contacts',
    'shoppingList': 'shoppingLists',
    'category': 'categories'
  };
  
  const usageField = usageMap[itemType];
  if (!usageField) return false;
  
  if (this.role === 'admin' || this.role === 'premium') return true;
  return this.usage[usageField] < 5;
};

// Method to increment usage
userSchema.methods.incrementUsage = function(itemType) {
  const usageMap = {
    'task': 'tasks',
    'event': 'events',
    'contact': 'contacts',
    'shoppingList': 'shoppingLists',
    'category': 'categories'
  };
  
  const usageField = usageMap[itemType];
  if (usageField && this.role === 'user') {
    this.usage[usageField] += 1;
  }
};

// Method to decrement usage
userSchema.methods.decrementUsage = function(itemType) {
  const usageMap = {
    'task': 'tasks',
    'event': 'events',
    'contact': 'contacts',
    'shoppingList': 'shoppingLists',
    'category': 'categories'
  };
  
  const usageField = usageMap[itemType];
  if (usageField && this.role === 'user' && this.usage[usageField] > 0) {
    this.usage[usageField] -= 1;
  }
};

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Update premium features when role changes
userSchema.pre('save', function(next) {
  if (this.isModified('role')) {
    if (this.role === 'premium') {
      this.premiumFeatures = {
        unlimitedTasks: true,
        unlimitedEvents: true,
        unlimitedContacts: true,
        unlimitedShoppingLists: true,
        unlimitedCategories: true
      };
    } else if (this.role === 'user') {
      this.premiumFeatures = {
        unlimitedTasks: false,
        unlimitedEvents: false,
        unlimitedContacts: false,
        unlimitedShoppingLists: false,
        unlimitedCategories: false
      };
    }
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate auth token
userSchema.methods.generateAuthToken = function() {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { 
      userId: this._id,
      email: this.email,
      role: this.role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpires;
  return user;
};

module.exports = mongoose.model('User', userSchema);
