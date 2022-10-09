const AppError = require('../utils/appError');

const { NODE_ENV } = process.env;

const sendErrorDev = (res, error) => {
  const { statusCode, status, message, stack } = error;

  res.status(statusCode || 500).json({
    status: status || 'error',
    message,
    stack,
    error,
  });
};

const sendErrorProd = (res, error) => {
  const { statusCode, status, message, isOperational } = error;

  if (isOperational)
    return res.status(statusCode || 500).json({
      status: status || 'error',
      message,
    });

  console.error(error);

  res.status(statusCode || 500).json({
    status: 'error',
    message: 'Something went wrong!',
  });
};

const handleCastErrorDB = error =>
  new AppError(`Invalid ${error.path}: ${error.value}`, 400);

const handleDuplicateErrorDB = error => {
  const [key, value] = Object.entries(error.keyValue)[0];

  return new AppError(
    `Duplicate field < ${key} >: < ${value} >. Please use another value!`,
    400
  );
};

const handleValidationErrorDB = error => {
  const errors = Object.values(error.errors).map(item => item.message);

  return new AppError(`Invalid input data. ${errors.join('. ')}`, 400);
};

const globalErrorHandler = (error, _, res, __) => {
  if (NODE_ENV === 'development') sendErrorDev(res, error);
  if (NODE_ENV === 'production') {
    let newError = Object.create(error);

    if (newError.name === 'CastError') newError = handleCastErrorDB(newError);
    if (newError.code === 11000) newError = handleDuplicateErrorDB(newError);
    if (newError.name === 'ValidationError')
      newError = handleValidationErrorDB(newError);

    sendErrorProd(res, newError);
  }
};

module.exports = globalErrorHandler;
