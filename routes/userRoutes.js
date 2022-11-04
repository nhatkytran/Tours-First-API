const express = require('express');

const {
  signup,
  login,
  protect,
  restrictTo,
} = require('./../controllers/authController');
const {
  forgotPassword,
  resetPassword,
  updatePassword,
  updateUserName,
  updateEmail,
  resetEmail,
  confirmEmail,
} = require('./../controllers/authUpdateController');
const { getAllUsers, updateUser } = require('./../controllers/userController');

const router = express.Router();

router.route('/signup').post(signup);
router.route('/login').post(login);

router.route('/forgotPassword').post(forgotPassword);
router.route('/resetPassword/:email/:token').patch(resetPassword);

router.route('/updatePassword').patch(protect, updatePassword);
router.route('/updateUserName').patch(protect, updateUserName);

router.route('/updateEmail').post(protect, updateEmail);
router.route('/resetEmail/:email/:token').patch(resetEmail);
router.route('/confirmEmail/:email/:currentEmail/:token').patch(confirmEmail);

router.route('/').get(protect, restrictTo('admin', 'lead-guide'), getAllUsers);

router.route('/:id').patch(updateUser);

module.exports = router;
