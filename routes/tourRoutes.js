const express = require('express');

const {
  getAllTours,
  getTour,
  aliasFiveBestCheap,
  getTourStats,
  getMonthlyPlan,
  createTour,
  updateTour,
  deleteTour,
} = require('./../controllers/tourController');

const router = express.Router();

// Home
router.route('/').get(getAllTours).post(createTour);

// Aliasing
router.route('/5-best-cheap').get(aliasFiveBestCheap, getAllTours);

// Statistics
router.route('/tour-stats').get(getTourStats);
router.route('/monthly-plan/:year').get(getMonthlyPlan);

// Params
router.route('/:id').get(getTour).patch(updateTour).delete(deleteTour);

module.exports = router;
