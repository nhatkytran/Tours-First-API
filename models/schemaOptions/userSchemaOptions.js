const validator = require('validator');

const userSchemaOptions = {
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
    select: false,
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
  active: {
    type: Boolean,
    select: false,
  },
  activateToken: {
    type: String,
  },
  activateTokenExpires: {
    type: Date,
  },
};

module.exports = userSchemaOptions;
