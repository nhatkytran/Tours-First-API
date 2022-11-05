const crypto = require('crypto');
const mongoose = require('mongoose');

const userSchemaOptions = require('./schemaOptions/userSchemaOptions');

const bcryptHashPassword = require('./../utils/hashPassword');
const bcryptComparePassword = require('./../utils/comparePassword');
const GC = require('./../utils/gc');

const gcPasswordReset = new GC();
const gcEmailUpdate = new GC();
const gcEmailConfirm = new GC();
const gcActivate = new GC();

const schema = new mongoose.Schema(userSchemaOptions);

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

// schema.pre(/^find/, function (next) {
//   this.find({ active: { $ne: false } });
//   next();
// });

// Instance methods

// Set 3 fields
// BeingDone => true | null
// HashedToken => hashedToken | null
// HashedTokenExpires => expiredTimestamp | null
// fields --> if one field doesn't exist => set null
// fields order --> [BeingDone, HashedToken, HashedTokenExpires]
const createCryptoTokenInformation = (target, fields, expiredTimestamp) => {
  const token = crypto.randomBytes(64).toString('hex');

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const values = [true, hashedToken, expiredTimestamp];

  fields.forEach((field, index) => {
    if (field) target[field] = values[index];
  });

  return token;
};

// Activate account

const activateAccountFields = ['activateToken', 'activateTokenExpires'];

schema.methods.gcActivateStart = function () {
  gcActivate.start(this, this.activateTokenExpires, activateAccountFields);
};

schema.methods.gcActivateImmediate = function (onlyClear = false) {
  gcActivate.end(this, onlyClear);
};

schema.methods.createActivateToken = function () {
  return createCryptoTokenInformation(
    this,
    [null, ...activateAccountFields],
    Date.now() + 10 * 60 * 1000
  );
};

// Email confirm

const emailConfirmFields = [
  'emailBeingConfirm',
  'emailTokenConfirm',
  'emailTokenConfirmExpires',
];

schema.methods.gcEmailConfirmStart = function () {
  gcEmailConfirm.start(this, this.emailTokenConfirmExpires, emailConfirmFields);
};

schema.methods.gcEmailConfirmImmediate = function (onlyClear = false) {
  gcEmailConfirm.end(this, onlyClear);
};

schema.methods.createEmailConfirmToken = function () {
  return createCryptoTokenInformation(
    this,
    emailConfirmFields,
    Date.now() + 10 * 60 * 1000
  );
};

// Email update

const emailUpdateFields = [
  'emailBeingUpdate',
  'emailToken',
  'emailTokenExpires',
];

schema.methods.gcEmailUpdateStart = function () {
  gcEmailUpdate.start(this, this.emailTokenExpires, emailUpdateFields);
};

schema.methods.gcEmailUpdateImmediate = function (onlyClear = false) {
  gcEmailUpdate.end(this, onlyClear);
};

schema.methods.createEmailUpdateToken = function () {
  return createCryptoTokenInformation(
    this,
    emailUpdateFields,
    Date.now() + 10 * 60 * 1000
  );
};

// Password reset

const passwordResetFields = [
  'passwordBeingReset',
  'passwordResetToken',
  'passwordResetExpires',
];

schema.methods.gcPasswordResetStart = function () {
  gcPasswordReset.start(this, this.passwordResetExpires, passwordResetFields);
};

schema.methods.gcPasswordResetImmediate = function (onlyClear = false) {
  gcPasswordReset.end(this, onlyClear);
};

schema.methods.createPasswordResetToken = function () {
  return createCryptoTokenInformation(
    this,
    passwordResetFields,
    Date.now() + 10 * 60 * 1000
  );
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
