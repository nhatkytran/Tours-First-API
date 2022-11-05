const express = require('express');

const {
  signup,
  login,
  protect,
  restrictTo,
  checkActive,
} = require('./../controllers/authController');
const {
  forgotPassword,
  resetPassword,
  updatePassword,
  updateUserName,
  updateEmail,
  resetEmail,
  confirmEmail,
  deleteAccount,
  activateAccount,
  activateAccountConfirm,
} = require('./../controllers/authUpdateController');
const {
  getAllUsers,
  updateUser,
  getOneUser,
} = require('./../controllers/userController');

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

router.route('/deleteAccount').delete(protect, deleteAccount);
router.route('/activateAccount').post(activateAccount);
router
  .route('/activateAccountConfirm/:email/:token')
  .patch(activateAccountConfirm);

router.route('/:id').get(protect, checkActive, getOneUser).patch(updateUser);
router.route('/').get(protect, restrictTo('admin', 'lead-guide'), getAllUsers);

module.exports = router;
