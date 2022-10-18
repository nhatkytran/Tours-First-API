const express = require('express');

const { getAllUsers, updateUser } = require('./../controllers/userController');

const router = express.Router();

router.route('/').get(getAllUsers);

router.route('/:id').patch(updateUser);

module.exports = router;
