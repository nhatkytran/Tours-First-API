const bcrypt = require('bcryptjs');

const bcryptHashPassword = (password, hashCost) =>
  new Promise((resolve, reject) =>
    bcrypt.hash(password, hashCost, (error, hashPassword) => {
      if (error) reject(error);

      resolve(hashPassword);
    })
  );

module.exports = bcryptHashPassword;
