const getJWT = require('./getJWT');
const sendJWTCookie = require('./sendJWTCookie');

const createSendToken = async (res, statusCode, user, sendInfo = false) => {
  const token = await getJWT(user.id);

  sendJWTCookie(res, 'jwtCookie', token);

  let info;
  if (sendInfo) {
    user.password = undefined;
    user.__v = undefined;
    // login
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
