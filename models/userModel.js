const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');

const bcryptHashPassword = require('./../utils/hashPassword');
const bcryptComparePassword = require('./../utils/comparePassword');
const GC = require('./../utils/gc');

const gcPasswordReset = new GC();
const gcEmailUpdate = new GC();
const gcEmailConfirm = new GC();

const schema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name!'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email!'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid amail!'],
  },
  password: {
    type: String,
    required: [true, 'Please provide your password!'],
    minLength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please provide your password confirm!'],
    validate: {
      validator: function (value) {
        return this.password === value;
      },
      message: 'Password and password confirm are not the same!',
    },
  },
  photo: {
    type: String,
  },
  passwordChangedAt: {
    type: Date,
  },
  role: {
    type: String,
    default: 'user',
    select: false,
  },
  passwordBeingReset: {
    type: Boolean,
  },
  passwordResetToken: {
    type: String,
  },
  passwordResetExpires: {
    type: Date,
  },
  emailBeingUpdate: {
    type: Boolean,
  },
  emailToken: {
    type: String,
  },
  emailTokenExpires: {
    type: Date,
  },
  emailBeingConfirm: {
    type: Boolean,
  },
  emailTokenConfirm: {
    type: String,
  },
  emailTokenConfirmExpires: {
    type: Date,
  },
});

schema.pre('save', async function (next) {
  // Password
  if (this.isModified('password')) {
    this.password = await bcryptHashPassword(this.password, 12);
    this.passwordConfirm = undefined;
  }
  if (this.isModified('password') && !this.isNew)
    this.passwordChangedAt = Date.now();

  next();
});

// Instance methods

// Email confirm

schema.methods.gcEmailConfirmStart = function () {
  const clearedItems = [
    'emailBeingConfirm',
    'emailTokenConfirm',
    'emailTokenConfirmExpires',
  ];

  gcEmailConfirm.start(this, this.emailTokenConfirmExpires, clearedItems);
};

schema.methods.gcEmailConfirmImmediate = function (onlyClear = false) {
  gcEmailConfirm.end(this, onlyClear);
};

schema.methods.createEmailConfirmToken = function () {
  const token = crypto.randomBytes(64).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  this.emailBeingConfirm = true;
  this.emailTokenConfirm = hashedToken;
  this.emailTokenConfirmExpires = Date.now() + 10 * 60 * 1000;

  return token;
};

// Email update

schema.methods.gcEmailUpdateStart = function () {
  const clearedItems = ['emailBeingUpdate', 'emailToken', 'emailTokenExpires'];

  gcEmailUpdate.start(this, this.emailTokenExpires, clearedItems);
};

schema.methods.gcEmailUpdateImmediate = function (onlyClear = false) {
  gcEmailUpdate.end(this, onlyClear);
};

schema.methods.createEmailUpdateToken = function () {
  const token = crypto.randomBytes(64).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  this.emailBeingUpdate = true;
  this.emailToken = hashedToken;
  this.emailTokenExpires = Date.now() + 10 * 60 * 1000;

  return token;
};

schema.methods.gcPasswordResetStart = function () {
  const clearedItems = [
    'passwordBeingReset',
    'passwordResetToken',
    'passwordResetExpires',
  ];

  gcPasswordReset.start(this, this.passwordResetExpires, clearedItems);
};

schema.methods.gcPasswordResetImmediate = function (onlyClear = false) {
  gcPasswordReset.end(this, onlyClear);
};

schema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(64).toString('hex');
  const hashedResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordBeingReset = true;
  this.passwordResetToken = hashedResetToken;
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

schema.methods.correctPassword = async function (password) {
  return await bcryptComparePassword(password, this.password);
};

schema.methods.changedPassword = function (tokenTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      new Date(this.passwordChangedAt).getTime() / 1000,
      10
    );

    return changedTimestamp > tokenTimestamp;
  }

  return false;
};

const User = mongoose.model('User', schema, 'users');

module.exports = User;
