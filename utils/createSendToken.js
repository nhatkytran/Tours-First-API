const getJWT = require('./getJWT');

const createSendToken = async (res, statusCode, user, sendInfo = false) => {
  const token = await getJWT(user.id);

  let info;
  if (sendInfo) {
    user.password = undefined;
    user.__v = undefined;
    info = { data: { user } };
  } else {
    info = {};
  }

  res.status(statusCode).json({
    status: 'success',
    token,
    ...info,
  });
};

module.exports = createSendToken;
