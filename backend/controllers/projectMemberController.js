'use strict';

const { PROJECT_MEMBER_ROLE } = require('../enums');
const projectMemberRepository = require('../repositories/projectMemberRepository');
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

async function requireProjectAdmin(req, projectId) {
  const userId = req.user && req.user.id ? String(req.user.id) : null;
  if (!userId) {
    const error = new Error('Not authenticated');
    error.statusCode = 401;
    throw error;
  }

  const roles = [PROJECT_MEMBER_ROLE.OWNER, PROJECT_MEMBER_ROLE.MANAGER];
  const adminProjectIds = await projectMemberRepository.findAdminProjectIdsForUser(userId, { roles });
  if (!adminProjectIds.includes(String(projectId))) {
    const error = new Error('Forbidden');
    error.statusCode = 403;
    throw error;
  }
}

async function requireProjectMember(req, projectId) {
  const userId = req.user && req.user.id ? String(req.user.id) : null;
  if (!userId) {
    const error = new Error('Not authenticated');
    error.statusCode = 401;
    throw error;
  }
  const pid = projectId ? String(projectId) : null;
  if (!pid) {
    const error = new Error('projectId is required');
    error.statusCode = 400;
    throw error;
  }

  const rows = await projectMemberRepository.findMany({ project_id: pid, user_id: userId });
  if (!rows || rows.length === 0) {
    const error = new Error('Forbidden');
    error.statusCode = 403;
    throw error;
  }
}

function createProjectMember(req, res) {
  return handle(async () => {
    const { projectId, userId, role } = req.body || {};
    if (!projectId) {
      const error = new Error('projectId is required');
      error.statusCode = 400;
      throw error;
    }
    if (!userId) {
      const error = new Error('userId is required');
      error.statusCode = 400;
      throw error;
    }

    await requireProjectAdmin(req, projectId);

    const created = await projectMemberRepository.insertOne({
      project_id: String(projectId),
      user_id: String(userId),
      role: role !== undefined ? role : null
    });

    return { data: created };
  }, req, res);
}

function listProjectMembers(req, res) {
  return handle(async () => {
    const { projectId, userId, role } = req.query || {};
    const filters = {};
    if (projectId) filters.project_id = String(projectId);
    if (userId) filters.user_id = String(userId);
    if (role) filters.role = String(role);

    const rows = await projectMemberRepository.findMany(filters);

    // If listing by project, ensure requester is a member and enrich with user details
    if (projectId) {
      await requireProjectMember(req, projectId);
      const userIds = Array.from(new Set((rows || []).map((r) => r.user_id).filter(Boolean)));
      const users = await userRepository.findManyByIds(userIds);
      const userById = new Map((users || []).map((u) => [String(u.id), u]));
      const enriched = (rows || []).map((r) => ({
        ...r,
        user: userById.get(String(r.user_id)) || null
      }));
      return { data: enriched };
    }

    return { data: rows };
  }, req, res);
}

function getProjectMemberById(req, res) {
  return handle(async () => {
    const id = req.params && req.params.id ? String(req.params.id) : null;
    if (!id) {
      const error = new Error('Project member id is required');
      error.statusCode = 400;
      throw error;
    }

    const row = await projectMemberRepository.findById(id);
    if (!row) {
      const error = new Error('Project member not found');
      error.statusCode = 404;
      throw error;
    }

    return { data: row };
  }, req, res);
}

function updateProjectMemberById(req, res) {
  return handle(async () => {
    const id = req.params && req.params.id ? String(req.params.id) : null;
    if (!id) {
      const error = new Error('Project member id is required');
      error.statusCode = 400;
      throw error;
    }

    const existing = await projectMemberRepository.findById(id);
    if (!existing) {
      const error = new Error('Project member not found');
      error.statusCode = 404;
      throw error;
    }

    await requireProjectAdmin(req, existing.project_id);

    const { projectId, userId, role } = req.body || {};
    const payload = {
      ...(projectId !== undefined ? { project_id: projectId } : {}),
      ...(userId !== undefined ? { user_id: userId } : {}),
      ...(role !== undefined ? { role } : {})
    };

    const updated = await projectMemberRepository.updateById(id, payload);
    return { data: updated };
  }, req, res);
}

function deleteProjectMemberById(req, res) {
  return handle(async () => {
    const id = req.params && req.params.id ? String(req.params.id) : null;
    if (!id) {
      const error = new Error('Project member id is required');
      error.statusCode = 400;
      throw error;
    }

    const existing = await projectMemberRepository.findById(id);
    if (!existing) {
      const error = new Error('Project member not found');
      error.statusCode = 404;
      throw error;
    }

    await requireProjectAdmin(req, existing.project_id);

    const deleted = await projectMemberRepository.deleteById(id);
    return { data: deleted };
  }, req, res);
}

module.exports = {
  createProjectMember,
  listProjectMembers,
  getProjectMemberById,
  updateProjectMemberById,
  deleteProjectMemberById
};


