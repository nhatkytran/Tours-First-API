const { NODE_ENV, JWT_COOKIE_EXPIRES } = process.env;

const sendJWTCookie = (res, cookieName, token) => {
  const cookieOptions = {
    expires: new Date(
      Date.now() + Number(JWT_COOKIE_EXPIRES) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: false,
  };

  if (NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie(cookieName, token, cookieOptions);
};

module.exports = sendJWTCookie;
