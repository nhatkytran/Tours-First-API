const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const Tour = require('./../../models/tourModel');

dotenv.config({ path: `${__dirname}/./../../config.env` });

const { DATABASE, DATABASE_PASSWORD } = process.env;
const [_, __, condition] = process.argv;

const importData = async () => {
  try {
    const data = JSON.parse(
      fs.readFileSync(`${__dirname}/./tours-simple.json`, 'utf-8')
    );

    const query = Tour.insertMany(data);
    const tours = await query;

    console.log(tours);
    console.log('Import data successfully');
  } catch (error) {
    console.error('Something went wrong importing data!');
    console.error(error);
  }
};

const deleteData = async () => {
  try {
    const query = Tour.deleteMany();
    const result = await query;

    console.log(result);
    console.log('Delete data successfully');
  } catch (error) {
    console.error('Something went wrong deleting data');
    console.error(error);
  }
};

(async () => {
  try {
    mongoose.connect(DATABASE.replace('<PASSWORD>', DATABASE_PASSWORD), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Database connected...');
    console.log('------------------------');

    if (condition === '--import') await importData();
    if (condition === '--delete') await deleteData();

    process.exit();
  } catch (error) {
    console.error('Something went wrong connecting database!');
    console.error(error);
  }
})();
