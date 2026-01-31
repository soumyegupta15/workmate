'use strict';

const authService = require('../services/authService');
const { NODE_ENV } = require('../config/env');
const userRepository = require('../repositories/userRepository');

async function handle(controllerFn, req, res) {
  try {
    const result = await controllerFn(req, res);
    if (!res.headersSent) {
      res.json(result);
    }
  } catch (err) {
    const status = err.statusCode || 400;
    if (status >= 500) {
      // eslint-disable-next-line no-console
      console.error(err);
    }
    res.status(status).json({
      error: err.message || 'Unexpected error'
    });
  }
}

function signup(req, res) {
  const { email, password, name, isAdmin } = req.body;
  return handle(() => authService.sendSignupOtp({ email, password, name, isAdmin }), req, res);
}

function sendOtp(req, res) {
  const { email, password, name, isAdmin } = req.body;
  return handle(() => authService.sendSignupOtp({ email, password, name, isAdmin }), req, res);
}

function verifyOtp(req, res) {
  const { email, otp } = req.body;
  return handle(() => authService.verifySignupOtp({ email, otp }), req, res);
}

function login(req, res) {
  const { email, password } = req.body;
  return handle(async () => {
    const result = await authService.login({ email, password });

    if (result.session && result.session.access_token) {
      res.cookie('auth_token', result.session.access_token, {
        httpOnly: true,
        secure: NODE_ENV === 'production',
        sameSite: 'lax',
        // Use Supabase session expiry (in seconds) when available, otherwise 7 days
        maxAge: (result.session.expires_in || 7 * 24 * 60 * 60) * 1000
      });
    }

    return result;
  }, req, res);
}

function forgotPassword(req, res) {
  const { email } = req.body;
  return handle(() => authService.forgotPassword({ email }), req, res);
}

function verifyForgotPasswordOtp(req, res) {
  const { email, otp } = req.body;
  return handle(() => authService.verifyForgotPasswordOtp({ email, otp }), req, res);
}

function resetPassword(req, res) {
  const { email, newPassword, token } = req.body;
  return handle(() => authService.resetPassword({ email, newPassword, token }), req, res);
}

function logout(req, res) {
  return handle(() => {
    // Invalidate auth cache
    const { invalidateAuthCache } = require('../middleware/auth');
    const token = req.cookies?.auth_token || req.headers?.authorization?.split(' ')[1];
    if (token) {
      invalidateAuthCache(token);
    }

    res.cookie('auth_token', '', {
      httpOnly: true,
      secure: NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0
    });

    return { message: 'Logged out successfully' };
  }, req, res);
}

function me(req, res) {
  return handle(async () => {
    if (!req.user || !req.user.email) {
      const error = new Error('Not authenticated');
      error.statusCode = 401;
      throw error;
    }

    // requireAuth already resolves and attaches the profile via userRepository.findByEmail.
    // Avoid a second DB call here (can cause noisy failures if Supabase is transient).
    const profile = req.user.profile || null;
    if (!profile) {
      const error = new Error('User profile not found');
      error.statusCode = 404;
      throw error;
    }

    return { profile };
  }, req, res);
}

function sendChangePasswordOtp(req, res) {
  return handle(async () => {
    const authId = req.user && req.user.authId ? String(req.user.authId) : null;
    const email = req.user && req.user.email ? String(req.user.email) : null;
    if (!authId || !email) {
      const error = new Error('Not authenticated');
      error.statusCode = 401;
      throw error;
    }
    return authService.sendChangePasswordOtp({ authId, email });
  }, req, res);
}

function verifyChangePasswordOtp(req, res) {
  return handle(async () => {
    const authId = req.user && req.user.authId ? String(req.user.authId) : null;
    const email = req.user && req.user.email ? String(req.user.email) : null;
    const { otp } = req.body || {};
    if (!authId || !email) {
      const error = new Error('Not authenticated');
      error.statusCode = 401;
      throw error;
    }
    if (!otp) {
      const error = new Error('otp is required');
      error.statusCode = 400;
      throw error;
    }
    return authService.verifyChangePasswordOtp({ authId, email, otp: String(otp) });
  }, req, res);
}

function resetPasswordWithChangeToken(req, res) {
  return handle(async () => {
    const authId = req.user && req.user.authId ? String(req.user.authId) : null;
    const email = req.user && req.user.email ? String(req.user.email) : null;
    const { token, newPassword } = req.body || {};
    if (!authId || !email) {
      const error = new Error('Not authenticated');
      error.statusCode = 401;
      throw error;
    }
    if (!token) {
      const error = new Error('token is required');
      error.statusCode = 400;
      throw error;
    }
    if (!newPassword) {
      const error = new Error('newPassword is required');
      error.statusCode = 400;
      throw error;
    }
    return authService.resetPasswordWithChangeToken({
      authId,
      email,
      token: String(token),
      newPassword: String(newPassword)
    });
  }, req, res);
}

module.exports = {
  signup,
  sendOtp,
  verifyOtp,
  login,
  forgotPassword,
  verifyForgotPasswordOtp,
  resetPassword,
  logout,
  me,
  sendChangePasswordOtp,
  verifyChangePasswordOtp,
  resetPasswordWithChangeToken
};


