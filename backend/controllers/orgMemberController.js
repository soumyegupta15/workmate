'use strict';

const orgMemberRepository = require('../repositories/orgMemberRepository');

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

async function requireOrgAdmin(req, orgId) {
  const userId = req.user && req.user.id ? String(req.user.id) : null;
  if (!userId) {
    const error = new Error('Not authenticated');
    error.statusCode = 401;
    throw error;
  }
  const adminOrgIds = await orgMemberRepository.findAdminOrgIdsForUser(userId);
  if (!adminOrgIds.includes(String(orgId))) {
    const error = new Error('Forbidden');
    error.statusCode = 403;
    throw error;
  }
}

function createOrgMember(req, res) {
  return handle(async () => {
    const { orgId, userId, department, isAdmin } = req.body || {};
    if (!orgId) {
      const error = new Error('orgId is required');
      error.statusCode = 400;
      throw error;
    }
    if (!userId) {
      const error = new Error('userId is required');
      error.statusCode = 400;
      throw error;
    }

    await requireOrgAdmin(req, orgId);

    const created = await orgMemberRepository.insertOne({
      org_id: String(orgId),
      user_id: String(userId),
      department: department !== undefined ? department : null,
      is_admin: isAdmin !== undefined ? Boolean(isAdmin) : undefined
    });

    return { data: created };
  }, req, res);
}

function listOrgMembers(req, res) {
  return handle(async () => {
    const { orgId, userId, isAdmin } = req.query || {};
    const filters = {};
    if (orgId) filters.org_id = String(orgId);
    if (userId) filters.user_id = String(userId);
    if (isAdmin !== undefined) filters.is_admin = String(isAdmin) === 'true';

    const rows = await orgMemberRepository.findMany(filters);
    return { data: rows };
  }, req, res);
}

function getOrgMemberById(req, res) {
  return handle(async () => {
    const id = req.params && req.params.id ? String(req.params.id) : null;
    if (!id) {
      const error = new Error('Org member id is required');
      error.statusCode = 400;
      throw error;
    }

    const row = await orgMemberRepository.findById(id);
    if (!row) {
      const error = new Error('Org member not found');
      error.statusCode = 404;
      throw error;
    }

    return { data: row };
  }, req, res);
}

function updateOrgMemberById(req, res) {
  return handle(async () => {
    const id = req.params && req.params.id ? String(req.params.id) : null;
    if (!id) {
      const error = new Error('Org member id is required');
      error.statusCode = 400;
      throw error;
    }

    const existing = await orgMemberRepository.findById(id);
    if (!existing) {
      const error = new Error('Org member not found');
      error.statusCode = 404;
      throw error;
    }

    await requireOrgAdmin(req, existing.org_id);

    const { orgId, userId, department, isAdmin } = req.body || {};
    const payload = {
      ...(orgId !== undefined ? { org_id: orgId } : {}),
      ...(userId !== undefined ? { user_id: userId } : {}),
      ...(department !== undefined ? { department } : {}),
      ...(isAdmin !== undefined ? { is_admin: isAdmin } : {})
    };

    const updated = await orgMemberRepository.updateById(id, payload);
    return { data: updated };
  }, req, res);
}

function deleteOrgMemberById(req, res) {
  return handle(async () => {
    const id = req.params && req.params.id ? String(req.params.id) : null;
    if (!id) {
      const error = new Error('Org member id is required');
      error.statusCode = 400;
      throw error;
    }

    const existing = await orgMemberRepository.findById(id);
    if (!existing) {
      const error = new Error('Org member not found');
      error.statusCode = 404;
      throw error;
    }

    await requireOrgAdmin(req, existing.org_id);

    const deleted = await orgMemberRepository.deleteById(id);
    return { data: deleted };
  }, req, res);
}

module.exports = {
  createOrgMember,
  listOrgMembers,
  getOrgMemberById,
  updateOrgMemberById,
  deleteOrgMemberById
};


