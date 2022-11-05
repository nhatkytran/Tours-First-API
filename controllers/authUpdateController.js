const crypto = require('crypto');
const validator = require('validator');

const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const createSendToken = require('./../utils/createSendToken');
const sendEmail = require('./../utils/sendEmail');
const User = require('./../models/userModel');

const { NODE_ENV } = process.env;

const sendTokenToEmail = async (res, token, emailOptions, clearCallback) => {
  try {
    const { email, subject, message } = emailOptions;

    await sendEmail({ email, subject, message });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
      resetEmail: email,
      resetToken: token,
    });
  } catch (error) {
    if (NODE_ENV === 'development') console.error(error);

    if (clearCallback) clearCallback();

    throw new AppError(
      'Something went wrong sending an email. Please try again!',
      500
    );
  }
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1. Check email
  const { email } = req.body;

  if (!email) return next(new AppError('Please provide your email!', 400));

  if (!validator.isEmail(email))
    return next(new AppError('Please provide a valid email!', 400));

  // 2. Find user
  const query = User.findOne({ email });
  const user = await query;

  if (!user) return next(new AppError('User of this email not found!', 404));

  // 3. Create password reset information and password reset token
  const resetToken = user.createPasswordResetToken();

  // Clear previous password reset timeout
  user.gcPasswordResetImmediate(true);

  // Start garbage collector
  user.gcPasswordResetStart();

  try {
    await user.save({ validateModifiedOnly: true });
  } catch (error) {
    user.gcPasswordResetImmediate(true);

    return next(error);
  }

  // 4. Send token to email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/users/resetPassword/${email}/${resetToken}`;
  const subject = 'Your password reset token (only valid for 10 mins)';
  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  await sendTokenToEmail(
    res,
    resetToken,
    {
      email,
      subject,
      message,
    },
    user.gcPasswordResetImmediate
  );
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1. Find user with email, token and token has not expired
  const { email, token } = req.params;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const query = User.findOne({
    email,
    passwordBeingReset: true,
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  const user = await query;

  if (!user)
    return next(
      new AppError('Invalid email - token or token has expired!', 401)
    );

  // 2. Check password
  const { password, passwordConfirm } = req.body;

  if (!password || !passwordConfirm)
    return next(
      new AppError('Please provide password and passwordConfirm!', 400)
    );

  // 3. Reset password
  user.password = password;
  user.passwordConfirm = passwordConfirm;

  await user.save({ validateModifiedOnly: true });

  // 4. Clear password reset information
  user.gcPasswordResetImmediate();

  // 5. Send token
  await createSendToken(res, 200, user);
});

const getUserInformation = async id => {
  const query = User.findById(id).select('+password').select('active');
  const user = await query;

  if (!user)
    throw new AppError(
      "Something went wrong getting user's information. Please try again!",
      500
    );

  return user;
};

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1. Get user's information
  const user = await getUserInformation(req.user._id);

  // 2. Check user's input
  const { currentPassword, newPassword, newPasswordConfirm } = req.body;

  if (!currentPassword || !newPassword || !newPasswordConfirm)
    return next(
      new AppError(
        'Please provide currentPassword, newPassword and newPasswordConfirm',
        400
      )
    );

  // 3. Check current password
  if (!(await user.correctPassword(String(currentPassword))))
    return next(new AppError('Incorrect currentPassword!', 401));

  // 4. Update password
  user.password = newPassword;
  user.passwordConfirm = newPasswordConfirm;

  await user.save({ validateModifiedOnly: true });

  // 5. Send token
  await createSendToken(res, 200, user);
});

exports.updateUserName = catchAsync(async (req, res, next) => {
  // 1. Find user's information
  const user = await getUserInformation(req.user._id);

  // 2. Check currentPassword and newName
  const { currentPassword, newName } = req.body;

  if (!currentPassword || !newName)
    return next(
      new AppError('Please provide currentPassword and newName!', 400)
    );

  // 3. Check current password
  if (!(await user.correctPassword(String(currentPassword))))
    return next(new AppError('Incorrect currentPassword!', 401));

  // 4. Update user's name
  user.name = newName;

  await user.save({ validateModifiedOnly: true });

  // 5. Send successful message
  res.status(200).json({
    status: 'success',
    newName,
  });
});

exports.updateEmail = catchAsync(async (req, res, next) => {
  // 1. Get user's information
  const user = await getUserInformation(req.user._id);

  // 2. Check currentPassword
  const { currentPassword } = req.body;

  if (!currentPassword)
    return next(new AppError('Please provide currentPassword!', 400));

  if (!(await user.correctPassword(String(currentPassword))))
    return next(new AppError('Incorrect currentPassword!', 401));

  // Clear previous email update timeout
  user.gcEmailUpdateImmediate(true);

  // 3. Create email update token
  const token = user.createEmailUpdateToken();

  // Start garbage collector
  user.gcEmailUpdateStart();

  try {
    await user.save({ validateModifiedOnly: true });
  } catch (error) {
    user.gcEmailUpdateImmediate(true);

    throw error;
  }

  // 4. Send token to email
  const resetURL = `${req.protocol}://${req.get('host')}/api/users/resetEmail/${
    user.email
  }/${token}`;
  const subject = 'Your email reset token (only valid for 10 mins)';
  const message = `Want to change your email? Submit a PATCH request with your new email and emailConfirm to: ${resetURL}.\nIf you didn't want to, please ignore this email!`;

  await sendTokenToEmail(
    res,
    token,
    {
      email: user.email,
      subject,
      message,
    },
    user.gcEmailUpdateImmediate
  );
});

exports.resetEmail = catchAsync(async (req, res, next) => {
  // 1. Find user information
  const currentEmail = req.params.email;
  const token = req.params.token;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const query = User.findOne({
    email: currentEmail,
    emailBeingUpdate: true,
    emailToken: hashedToken,
    emailTokenExpires: { $gt: Date.now() },
  });
  const user = await query;

  if (!user)
    return next(
      new AppError('Invalid email - token or token has expired!', 401)
    );

  // 2. Check email and emailConfirm
  const { email, emailConfirm } = req.body;

  if (!email || !emailConfirm)
    return next(new AppError('Please provide email and emailConfirm!', 400));

  if (!validator.isEmail(email) || !validator.isEmail(emailConfirm))
    return next(
      new AppError('Please provide valid email and valid emailConfirm!', 400)
    );

  if (email !== emailConfirm)
    return next(new AppError('email and emailConfirm are not the same!', 400));

  // 3. Create email confirm
  // Clear previous email confirm timeout
  user.gcEmailConfirmImmediate(true);

  const confirmToken = user.createEmailConfirmToken();

  await user.save({ validateModifiedOnly: true });

  // Start garbage collector
  user.gcEmailConfirmStart();

  try {
    await user.save({ validateModifiedOnly: true });
  } catch (error) {
    user.gcEmailConfirmImmediate(true);

    throw error;
  }

  // 4. Send email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/users/confirmEmail/${email}/${currentEmail}/${confirmToken}`;
  const subject = 'Your email confirm token (only valid for 10 mins)';
  const message = `Enter this link to confirm your email: ${resetURL}`;

  await sendTokenToEmail(res, confirmToken, {
    email,
    subject,
    message,
  });

  // 5. Clear email update information
  user.gcEmailUpdateImmediate();
});

exports.confirmEmail = catchAsync(async (req, res, next) => {
  // 1. Find user's information
  const { email, currentEmail, token } = req.params;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const query = User.findOne({
    email: currentEmail,
    emailBeingConfirm: true,
    emailTokenConfirm: hashedToken,
    emailTokenConfirmExpires: { $gt: Date.now() },
  });
  const user = await query;

  if (!user)
    return next(
      new AppError(
        'Incorrect email - currentEmail - token or token has expired!',
        401
      )
    );

  // 2. Confirm email
  user.email = email;

  await user.save({ validateModifiedOnly: true });

  // 3. Clear email confirm information
  user.gcEmailConfirmImmediate();

  res.status(200).json({
    status: 'success',
    data: null,
  });
});

exports.deleteAccount = catchAsync(async (req, res, next) => {
  // 1. Get user's information
  const user = await getUserInformation(req.user._id);

  // 2. Check current password
  const { currentPassword } = req.body;

  if (!currentPassword)
    return next(new AppError('Please provide a current password!', 400));

  if (!(await user.correctPassword(String(currentPassword))))
    return next(new AppError('Incorrect currentPassword!', 401));

  // 3. Set active false
  user.active = false;

  await user.save({ validateModifiedOnly: true });

  // 4. Response
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.activateAccount = catchAsync(async (req, res, next) => {
  // 1. Check email
  const { email } = req.body;

  if (!email) return next(new AppError('Please provide a email!', 400));

  if (!validator.isEmail(email))
    return next(new AppError('Please provide a valid email!', 400));

  // 2. Find user and check active
  const query = User.findOne({ email, active: false });
  const user = await query;

  if (!user)
    return next(new AppError('User not found or user is already active', 400));

  // 2. Create activate token
  const token = user.createActivateToken();

  // Clear previous activate timeout
  user.gcActivateImmediate(true);

  // Start garbage collector
  user.gcActivateStart();

  try {
    await user.save({ validateModifiedOnly: true });
  } catch (error) {
    user.gcActivateImmediate(true);

    next(error);
  }

  // 3. Send email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/users/activateAccountConfirm/${email}/${token}`;
  const subject =
    'Your activate account confirm token (only valid for 10 mins)';
  const message = `Enter this link to confirm: ${resetURL}.\nIf it was not you, please ignore this email.`;

  await sendTokenToEmail(
    res,
    token,
    {
      email,
      subject,
      message,
    },
    user.gcActivateImmediate
  );
});

exports.activateAccountConfirm = catchAsync(async (req, res, next) => {
  // 1. Find user and check token
  const { email, token } = req.params;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const query = User.findOne({
    email,
    activateToken: hashedToken,
    activateTokenExpires: { $gt: Date.now() },
  });
  const user = await query;

  if (!user)
    return next(
      new AppError('Incorrect email - token or token has expired!', 401)
    );

  // 2. Activate user
  user.active = undefined;

  await user.save({ validateModifiedOnly: true });

  user.gcActivateImmediate();

  res.status(200).json({
    status: 'success',
    message: 'User is now active!',
  });
});
