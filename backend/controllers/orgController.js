'use strict';

const orgRepository = require('../repositories/orgRepository');
const orgMemberRepository = require('../repositories/orgMemberRepository');
const projectRepository = require('../repositories/projectRepository');
const taskRepository = require('../repositories/taskRepository');
const userRepository = require('../repositories/userRepository');
const projectMemberRepository = require('../repositories/projectMemberRepository');
const commentRepository = require('../repositories/commentRepository');
const attachmentRepository = require('../repositories/attachmentRepository');
const notificationRepository = require('../repositories/notificationRepository');
const { supabase, supabaseAdmin } = require('../config/supabase');

const storageClient = supabaseAdmin || supabase;

async function bestEffortRemoveStorageObjects(attachmentRows) {
  const rows = Array.isArray(attachmentRows) ? attachmentRows : [];
  const byBucket = new Map();

  for (const a of rows) {
    const url = String(a?.file_url || '');
    const m = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
    if (!m || !m[1] || !m[2]) continue;
    const bucket = m[1];
    const key = m[2];
    if (!byBucket.has(bucket)) byBucket.set(bucket, []);
    byBucket.get(bucket).push(key);
  }

  for (const [bucket, keys] of byBucket.entries()) {
    try {
      if (keys.length) {
        await storageClient.storage.from(bucket).remove(keys);
      }
    } catch {
      // ignore
    }
  }
}

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

async function requireOrgMember(req, orgId) {
  const userId = req.user && req.user.id ? String(req.user.id) : null;
  if (!userId) {
    const error = new Error('Not authenticated');
    error.statusCode = 401;
    throw error;
  }

  const membership = await orgMemberRepository.findOne({
    org_id: String(orgId),
    user_id: String(userId)
  });

  if (!membership) {
    const error = new Error('Forbidden');
    error.statusCode = 403;
    throw error;
  }

  return membership;
}

async function requireOrgAdmin(req, orgId) {
  const membership = await requireOrgMember(req, orgId);
  if (!membership.is_admin) {
    const error = new Error('Forbidden');
    error.statusCode = 403;
    throw error;
  }
  return membership;
}

function normalizeRichTextHtml(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const v = String(value);
  const trimmed = v.trim();
  if (!trimmed || trimmed === '<p><br></p>') return null;
  return v;
}

function listOrganisations(req, res) {
  return handle(async () => {
    const organisations = await orgRepository.findMany();
    return { data: organisations };
  }, req, res);
}

function listAdminOrganisations(req, res) {
  return handle(async () => {
    const userId = req.user && req.user.id ? String(req.user.id) : null;
    if (!userId) {
      const error = new Error('Not authenticated');
      error.statusCode = 401;
      throw error;
    }

    const orgIds = await orgMemberRepository.findAdminOrgIdsForUser(userId);
    const organisations = await orgRepository.findManyByIds(orgIds);
    return { data: organisations };
  }, req, res);
}

function listAdminOrganisationsForUser(req, res) {
  return handle(async () => {
    const userId = req.params && req.params.userId ? String(req.params.userId) : null;
    if (!userId) {
      const error = new Error('userId is required');
      error.statusCode = 400;
      throw error;
    }

    // userId in URL must match authenticated user
    if (req.user && req.user.id && String(req.user.id) !== userId) {
      const error = new Error('Forbidden');
      error.statusCode = 403;
      throw error;
    }

    const orgIds = await orgMemberRepository.findAdminOrgIdsForUser(userId);
    const organisations = await orgRepository.findManyByIds(orgIds);
    return { data: organisations };
  }, req, res);
}

function createOrganisation(req, res) {
  return handle(async () => {
    const userId = req.params && req.params.userId ? String(req.params.userId) : (req.user && req.user.id ? String(req.user.id) : null);

    if (!userId) {
      const error = new Error('userId is required');
      error.statusCode = 400;
      throw error;
    }

    // If the client passes userId in URL, it must match the authenticated user
    if (req.params && req.params.userId && req.user && req.user.id && String(req.params.userId) !== String(req.user.id)) {
      const error = new Error('Forbidden');
      error.statusCode = 403;
      throw error;
    }

    const {
      organisationName,
      email,
      contactNumber,
      description,
      about,
      address,
      country,
      state,
      city,
      pincode
    } = req.body || {};

    if (!organisationName || typeof organisationName !== 'string') {
      const error = new Error('Organisation name is required');
      error.statusCode = 400;
      throw error;
    }

    const richAbout = normalizeRichTextHtml(
      typeof description === 'string' ? description : (typeof about === 'string' ? about : undefined)
    );

    const payload = {
      org_name: organisationName,
      email: email || null,
      phone: contactNumber || null,
      address_line_1: address || null,
      address_line_2: null,
      country: country || null,
      state: state || null,
      city: city || null,
      postal_code: pincode || null,
      about: richAbout === undefined ? null : richAbout
    };

    const created = await orgRepository.insertOne(payload);

    // Create org member entry for the user who created this organisation
    const orgMember = await orgMemberRepository.insertOne({
      org_id: created.id,
      user_id: userId,
      is_admin: true
    });

    return { data: created, org_member: orgMember };
  }, req, res);
}

function getOrganisationById(req, res) {
  return handle(async () => {
    const orgId = req.params && req.params.orgId ? String(req.params.orgId) : null;
    if (!orgId) {
      const error = new Error('orgId is required');
      error.statusCode = 400;
      throw error;
    }

    await requireOrgMember(req, orgId);

    const org = await orgRepository.findById(orgId);
    if (!org) {
      const error = new Error('Organisation not found');
      error.statusCode = 404;
      throw error;
    }

    return { data: org };
  }, req, res);
}

function updateOrganisation(req, res) {
  return handle(async () => {
    const orgId = req.params && req.params.orgId ? String(req.params.orgId) : null;
    if (!orgId) {
      const error = new Error('orgId is required');
      error.statusCode = 400;
      throw error;
    }

    await requireOrgAdmin(req, orgId);

    const {
      organisationName,
      email,
      contactNumber,
      description,
      about,
      address,
      country,
      state,
      city,
      pincode
    } = req.body || {};

    const payload = {
      ...(organisationName !== undefined ? { org_name: organisationName } : {}),
      ...(email !== undefined ? { email: email || null } : {}),
      ...(contactNumber !== undefined ? { phone: contactNumber || null } : {}),
      ...(address !== undefined ? { address_line_1: address || null } : {}),
      ...(country !== undefined ? { country: country || null } : {}),
      ...(state !== undefined ? { state: state || null } : {}),
      ...(city !== undefined ? { city: city || null } : {}),
      ...(pincode !== undefined ? { postal_code: pincode || null } : {}),
    };

    const nextAbout = normalizeRichTextHtml(
      description !== undefined
        ? description
        : (about !== undefined ? about : undefined)
    );
    if (nextAbout !== undefined) {
      payload.about = nextAbout;
    }

    const updated = await orgRepository.updateById(orgId, payload);
    if (!updated) {
      const error = new Error('Organisation not found');
      error.statusCode = 404;
      throw error;
    }

    return { data: updated };
  }, req, res);
}

function getOrgProjectCount(req, res) {
  return handle(async () => {
    const orgId = req.params && req.params.orgId ? String(req.params.orgId) : null;
    if (!orgId) {
      const error = new Error('orgId is required');
      error.statusCode = 400;
      throw error;
    }

    await requireOrgMember(req, orgId);
    const count = await projectRepository.countByOrgId(orgId);
    return { data: { orgId, count } };
  }, req, res);
}

function getOrgMemberCount(req, res) {
  return handle(async () => {
    const orgId = req.params && req.params.orgId ? String(req.params.orgId) : null;
    if (!orgId) {
      const error = new Error('orgId is required');
      error.statusCode = 400;
      throw error;
    }

    await requireOrgMember(req, orgId);
    const count = await orgMemberRepository.countByOrgId(orgId);
    return { data: { orgId, count } };
  }, req, res);
}

function getOrgTaskCount(req, res) {
  return handle(async () => {
    const orgId = req.params && req.params.orgId ? String(req.params.orgId) : null;
    if (!orgId) {
      const error = new Error('orgId is required');
      error.statusCode = 400;
      throw error;
    }

    await requireOrgMember(req, orgId);
    const projectIds = await projectRepository.findIdsByOrgId(orgId);
    const count = await taskRepository.countByProjectIds(projectIds);
    return { data: { orgId, count } };
  }, req, res);
}

function listOrgProjects(req, res) {
  return handle(async () => {
    const orgId = req.params && req.params.orgId ? String(req.params.orgId) : null;
    if (!orgId) {
      const error = new Error('orgId is required');
      error.statusCode = 400;
      throw error;
    }

    await requireOrgMember(req, orgId);
    const projects = await projectRepository.findManyByOrgId(orgId);
    return { data: projects };
  }, req, res);
}

function listOrgProjectSummaries(req, res) {
  return handle(async () => {
    const orgId = req.params && req.params.orgId ? String(req.params.orgId) : null;
    if (!orgId) {
      const error = new Error('orgId is required');
      error.statusCode = 400;
      throw error;
    }

    await requireOrgMember(req, orgId);

    const limit = Math.max(
      1,
      Math.min(10, Number(req.query?.limit ?? 5) || 5)
    );

    const projects = await projectRepository.findManyByOrgId(orgId);
    const top = (projects || []).slice(0, limit);
    const projectIds = top.map((p) => p.id).filter(Boolean).map(String);

    const tasks = projectIds.length > 0 ? await taskRepository.findManyByProjectIds(projectIds) : [];
    const countsByProjectId = new Map();
    for (const t of tasks || []) {
      const pid = t?.project_id ? String(t.project_id) : null;
      if (!pid) continue;
      const cur = countsByProjectId.get(pid) || { total: 0, completed: 0 };
      cur.total += 1;
      if (String(t?.status || '').toLowerCase() === 'done') cur.completed += 1;
      countsByProjectId.set(pid, cur);
    }

    const rows = top.map((p) => {
      const pid = String(p.id);
      const c = countsByProjectId.get(pid) || { total: 0, completed: 0 };
      return {
        id: p.id,
        name: p.name,
        end_date: p.end_date || null,
        total_tasks: c.total,
        completed_tasks: c.completed
      };
    });

    return { data: rows };
  }, req, res);
}

function listOrgMembersDetailed(req, res) {
  return handle(async () => {
    const orgId = req.params && req.params.orgId ? String(req.params.orgId) : null;
    if (!orgId) {
      const error = new Error('orgId is required');
      error.statusCode = 400;
      throw error;
    }

    await requireOrgMember(req, orgId);

    const memberships = await orgMemberRepository.findMany({ org_id: String(orgId) });
    const userIds = memberships.map((m) => m.user_id).filter(Boolean);
    const users = await userRepository.findManyByIds(userIds);
    const usersById = new Map(users.map((u) => [String(u.id), u]));

    // Active projects per user in this organisation:
    // Count project_members rows for org projects where projects.status === 'active'
    const projects = await projectRepository.findManyByOrgId(orgId);
    const activeProjectIds = (projects || [])
      .filter((p) => String(p?.status || '').toLowerCase() === 'active')
      .map((p) => p.id)
      .filter(Boolean)
      .map(String);

    const activeProjectMembers =
      activeProjectIds.length > 0
        ? await projectMemberRepository.findManyByProjectIds(activeProjectIds)
        : [];

    const activeProjectCountByUserId = new Map();
    for (const pm of activeProjectMembers || []) {
      const uid = pm?.user_id ? String(pm.user_id) : null;
      if (!uid) continue;
      activeProjectCountByUserId.set(uid, (activeProjectCountByUserId.get(uid) || 0) + 1);
    }

    return {
      data: memberships.map((m) => ({
        id: m.id,
        org_id: m.org_id,
        user_id: m.user_id,
        department: m.department || null,
        is_admin: !!m.is_admin,
        joined_at: m.joined_at || null,
        active_projects: activeProjectCountByUserId.get(String(m.user_id)) || 0,
        user: usersById.get(String(m.user_id)) || null
      }))
    };
  }, req, res);
}

function inviteOrgMembers(req, res) {
  return handle(async () => {
    const orgId = req.params && req.params.orgId ? String(req.params.orgId) : null;
    if (!orgId) {
      const error = new Error('orgId is required');
      error.statusCode = 400;
      throw error;
    }

    await requireOrgAdmin(req, orgId);

    const { emails, isAdmin, department } = req.body || {};
    const list = Array.isArray(emails) ? emails : [];
    const normalized = Array.from(
      new Set(
        list
          .map((e) => String(e || '').trim().toLowerCase())
          .filter(Boolean)
      )
    );

    if (normalized.length === 0) {
      const error = new Error('emails is required');
      error.statusCode = 400;
      throw error;
    }

    const added = [];
    const skipped = [];
    const notFound = [];

    for (const email of normalized) {
      const user = await userRepository.findByEmail(email);
      if (!user) {
        notFound.push(email);
        continue;
      }

      const existing = await orgMemberRepository.findOne({
        org_id: String(orgId),
        user_id: String(user.id)
      });

      if (existing) {
        skipped.push(email);
        continue;
      }

      const created = await orgMemberRepository.insertOne({
        org_id: String(orgId),
        user_id: String(user.id),
        department: department !== undefined ? department : null,
        is_admin: isAdmin !== undefined ? Boolean(isAdmin) : false
      });

      added.push({ email, org_member: created });
    }

    return { data: { orgId, added, skipped, notFound } };
  }, req, res);
}

function deleteOrganisationById(req, res) {
  return handle(async () => {
    const orgId = req.params && req.params.orgId ? String(req.params.orgId) : null;
    if (!orgId) {
      const error = new Error('orgId is required');
      error.statusCode = 400;
      throw error;
    }

    await requireOrgAdmin(req, orgId);

    const existing = await orgRepository.findById(orgId);
    if (!existing) {
      const error = new Error('Organisation not found');
      error.statusCode = 404;
      throw error;
    }

    // 1) Gather project ids
    const projectIds = await projectRepository.findIdsByOrgId(orgId);

    // 2) Gather tasks + comments for cascade + attachment cleanup
    const tasks = projectIds.length > 0 ? await taskRepository.findManyByProjectIds(projectIds) : [];
    const taskIds = Array.from(new Set((tasks || []).map((t) => t.id).filter(Boolean).map(String)));

    const comments = taskIds.length > 0 ? await commentRepository.findManyByTaskIds(taskIds) : [];
    const commentIds = Array.from(new Set((comments || []).map((c) => c.id).filter(Boolean).map(String)));

    // 3) Delete notifications (org + project + task)
    const deletedOrgNotifications = await notificationRepository.deleteMany({ org_id: String(orgId) });
    const deletedProjectNotifications =
      projectIds.length > 0 ? await notificationRepository.deleteManyByProjectIds(projectIds) : [];
    const deletedTaskNotifications =
      taskIds.length > 0 ? await notificationRepository.deleteManyByTaskIds(taskIds) : [];

    // 4) Delete attachments (project + tasks + comments) and remove storage objects (best-effort)
    const deletedProjectAttachments =
      projectIds.length > 0 ? await attachmentRepository.deleteManyByEntityIds('project', projectIds) : [];
    const deletedTaskAttachments =
      taskIds.length > 0 ? await attachmentRepository.deleteManyByEntityIds('task', taskIds) : [];
    const deletedCommentAttachments =
      commentIds.length > 0 ? await attachmentRepository.deleteManyByEntityIds('comment', commentIds) : [];

    await bestEffortRemoveStorageObjects([
      ...(deletedProjectAttachments || []),
      ...(deletedTaskAttachments || []),
      ...(deletedCommentAttachments || [])
    ]);

    // 5) Delete comments + tasks
    const deletedComments = taskIds.length > 0 ? await commentRepository.deleteManyByTaskIds(taskIds) : [];
    const deletedTasks = projectIds.length > 0 ? await taskRepository.deleteManyByProjectIds(projectIds) : [];

    // 6) Delete project members
    const deletedProjectMembers =
      projectIds.length > 0 ? await projectMemberRepository.deleteManyByProjectIds(projectIds) : [];

    // 7) Delete projects
    const deletedProjects = projectIds.length > 0 ? await projectRepository.deleteMany({ org_id: String(orgId) }) : [];

    // 8) Delete org members
    const deletedOrgMembers = await orgMemberRepository.deleteMany({ org_id: String(orgId) });

    // 9) Delete org
    const deletedOrg = await orgRepository.deleteById(orgId);

    return {
      data: deletedOrg,
      deleted: {
        projects: (deletedProjects || []).length,
        tasks: (deletedTasks || []).length,
        comments: (deletedComments || []).length,
        project_members: (deletedProjectMembers || []).length,
        org_members: (deletedOrgMembers || []).length,
        attachments:
          (deletedProjectAttachments || []).length +
          (deletedTaskAttachments || []).length +
          (deletedCommentAttachments || []).length,
        notifications:
          (deletedOrgNotifications || []).length +
          (deletedProjectNotifications || []).length +
          (deletedTaskNotifications || []).length
      }
    };
  }, req, res);
}

module.exports = {
  listOrganisations,
  listAdminOrganisations,
  listAdminOrganisationsForUser,
  createOrganisation,
  getOrganisationById,
  updateOrganisation,
  deleteOrganisationById,
  getOrgProjectCount,
  getOrgMemberCount,
  getOrgTaskCount,
  listOrgProjects,
  listOrgProjectSummaries,
  listOrgMembersDetailed,
  inviteOrgMembers
};



