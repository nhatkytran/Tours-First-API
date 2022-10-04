const mongoose = require('mongoose');
const slugify = require('slugify');

const schema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      trim: true,
      required: [true, 'A tour must have a name!'],
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: 1,
      max: 5,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price!'],
    },
    priceDiscount: {
      type: Number,
      validate: [
        {
          validator: () => true,
          message: 'Nothing wrong here!',
        },
        {
          validator: function (value) {
            if (this.price) return value < this.price;
          },
          message: 'Price discount ({VALUE}) must be below Price',
        },
      ],
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration!'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a max group size!'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty!'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'A difficulty is neither: easy, medium, difficult!',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary!'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have an image cover!'],
    },
    images: {
      type: [String],
    },
    createdAt: {
      type: Date,
      default: Date.now,
      select: false,
    },
    startDates: {
      type: [Date],
    },
    slug: {
      type: String,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    id: false,
  }
);

schema.virtual('durationWeeks').get(function () {
  if (this.duration) return this.duration / 7;
});

// Document middleware
schema.pre('save', function (next) {
  this.startTime = Date.now();
  this.slug = slugify(this.name, { lower: true });

  next();
});

schema.post('save', function (_, next) {
  console.log('Process took:', Date.now() - this.startTime, 'milliseconds');

  next();
});

// Query middleware
schema.pre(/^find/, function (next) {
  this.startTime = Date.now();

  next();
});

schema.post(/^find/, function (_, next) {
  console.log('Process took:', Date.now() - this.startTime, 'milliseconds');

  next();
});

// Aggregation middleware
schema.pre('aggregate', function (next) {
  this.startTime = Date.now();

  next();
});

schema.post('aggregate', function (_, next) {
  console.log('Process took:', Date.now() - this.startTime, 'milliseconds');

  next();
});

const model = mongoose.model('Tour', schema, 'tours');

module.exports = model;
