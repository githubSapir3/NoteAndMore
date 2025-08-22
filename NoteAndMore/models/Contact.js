// ===== models/Contact.js =====
const mongoose = require('mongoose');

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

// Virtual for primary phone
contactSchema.virtual('primaryPhone').get(function() {
  return this.phones.find(phone => phone.primary) || this.phones[0];
});

// Virtual for primary email
contactSchema.virtual('primaryEmail').get(function() {
  return this.emails.find(email => email.primary) || this.emails[0];
});

// Virtual for checking if birthday is upcoming
contactSchema.virtual('isBirthdayUpcoming').get(function() {
  if (!this.birthday) return false;
  
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const birthday = new Date(this.birthday);
  const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
  
  if (thisYearBirthday < today) {
    thisYearBirthday.setFullYear(today.getFullYear() + 1);
  }
  
  return thisYearBirthday >= today && thisYearBirthday <= nextMonth;
});

// Virtual for days until birthday
contactSchema.virtual('daysUntilBirthday').get(function() {
  if (!this.birthday) return null;
  
  const today = new Date();
  const birthday = new Date(this.birthday);
  const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
  
  if (thisYearBirthday < today) {
    thisYearBirthday.setFullYear(today.getFullYear() + 1);
  }
  
  const diffTime = Math.abs(thisYearBirthday - today);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for age calculation
contactSchema.virtual('age').get(function() {
  if (!this.birthday) return null;
  
  const today = new Date();
  const birthday = new Date(this.birthday);
  let age = today.getFullYear() - birthday.getFullYear();
  const monthDiff = today.getMonth() - birthday.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthday.getDate())) {
    age--;
  }
  
  return age;
});

// Pre-save middleware to ensure only one primary phone/email
contactSchema.pre('save', function(next) {
  // Ensure only one primary phone
  if (this.phones && this.phones.length > 0) {
    const primaryPhones = this.phones.filter(p => p.primary);
    if (primaryPhones.length > 1) {
      this.phones.forEach((p, index) => {
        p.primary = index === 0;
      });
    } else if (primaryPhones.length === 0) {
      this.phones[0].primary = true;
    }
  }
  
  // Ensure only one primary email
  if (this.emails && this.emails.length > 0) {
    const primaryEmails = this.emails.filter(e => e.primary);
    if (primaryEmails.length > 1) {
      this.emails.forEach((e, index) => {
        e.primary = index === 0;
      });
    } else if (primaryEmails.length === 0) {
      this.emails[0].primary = true;
    }
  }
  
  next();
});

// Instance method to add phone
contactSchema.methods.addPhone = function(number, type = 'mobile', primary = false) {
  if (primary) {
    this.phones.forEach(p => p.primary = false);
  }
  this.phones.push({ number, type, primary });
  return this;
};

// Instance method to add email
contactSchema.methods.addEmail = function(address, type = 'personal', primary = false) {
  if (primary) {
    this.emails.forEach(e => e.primary = false);
  }
  this.emails.push({ address, type, primary });
  return this;
};

// Instance method to add call history
contactSchema.methods.addCallHistory = function(type, duration = 0, notes = '') {
  this.callHistory.push({
    date: new Date(),
    type,
    duration,
    notes
  });
  this.lastContacted = new Date();
  return this;
};

// Instance method to toggle favorite
contactSchema.methods.toggleFavorite = function() {
  this.isFavorite = !this.isFavorite;
  return this;
};

// Static method to find favorites
contactSchema.statics.findFavorites = function(userId) {
  return this.find({
    userId,
    isFavorite: true
  }).sort({ firstName: 1 });
};

// Static method to find recent contacts
contactSchema.statics.findRecent = function(userId, limit = 10) {
  return this.find({
    userId,
    lastContacted: { $exists: true, $ne: null }
  })
  .sort({ lastContacted: -1 })
  .limit(limit);
};

// Static method to find contacts with upcoming birthdays
contactSchema.statics.findUpcomingBirthdays = function(userId, days = 30) {
  const today = new Date();
  const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
  
  return this.find({
    userId,
    birthday: { $exists: true, $ne: null }
  }).then(contacts => {
    return contacts.filter(contact => {
      const birthday = new Date(contact.birthday);
      const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
      
      if (thisYearBirthday < today) {
        thisYearBirthday.setFullYear(today.getFullYear() + 1);
      }
      
      return thisYearBirthday >= today && thisYearBirthday <= futureDate;
    }).sort((a, b) => {
      const birthdayA = new Date(today.getFullYear(), a.birthday.getMonth(), a.birthday.getDate());
      const birthdayB = new Date(today.getFullYear(), b.birthday.getMonth(), b.birthday.getDate());
      return birthdayA - birthdayB;
    });
  });
};

// Static method to search contacts
contactSchema.statics.searchContacts = function(userId, searchTerm, options = {}) {
  const {
    page = 1,
    limit = 20,
    tag,
    priority,
    favorites,
    sortBy = 'firstName',
    sortOrder = 'asc'
  } = options;

  // Build filter
  const filter = { userId };

  if (priority) filter.priority = priority;
  if (favorites) filter.isFavorite = true;
  if (tag) filter.tags = { $in: [new RegExp(tag, 'i')] };

  if (searchTerm) {
    filter.$or = [
      { firstName: new RegExp(searchTerm, 'i') },
      { lastName: new RegExp(searchTerm, 'i') },
      { nickname: new RegExp(searchTerm, 'i') },
      { 'emails.address': new RegExp(searchTerm, 'i') },
      { 'phones.number': new RegExp(searchTerm, 'i') },
      { 'company.name': new RegExp(searchTerm, 'i') }
    ];
  }

  // Build sort
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  return Promise.all([
    this.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    this.countDocuments(filter)
  ]);
};

module.exports = mongoose.model('Contact', contactSchema);