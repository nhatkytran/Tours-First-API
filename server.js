const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: `${__dirname}/./config.env` });

const app = require('./app');

const { NODE_ENV, PORT, DATABASE, DATABASE_PASSWORD } = process.env;

try {
  mongoose.connect(DATABASE.replace('<PASSWORD>', DATABASE_PASSWORD), {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  console.log('Database connected...');
  console.log('------------------------');
} catch (error) {
  console.error('Something went wrong connecting database!');
  console.error(error);
}

const port = PORT || 3000;

app.listen(port, () => {
  console.log('Server starts...');
  console.log('Environment:', NODE_ENV);
  console.log(`Check port: ${port}`);
  console.log('------------------------');
});
