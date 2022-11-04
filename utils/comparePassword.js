const bcrypt = require('bcryptjs');

const bcryptComparePassword = (password, userPassword) =>
  new Promise((resolve, reject) => {
    bcrypt.compare(password, userPassword, (error, same) => {
      if (error) reject(error);

      // same => true | false
      resolve(same);
    });
  });

module.exports = bcryptComparePassword;
