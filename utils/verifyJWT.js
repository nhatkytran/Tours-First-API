const jwt = require('jsonwebtoken');

const { JWT_SECRET } = process.env;

const verifyJWT = async token =>
  new Promise((resolve, reject) => {
    jwt.verify(token, JWT_SECRET, (error, decoded) => {
      if (error) reject(error);

      resolve(decoded);
    });
  });

module.exports = verifyJWT;
