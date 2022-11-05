const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const createSendToken = require('./../utils/createSendToken');
const User = require('./../models/userModel');
const verifyJWT = require('./../utils/verifyJWT');

exports.signup = catchAsync(async (req, res) => {
  // 1. Create user
  const { name, email, password, passwordConfirm } = req.body;

  const query = User.create({
    name,
    email,
    password,
    passwordConfirm,
  });
  const user = await query;

  // 2. Send token
  await createSendToken(res, 200, user, true);
});

exports.login = catchAsync(async (req, res, next) => {
  // 1. Login credentials
  const { email, password } = req.body;

  if (!email || !password)
    return next(new AppError('Please provide email and password!', 400));

  // 2. Check user and password
  const query = User.findOne({ email }).select('+password');
  const user = await query;

  if (!user || !(await user.correctPassword(String(password))))
    return next(new AppError('Email or password is not correct!', 401));

  // 3. Send token
  await createSendToken(res, 200, user);
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1. Check headers authorization
  const { authorization } = req.headers;

  if (!authorization || !authorization.startsWith('Bearer'))
    return next(new AppError('Please login to get access!', 401));

  // 2. Verify token
  const token = authorization.split(' ').at(-1);
  const decoded = await verifyJWT(token);

  // 3. Check if user exists
  const query = User.findById(decoded.id);
  const user = await query;

  if (!user)
    return next(
      new AppError(
        'The user belonging to this token does no longer exist!',
        401
      )
    );

  // 4. Check if user changed password after token was issued
  if (user.changedPassword(decoded.iat))
    return next(new AppError('User has recently changed password', 401));

  // Grant user permission
  req.user = user;

  next();
});

exports.restrictTo =
  (...roles) =>
  async (req, _, next) => {
    const query = User.findById(req.user._id).select('+role');
    const user = await query;

    if (!user)
      return next(
        new AppError(
          'Something went wrong checking a role of user. Please try again!',
          500
        )
      );

    if (!roles.includes(user.role))
      return next(
        new AppError(
          `Only ${roles.join(', ')} can get access to this route!`,
          403
        )
      );

    next();
  };

exports.checkActive = catchAsync(async (req, _, next) => {
  const query = User.findById(req.user._id).select('+active');
  const user = await query;

  if (user.active === false)
    return next(
      new AppError(
        'User is inactive! Use route /activateAccount to activate user',
        401
      )
    );

  next();
});
