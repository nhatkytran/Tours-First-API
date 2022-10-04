const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');

const monthsInYear = require('./../utils/data/months-in-year');

exports.aliasFiveBestCheap = (req, _, next) => {
  req.query = {
    ...req.query,
    sort: '-ratingsAverage, price',
    limit: '5',
  };

  next();
};

exports.getTourStats = async (_, res) => {
  try {
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
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error,
    });
  }
};

exports.getMonthlyPlan = async (req, res) => {
  try {
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
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error,
    });
  }
};

exports.getAllTours = async (req, res) => {
  try {
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
  } catch (error) {
    console.log(error);

    res.status(400).json({
      status: 'fail',
      message: error,
    });
  }
};

exports.getTour = async (req, res) => {
  try {
    const query = Tour.findById(req.params.id);
    const tour = await query;

    res.status(200).json({
      status: 'success',
      data: { tour },
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error,
    });
  }
};

exports.createTour = async (req, res) => {
  try {
    const query = Tour.create(req.body);
    const tour = await query;

    res.status(201).json({
      status: 'success',
      data: { tour },
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error,
    });
  }
};

exports.updateTour = async (req, res) => {
  try {
    const query = Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    const newTour = await query;

    res.status(200).json({
      status: 'success',
      data: { newTour },
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error,
    });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    const query = Tour.findByIdAndDelete(req.params.id);
    const deletedTour = await query;

    res.status(200).json({
      status: 'success',
      data: { deletedTour },
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error,
    });
  }
};
