const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');
const monthsInYear = require('./../utils/data/months-in-year');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

exports.aliasFiveBestCheap = (req, _, next) => {
  req.query = {
    ...req.query,
    sort: '-ratingsAverage, price',
    limit: '5',
  };

  next();
};

exports.getTourStats = catchAsync(async (_, res) => {
  const query = Tour.aggregate([
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRatings: { $avg: '$ratingsAverage' },
      },
    },
  ]);
  const tours = await query;

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: { tours },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res) => {
  const year = Number(req.params.year);

  const query = Tour.aggregate([
    { $unwind: '$startDates' },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTours: { $sum: 1 },
        tours: { $push: '$name' },
        startDates: { $push: '$startDates' },
      },
    },
    {
      $addFields: {
        month: {
          $arrayElemAt: [monthsInYear, '$_id'],
        },
      },
    },
    { $project: { _id: 0 } },
    { $sort: { month: 1 } },
  ]);

  const tours = await query;

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: { tours },
  });
});

exports.getAllTours = catchAsync(async (req, res) => {
  const features = new APIFeatures(Tour, req.query);

  // await because paginate is an async function
  // await model.countDocuments(query)
  await features.filter().sort().project().paginate();

  const tours = await features.query;

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: { tours },
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const query = Tour.findById(req.params.id);
  const tour = await query;

  if (!tour) return next(new AppError(`Invalid _id: ${req.params.id}`, 404));

  res.status(200).json({
    status: 'success',
    data: { tour },
  });
});

exports.createTour = catchAsync(async (req, res) => {
  const query = Tour.create(req.body);
  const tour = await query;

  res.status(201).json({
    status: 'success',
    data: { tour },
  });
});

exports.updateTour = catchAsync(async (req, res, next) => {
  const query = Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  const newTour = await query;

  if (!newTour) return next(new AppError(`Invalid _id: ${req.params.id}`, 404));

  res.status(200).json({
    status: 'success',
    data: { newTour },
  });
});

exports.deleteTour = catchAsync(async (req, res, next) => {
  const query = Tour.findByIdAndDelete(req.params.id);
  const deletedTour = await query;

  if (!deletedTour)
    return next(new AppError(`Invalid _id: ${req.params.id}`, 404));

  res.status(200).json({
    status: 'success',
    data: { deletedTour },
  });
});
