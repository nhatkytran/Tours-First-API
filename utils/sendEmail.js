const nodemailer = require('nodemailer');

const { EMAIL_USERNAME, EMAIL_PASSWORD, EMAIL_HOST, EMAIL_PORT } = process.env;

const sendEmail = async ({ email, subject, message }) => {
  // 1. Create transporter
  const transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    auth: {
      user: EMAIL_USERNAME,
      pass: EMAIL_PASSWORD,
    },
  });

  // 2. Define email options
  const mailOptions = {
    from: 'Tran Nhat Ky < nhatky.tran.2002 @gmail.com >',
    to: email,
    subject,
    text: message,
  };

  // 3. Send email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
