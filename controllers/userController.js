const User = require('./../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('./../utils/catchAsync');

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
