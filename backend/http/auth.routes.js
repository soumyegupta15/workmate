'use strict';

const express = require('express');

const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const {
  signupValidator,
  sendOtpValidator,
  verifyOtpValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator
} = require('../validators/authValidators');
const { handleValidation } = require('../validators');

const router = express.Router();

// Signup aliases send OTP for the first step of registration
router.post('/signup', signupValidator, handleValidation, authController.signup);
router.post('/send-otp', sendOtpValidator, handleValidation, authController.sendOtp);
router.post('/verify-otp', verifyOtpValidator, handleValidation, authController.verifyOtp);
router.post('/login', loginValidator, handleValidation, authController.login);
router.post(
  '/forgot-password',
  forgotPasswordValidator,
  handleValidation,
  authController.forgotPassword
);
router.post(
  '/forgot-password/verify-otp',
  verifyOtpValidator,
  handleValidation,
  authController.verifyForgotPasswordOtp
);
router.post(
  '/reset-password',
  resetPasswordValidator,
  handleValidation,
  authController.resetPassword
);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.me);

// Change password (OTP) - must be logged in
router.post('/change-password/send-otp', requireAuth, authController.sendChangePasswordOtp);
router.post('/change-password/verify-otp', requireAuth, authController.verifyChangePasswordOtp);
router.post('/change-password/reset', requireAuth, authController.resetPasswordWithChangeToken);

module.exports = router;


