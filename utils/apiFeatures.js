const AppError = require('./appError');

class APIFeatures {
  constructor(model, queryObject) {
    this._model = model;
    this.query = model.find();
    this.queryObject = this._convertQueryObject(queryObject);
  }

  _convertQueryObject(queryObject) {
    const queryString = JSON.stringify(queryObject).replace(
      /\b(gte?|lte?)\b/g,
      match => `$${match}`
    );

    return JSON.parse(queryString);
  }

  filter() {
    this.query.find(this.queryObject);

    return this;
  }

  sort() {
    this.queryObject.sort
      ? this.query.sort(this.queryObject.sort.split(',').join(' '))
      : this.query.sort('-_id');

    return this;
  }

  project() {
    if (this.queryObject.fields) {
      const fieldsArray = this.queryObject.fields.split(',');

      if (fieldsArray.includes('createdAt'))
        throw new Error('Can not access createdAt property!');

      this.query.select(fieldsArray.join(' '));
    }

    return this;
  }

  async paginate() {
    const page = Number(this.queryObject.page) || 1;
    const limit = Number(this.queryObject.limit) || 100;

    if (!Number.isInteger(page) || !Number.isInteger(limit))
      throw new AppError('"page" and "limit" need to be an integer!', 400);

    const totalDocuments = await this._model.countDocuments(this.queryObject);
    const pages = Math.ceil(totalDocuments / limit);

    if (page < 0 || (page > pages && pages))
      throw new AppError('"page" not found!', 400);

    const skip = (page - 1) * limit;

    this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
