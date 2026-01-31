'use strict';

const { supabase } = require('../config/supabase');
const userRepository = require('../repositories/userRepository');

// In-memory caches with TTL
const USER_PROFILE_CACHE = new Map(); // key: email, value: { profile, expiresAt }
const AUTH_USER_CACHE = new Map(); // key: token, value: { user, expiresAt }

const USER_PROFILE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const AUTH_USER_CACHE_TTL = 1 * 60 * 1000; // 1 minute

// Clean up expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of USER_PROFILE_CACHE.entries()) {
    if (value.expiresAt < now) {
      USER_PROFILE_CACHE.delete(key);
    }
  }
  for (const [key, value] of AUTH_USER_CACHE.entries()) {
    if (value.expiresAt < now) {
      AUTH_USER_CACHE.delete(key);
    }
  }
}, 60 * 1000); // Clean every minute

function extractToken(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (req.cookies && req.cookies.auth_token) {
    return req.cookies.auth_token;
  }

  if (authHeader && typeof authHeader === 'string') {
    const [scheme, token] = authHeader.split(' ');
    if (scheme === 'Bearer' && token) {
      return token;
    }
  }

  return null;
}

async function requireAuth(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    // Check cache for Supabase auth user
    let authUser = null;
    const cachedAuth = AUTH_USER_CACHE.get(token);
    if (cachedAuth && cachedAuth.expiresAt > Date.now()) {
      authUser = cachedAuth.user;
    } else {
      // Fetch from Supabase
      const { data, error } = await supabase.auth.getUser(token);

      if (error || !data || !data.user) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      authUser = data.user;
      // Cache the auth user
      AUTH_USER_CACHE.set(token, {
        user: authUser,
        expiresAt: Date.now() + AUTH_USER_CACHE_TTL
      });
    }

    const email = authUser.email || null;

    // Attach Supabase auth user info to the request. Important:
    // our DB tables (org_members/project_members/etc) reference the app's `users` table,
    // whose primary key is NOT the Supabase auth user id.
    req.user = {
      authId: authUser.id,
      email,
    };

    // Resolve app user profile by email and use its id for DB foreign keys.
    if (email) {
      // Check cache for user profile
      let profile = null;
      const cachedProfile = USER_PROFILE_CACHE.get(email);
      if (cachedProfile && cachedProfile.expiresAt > Date.now()) {
        profile = cachedProfile.profile;
      } else {
        // Fetch from database
        profile = await userRepository.findByEmail(email);
        if (profile) {
          // Cache the profile
          USER_PROFILE_CACHE.set(email, {
            profile,
            expiresAt: Date.now() + USER_PROFILE_CACHE_TTL
          });
        }
      }

      if (!profile) {
        return res.status(404).json({ error: 'User profile not found' });
      }
      req.user.id = profile.id; // users.id (NOT supabase auth id)
      req.user.profile = profile;
    }

    return next();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error verifying Supabase token', err);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

async function requireAdmin(req, res, next) {
  if (!req.user || !req.user.email) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    // Use cached profile if available (from requireAuth)
    let profile = req.user.profile;
    if (!profile) {
      // Check cache first
      const cachedProfile = USER_PROFILE_CACHE.get(req.user.email);
      if (cachedProfile && cachedProfile.expiresAt > Date.now()) {
        profile = cachedProfile.profile;
      } else {
        profile = await userRepository.findByEmail(req.user.email);
        if (profile) {
          USER_PROFILE_CACHE.set(req.user.email, {
            profile,
            expiresAt: Date.now() + USER_PROFILE_CACHE_TTL
          });
        }
      }
    }

    if (!profile || !profile.is_admin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Optionally attach full profile
    req.user.profile = profile;
    req.user.id = profile.id;
    return next();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error checking admin privileges', err);
    return res.status(500).json({ error: 'Failed to verify admin privileges' });
  }
}

// Helper function to invalidate user profile cache (call this when user data is updated)
function invalidateUserCache(email) {
  if (email) {
    USER_PROFILE_CACHE.delete(String(email).toLowerCase());
  }
}

// Helper function to invalidate auth cache (call this on logout or token invalidation)
function invalidateAuthCache(token) {
  if (token) {
    AUTH_USER_CACHE.delete(String(token));
  }
}

module.exports = {
  requireAuth,
  requireAdmin,
  invalidateUserCache,
  invalidateAuthCache
};



