process.on('uncaughtException', error => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(error);

  process.exit(1);
});

const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: `${__dirname}/./config.env` });

const app = require('./app');

const { NODE_ENV, PORT, DATABASE, DATABASE_PASSWORD } = process.env;

mongoose
  .connect(DATABASE.replace('<PASSWORD>', DATABASE_PASSWORD), {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Database connected...');
    console.log('------------------------');
  });

const port = PORT || 3000;

const server = app.listen(port, () => {
  console.log('Server starts...');
  console.log('Environment:', NODE_ENV);
  console.log(`Check port: ${port}`);
  console.log('------------------------');
});

process.on('unhandledRejection', error => {
  console.error('UNHANDLED REJECTION! Shutting down...');
  console.error(error);

  server.close(() => process.exit(1));
});
