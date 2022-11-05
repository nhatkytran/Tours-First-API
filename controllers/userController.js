const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const User = require('./../models/userModel');

exports.getAllUsers = catchAsync(async (_, res) => {
  const query = User.find();
  const users = await query;

  res.status(200).json({
    status: 'success',
    result: users.length,
    data: { users },
  });
});

exports.updateUser = catchAsync(async (req, res, next) => {
  const query = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  const user = await query;

  if (!user) next(new AppError(`Invalid _id: ${req.params.id}`, 400));

  res.status(200).json({
    status: 'success',
    data: { user },
  });
});

exports.getOneUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const query = User.findById(id);
  const user = await query;

  if (!user) return next(new AppError('User not found!', 404));

  res.status(200).json({
    status: 'success',
    data: { user },
  });
});
