'use strict';

const { body } = require('express-validator');

const emailField = body('email').isEmail().withMessage('Valid email is required');

const passwordField = body('password')
  .isLength({ min: 6 })
  .withMessage('Password must be at least 6 characters long');

const newPasswordField = body('newPassword')
  .isLength({ min: 6 })
  .withMessage('New password must be at least 6 characters long');

const otpField = body('otp')
  .isLength({ min: 4, max: 8 })
  .withMessage('OTP must be between 4 and 8 characters');

const tokenField = body('token').notEmpty().withMessage('Token is required');

const signupValidator = [
  emailField,
  passwordField,
  body('name').optional().isString(),
  body('isAdmin').optional().isBoolean().withMessage('isAdmin must be a boolean')
];

const sendOtpValidator = signupValidator;

const verifyOtpValidator = [emailField, otpField];

const loginValidator = [emailField, passwordField];

const forgotPasswordValidator = [emailField];

const resetPasswordValidator = [emailField, newPasswordField, tokenField];

module.exports = {
  signupValidator,
  sendOtpValidator,
  verifyOtpValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator
};


