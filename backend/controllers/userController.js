'use strict';

const userRepository = require('../repositories/userRepository');

async function handle(controllerFn, req, res) {
  try {
    const result = await controllerFn(req, res);
    if (!res.headersSent) {
      res.json(result);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    const status = err.statusCode || 400;
    res.status(status).json({
      error: err.message || 'Unexpected error'
    });
  }
}

function searchUsers(req, res) {
  return handle(async () => {
    const qRaw = (req.query && (req.query.q || req.query.email)) ? String(req.query.q || req.query.email) : '';
    const q = qRaw.trim();
    const limitRaw = req.query && req.query.limit ? Number(req.query.limit) : 10;
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(20, limitRaw)) : 10;

    if (!q || q.length < 2) {
      return { data: [] };
    }

    const users = await userRepository.searchByEmail(q, { limit });
    return { data: users };
  }, req, res);
}

module.exports = {
  searchUsers
};



