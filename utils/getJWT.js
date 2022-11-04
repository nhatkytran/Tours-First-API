const jwt = require('jsonwebtoken');

const AppError = require('./appError');

const { JWT_SECRET, JWT_EXPIRES } = process.env;

const getJWT = id =>
  new Promise((resolve, reject) =>
    jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRES }, (error, jwt) => {
      if (error)
        reject(
          new AppError('Something went wrong generating Json Web Token!', 500)
        );

      resolve(jwt);
    })
  );

module.exports = getJWT;
