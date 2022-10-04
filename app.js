const express = require('express');
const morgan = require('morgan');

const tourRouter = require('./routes/tourRoute');

const app = express();

const { NODE_ENV } = process.env;

app.use(express.json());

if (NODE_ENV === 'development') app.use(morgan('dev'));

app.use('/api/v1/tours', tourRouter);

module.exports = app;
