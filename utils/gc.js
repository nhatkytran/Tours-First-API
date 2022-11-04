class GC {
  constructor() {
    this.cache = {};
    this.clearedItems = [];
  }

  start(user, expiredTimestamp, clearedItems) {
    this.clearedItems = clearedItems;

    clearTimeout(this.cache[user._id]);

    this.cache[user._id] = setTimeout(
      this._clear.bind(this, user),
      expiredTimestamp - Date.now()
    );
  }

  end(user, onlyClear = false) {
    clearTimeout(this.cache[user._id]);

    if (onlyClear) {
      delete this.cache[user._id];
      this.clearedItems = [];
    }
    // Help avoid using 'save' in parallel
    else setTimeout(this._clear.bind(this, user), 0);
  }

  async _clear(user) {
    try {
      delete this.cache[user._id];

      for (let clearedItem of this.clearedItems) {
        user[clearedItem] = undefined;
      }

      this.clearedItems = [];

      await user.save({ validateModifiedOnly: true });

      console.log(
        `Clear metadata of user with id: ${
          user._id
        } at timestamp: ${Date.now()}`
      );
    } catch (error) {
      console.log(
        `Something went wrong clearing metadata of user with id: ${user._id}`
      );
      console.error(error);
    }
  }
}

module.exports = GC;
