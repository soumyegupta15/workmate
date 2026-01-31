'use strict';

const nodemailer = require('nodemailer');
const crypto = require('crypto');

const { supabase, supabaseAdmin } = require('../config/supabase');
const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
  FRONTEND_RESET_PASSWORD_URL
} = require('../config/env');
const userRepository = require('../repositories/userRepository');
const { hashPassword } = require('../utils/password');
const { USER_STATUS } = require('../enums');

const dbAuth = supabase;
const adminAuth = supabaseAdmin;

// Simple in-memory OTP store for signup flow.
// In production, consider persisting this in a dedicated table.
const signupOtps = new Map(); // key: email, value: { otp, expiresAt, password, name, isAdmin }

// Change password flow (logged-in user) - in-memory stores
// key: authId, value: { otp, expiresAt }
const changePasswordOtps = new Map();
// key: token, value: { authId, email, expiresAt }
const changePasswordTokens = new Map();

const CHANGE_PASSWORD_OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const CHANGE_PASSWORD_OTP_COOLDOWN_MS = 30 * 1000; // 30 seconds

// Forgot password flow (unauthenticated user) - in-memory stores
// key: email, value: { otp, expiresAt, lastSentAt }
const forgotPasswordOtps = new Map();
// key: token, value: { email, expiresAt }
const forgotPasswordTokens = new Map();

const FORGOT_PASSWORD_OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const FORGOT_PASSWORD_OTP_COOLDOWN_MS = 30 * 1000; // 30 seconds

function getMailer() {
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new Error('SMTP configuration is missing in environment variables');
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function generateOneTimeToken() {
  // 32 bytes -> 64 hex chars
  return crypto.randomBytes(32).toString('hex');
}

async function sendSignupOtp({ email, password, name, isAdmin }) {
  const existingUser = await userRepository.findByEmail(email);
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  const otp = generateOtp();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  signupOtps.set(email, { otp, expiresAt, password, name, isAdmin: !!isAdmin });

  const transporter = getMailer();
  await transporter.sendMail({
    from: SMTP_FROM || SMTP_USER,
    to: email,
    subject: 'Your Workmate signup OTP',
    text: `Your OTP for Workmate signup is ${otp}. It is valid for 10 minutes.`,
    html: `<p>Your OTP for Workmate signup is <strong>${otp}</strong>. It is valid for 10 minutes.</p>`
  });

  return { message: 'OTP sent successfully' };
}

async function verifySignupOtp({ email, otp }) {
  const entry = signupOtps.get(email);
  if (!entry) {
    throw new Error('No OTP request found for this email or it has expired');
  }

  if (Date.now() > entry.expiresAt) {
    signupOtps.delete(email);
    throw new Error('OTP has expired. Please request a new one.');
  }

  if (entry.otp !== otp) {
    throw new Error('Invalid OTP');
  }

  if (!adminAuth) {
    throw new Error('Supabase admin client is not configured (service role key missing)');
  }

  // Create user directly via admin API and mark email as confirmed
  const { data, error } = await adminAuth.auth.admin.createUser({
    email,
    password: entry.password,
    email_confirm: true
  });

  if (error) {
    throw new Error(error.message || 'Failed to sign up user with Supabase');
  }

  const passwordHash = await hashPassword(entry.password);

  await userRepository.insertOne({
    email,
    name: entry.name || null,
    password_hash: passwordHash,
    profile_image_url: null,
    status: USER_STATUS.ACTIVE,
    updated_at: null,
    is_admin: !!entry.isAdmin
  });

  signupOtps.delete(email);

  return {
    message: 'Signup successful',
    user: data.user
  };
}

async function login({ email, password }) {
  if (!dbAuth) {
    throw new Error('Supabase auth client is not configured');
  }

  const { data, error } = await dbAuth.auth.signInWithPassword({
    email,
    password
  });

  if (error || !data || !data.session) {
    const message = error && error.message ? error.message : 'Invalid email or password';
    const authError = new Error(message);
    authError.statusCode = 401;
    throw authError;
  }

  const userRecord = await userRepository.findByEmail(email);

  if (!userRecord) {
    const notFoundError = new Error('User profile not found');
    notFoundError.statusCode = 404;
    throw notFoundError;
  }

  return {
    message: 'Login successful',
    session: data.session,
    user: data.user,
    profile: userRecord
  };
}

async function forgotPassword({ email }) {
  // Check if user exists
  const userRecord = await userRepository.findByEmail(email);
  if (!userRecord) {
    // Don't reveal if user exists or not for security
    return { message: 'If this email is registered, an OTP has been sent.' };
  }

  // Rate limiting: check cooldown
  const existingEntry = forgotPasswordOtps.get(String(email).toLowerCase());
  if (existingEntry && existingEntry.lastSentAt) {
    const timeSinceLastSent = Date.now() - existingEntry.lastSentAt;
    if (timeSinceLastSent < FORGOT_PASSWORD_OTP_COOLDOWN_MS) {
      const error = new Error('Please wait before requesting another OTP');
      error.statusCode = 429;
      throw error;
    }
  }

  const otp = generateOtp();
  const expiresAt = Date.now() + FORGOT_PASSWORD_OTP_TTL_MS;
  forgotPasswordOtps.set(String(email).toLowerCase(), { otp, expiresAt, lastSentAt: Date.now() });

  const transporter = getMailer();
  await transporter.sendMail({
    from: SMTP_FROM || SMTP_USER,
    to: email,
    subject: 'Your Workmate password reset OTP',
    text: `Your OTP to reset your password is ${otp}. It is valid for 10 minutes.`,
    html: `<p>Your OTP to reset your password is <strong>${otp}</strong>. It is valid for 10 minutes.</p>`
  });

  return { message: 'If this email is registered, an OTP has been sent.' };
}

async function verifyForgotPasswordOtp({ email, otp }) {
  if (!email || !otp) {
    throw new Error('Email and OTP are required');
  }

  const entry = forgotPasswordOtps.get(String(email).toLowerCase());
  if (!entry) {
    throw new Error('No OTP request found for this email or it has expired');
  }

  if (Date.now() > entry.expiresAt) {
    forgotPasswordOtps.delete(String(email).toLowerCase());
    throw new Error('OTP has expired. Please request a new one.');
  }

  if (String(entry.otp) !== String(otp)) {
    throw new Error('Invalid OTP');
  }

  // OTP verified; mint short-lived reset token
  const token = generateOneTimeToken();
  forgotPasswordTokens.set(token, {
    email: String(email).toLowerCase(),
    expiresAt: Date.now() + FORGOT_PASSWORD_OTP_TTL_MS
  });
  forgotPasswordOtps.delete(String(email).toLowerCase());

  return { message: 'OTP verified', token };
}

async function resetPassword({ email, newPassword, token }) {
  if (!dbAuth || !adminAuth) {
    throw new Error('Supabase auth clients are not properly configured');
  }

  // Check if token is from forgot password OTP flow
  const forgotPasswordEntry = token ? forgotPasswordTokens.get(String(token)) : null;
  if (forgotPasswordEntry) {
    // Token is from OTP flow
    if (Date.now() > forgotPasswordEntry.expiresAt) {
      forgotPasswordTokens.delete(String(token));
      throw new Error('Reset token has expired. Please request a new OTP.');
    }
    if (String(forgotPasswordEntry.email).toLowerCase() !== String(email).toLowerCase()) {
      throw new Error('Email does not match reset token');
    }

    // Get user from database to find Supabase auth ID
    const userRecord = await userRepository.findByEmail(email);
    if (!userRecord) {
      throw new Error('User not found');
    }

    // Find Supabase user by email
    const { data: users, error: listError } = await adminAuth.auth.admin.listUsers();
    if (listError) {
      throw new Error('Failed to verify user');
    }
    const supabaseUser = users.users.find(u => u.email === email);
    if (!supabaseUser) {
      throw new Error('User not found in authentication system');
    }

    // Update password in Supabase Auth
    const { error: updateAuthError } = await adminAuth.auth.admin.updateUserById(
      supabaseUser.id,
      {
        password: newPassword
      }
    );

    if (updateAuthError) {
      throw new Error(updateAuthError.message || 'Failed to update password in Supabase auth');
    }

    // Update password hash in app database
    const passwordHash = await hashPassword(newPassword);
    await userRepository.updatePasswordHashByEmail(email, passwordHash);

    forgotPasswordTokens.delete(String(token));
    return { message: 'Password has been reset successfully' };
  }

  // Legacy Supabase token flow (from email link)
  // Verify the reset token and fetch the Supabase user
  const { data: userData, error: getUserError } = await dbAuth.auth.getUser(token);
  if (getUserError || !userData || !userData.user) {
    throw new Error('Invalid or expired password reset token');
  }

  const supabaseUser = userData.user;
  if (supabaseUser.email !== email) {
    throw new Error('Email does not match reset token');
  }

  const { error: updateAuthError } = await adminAuth.auth.admin.updateUserById(
    supabaseUser.id,
    {
      password: newPassword
    }
  );

  if (updateAuthError) {
    throw new Error(updateAuthError.message || 'Failed to update password in Supabase auth');
  }

  const passwordHash = await hashPassword(newPassword);
  await userRepository.updatePasswordHashByEmail(email, passwordHash);

  return { message: 'Password has been reset successfully' };
}

async function sendChangePasswordOtp({ authId, email }) {
  if (!authId || !email) {
    throw new Error('Not authenticated');
  }

  const key = String(authId);
  const existing = changePasswordOtps.get(key);
  if (existing && Date.now() < existing.expiresAt) {
    const lastSentAt = Number(existing.lastSentAt || 0);
    if (lastSentAt && Date.now() - lastSentAt < CHANGE_PASSWORD_OTP_COOLDOWN_MS) {
      const err = new Error('Please wait a few seconds before requesting another OTP.');
      err.statusCode = 429;
      throw err;
    }
  }

  const otp = generateOtp();
  const now = Date.now();
  const expiresAt = now + CHANGE_PASSWORD_OTP_TTL_MS;
  changePasswordOtps.set(key, {
    otp,
    expiresAt,
    email: String(email),
    lastSentAt: now
  });

  const transporter = getMailer();
  await transporter.sendMail({
    from: SMTP_FROM || SMTP_USER,
    to: email,
    subject: 'Your Workmate change password OTP',
    text: `Your OTP to change your password is ${otp}. It is valid for 10 minutes.`,
    html: `<p>Your OTP to change your password is <strong>${otp}</strong>. It is valid for 10 minutes.</p>`
  });

  return { message: 'OTP sent successfully' };
}

async function verifyChangePasswordOtp({ authId, email, otp }) {
  if (!authId || !email) {
    throw new Error('Not authenticated');
  }
  const entry = changePasswordOtps.get(String(authId));
  if (!entry) {
    throw new Error('No OTP request found or it has expired');
  }
  if (Date.now() > entry.expiresAt) {
    changePasswordOtps.delete(String(authId));
    throw new Error('OTP has expired. Please request a new one.');
  }
  if (String(entry.email || '').toLowerCase() !== String(email).toLowerCase()) {
    throw new Error('Email mismatch');
  }
  if (String(entry.otp) !== String(otp)) {
    throw new Error('Invalid OTP');
  }

  // OTP verified; mint short-lived reset token
  const token = generateOneTimeToken();
  changePasswordTokens.set(token, { authId: String(authId), email: String(email), expiresAt: Date.now() + 10 * 60 * 1000 });
  changePasswordOtps.delete(String(authId));

  return { message: 'OTP verified', token };
}

async function resetPasswordWithChangeToken({ authId, email, token, newPassword }) {
  if (!authId || !email) {
    throw new Error('Not authenticated');
  }
  if (!adminAuth) {
    throw new Error('Supabase admin client is not configured (service role key missing)');
  }
  const entry = token ? changePasswordTokens.get(String(token)) : null;
  if (!entry) {
    throw new Error('Invalid or expired reset token');
  }
  if (Date.now() > entry.expiresAt) {
    changePasswordTokens.delete(String(token));
    throw new Error('Reset token has expired. Please request a new OTP.');
  }
  if (String(entry.authId) !== String(authId) || String(entry.email).toLowerCase() !== String(email).toLowerCase()) {
    throw new Error('Invalid reset token');
  }

  // 1) Update Supabase Auth password for the current user
  const { error: updateAuthError } = await adminAuth.auth.admin.updateUserById(String(authId), {
    password: newPassword
  });
  if (updateAuthError) {
    throw new Error(updateAuthError.message || 'Failed to update password in Supabase auth');
  }

  // 2) Update app DB password hash
  const passwordHash = await hashPassword(newPassword);
  await userRepository.updatePasswordHashByEmail(email, passwordHash);

  changePasswordTokens.delete(String(token));

  return { message: 'Password has been updated successfully' };
}

module.exports = {
  sendSignupOtp,
  verifySignupOtp,
  login,
  forgotPassword,
  verifyForgotPasswordOtp,
  resetPassword,
  sendChangePasswordOtp,
  verifyChangePasswordOtp,
  resetPasswordWithChangeToken
};


