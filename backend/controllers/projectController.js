'use strict';

const projectRepository = require('../repositories/projectRepository');
const projectMemberRepository = require('../repositories/projectMemberRepository');
const { PROJECT_MEMBER_ROLE } = require('../enums');
const userRepository = require('../repositories/userRepository');
const orgMemberRepository = require('../repositories/orgMemberRepository');
const orgRepository = require('../repositories/orgRepository');
const attachmentRepository = require('../repositories/attachmentRepository');
const taskRepository = require('../repositories/taskRepository');
const commentRepository = require('../repositories/commentRepository');
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
    const status = err.statusCode || 400;
    // Avoid spamming server logs for expected client errors (404/403/etc)
    if (status >= 500) {
      // eslint-disable-next-line no-console
      console.error(err);
    }
    res.status(status).json({
      error: err.message || 'Unexpected error'
    });
  }
}

async function requireProjectMember(req, projectId) {
  const userId = req.user && req.user.id ? String(req.user.id) : null;
  if (!userId) {
    const error = new Error('Not authenticated');
    error.statusCode = 401;
    throw error;
  }

  const membership = await projectMemberRepository.findOne({
    project_id: String(projectId),
    user_id: String(userId)
  });
  if (membership) return membership;

  const project = await projectRepository.findById(String(projectId));
  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }

  // Allow project creator even if project_members row is missing (legacy data / imports)
  if (project.created_by && String(project.created_by) === String(userId)) {
    return { is_project_creator: true, user_id: userId, project_id: String(projectId), org_id: project.org_id || null };
  }

  // Allow organisation members (and admins) to access projects within their org.
  // This avoids 403s when project_members isn't fully populated.
  const orgId = project && project.org_id ? String(project.org_id) : null;
  if (orgId) {
    const orgMembership = await orgMemberRepository.findOne({
      org_id: String(orgId),
      user_id: String(userId)
    });
    if (orgMembership) {
      return {
        is_org_member: true,
        is_org_admin: Boolean(orgMembership.is_admin),
        org_id: orgId,
        user_id: userId,
        project_id: String(projectId)
      };
    }
  }

    const error = new Error('Forbidden');
    error.statusCode = 403;
  throw error;
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
  if (adminProjectIds.includes(String(projectId))) return;

  const project = await projectRepository.findById(String(projectId));
  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }

  // Allow project creator (legacy data)
  if (project.created_by && String(project.created_by) === String(userId)) return;

  // Fallback: allow org admins to manage projects in their org
  const orgId = project && project.org_id ? String(project.org_id) : null;
  if (orgId) {
    const orgMembership = await orgMemberRepository.findOne({
      org_id: String(orgId),
      user_id: String(userId)
    });
    if (orgMembership && orgMembership.is_admin) return;
  }

  const error = new Error('Forbidden');
  error.statusCode = 403;
  throw error;
}

function createProject(req, res) {
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
      orgId,
      name,
      description,
      about,
      status,
      startDate,
      endDate,
      teamMembers,
      teamMemberEmails
    } = req.body || {};

    if (!name || typeof name !== 'string') {
      const error = new Error('Project name is required');
      error.statusCode = 400;
      throw error;
    }

    const richDescription =
      typeof description === 'string'
        ? description
        : (typeof about === 'string' ? about : null);

    // eslint-disable-next-line no-console
    console.log('[projectController.createProject] incoming description length:', richDescription ? richDescription.length : 0);

    const payload = {
      org_id: orgId || null,
      name,
      // Store Quill HTML (rich text) as-is
      description: richDescription,
      status: status || null,
      start_date: startDate || null,
      end_date: endDate || null,
      created_by: userId
    };

    const created = await projectRepository.insertOne(payload);
    // eslint-disable-next-line no-console
    console.log('[projectController.createProject] saved description length:', created && created.description ? created.description.length : 0);

    const projectMember = await projectMemberRepository.insertOne({
      project_id: created.id,
      user_id: userId,
      role: 'owner'
    });

    // Optionally add selected org members to this project.
    // Frontend passes emails of org members (from dropdown).
    const inputEmails = Array.isArray(teamMemberEmails)
      ? teamMemberEmails
      : (Array.isArray(teamMembers) ? teamMembers : []);

    const normalizedEmails = Array.from(
      new Set(
        (inputEmails || [])
          .map((e) => String(e || '').trim().toLowerCase())
          .filter(Boolean)
      )
    );

    const invited = { added: [], skipped: [], notFound: [], notOrgMember: [] };
    if (normalizedEmails.length > 0) {
      for (const email of normalizedEmails) {
        const user = await userRepository.findByEmail(email);
        if (!user) {
          invited.notFound.push(email);
          continue;
        }

        // Skip creator (already owner)
        if (String(user.id) === String(userId)) {
          invited.skipped.push(email);
          continue;
        }

        // If orgId is provided, ensure the user belongs to the organisation
        if (orgId) {
          const membership = await orgMemberRepository.findOne({
            org_id: String(orgId),
            user_id: String(user.id)
          });
          if (!membership) {
            invited.notOrgMember.push(email);
            continue;
          }
        }

        const existing = await projectMemberRepository.findOne({
          project_id: String(created.id),
          user_id: String(user.id)
        });
        if (existing) {
          invited.skipped.push(email);
          continue;
        }

        const added = await projectMemberRepository.insertOne({
          project_id: created.id,
          user_id: user.id,
          role: PROJECT_MEMBER_ROLE?.MEMBER || 'member'
        });
        invited.added.push({ email, project_member: added });
      }
    }

    return { data: created, project_member: projectMember, invited };
  }, req, res);
}

function getProjectById(req, res) {
  return handle(async () => {
    const projectId = req.params && req.params.projectId ? String(req.params.projectId) : null;
    if (!projectId) {
      const error = new Error('projectId is required');
      error.statusCode = 400;
      throw error;
    }

    await requireProjectMember(req, projectId);

    const project = await projectRepository.findById(projectId);
    if (!project) {
      const error = new Error('Project not found');
      error.statusCode = 404;
      throw error;
    }

    const attachments = await attachmentRepository.findMany({
      entity_type: 'project',
      entity_id: String(projectId)
    });
    const mappedAttachments = (attachments || []).map((a) => ({
      id: a.id,
      name: a.file_name || 'attachment',
      size: a.file_size ?? undefined,
      type: '',
      url: a.file_url || undefined
    }));

    return { data: { ...project, attachments: mappedAttachments } };
  }, req, res);
}

function updateProjectById(req, res) {
  return handle(async () => {
    const projectId = req.params && req.params.projectId ? String(req.params.projectId) : null;
    if (!projectId) {
      const error = new Error('projectId is required');
      error.statusCode = 400;
      throw error;
    }

    await requireProjectAdmin(req, projectId);

    const existing = await projectRepository.findById(projectId);
    if (!existing) {
      const error = new Error('Project not found');
      error.statusCode = 404;
      throw error;
    }

    const { name, description, about, startDate, endDate, status } = req.body || {};

    const richDescription =
      typeof description === 'string'
        ? description
        : (typeof about === 'string' ? about : undefined);

    const payload = {
      ...(name !== undefined ? { name } : {}),
      ...(richDescription !== undefined ? { description: richDescription } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(startDate !== undefined ? { start_date: startDate } : {}),
      ...(endDate !== undefined ? { end_date: endDate } : {})
    };

    const updated = await projectRepository.updateById(projectId, payload);
    if (!updated) {
      const error = new Error('Project not found');
      error.statusCode = 404;
      throw error;
    }

    const attachments = await attachmentRepository.findMany({
      entity_type: 'project',
      entity_id: String(projectId)
    });
    const mappedAttachments = (attachments || []).map((a) => ({
      id: a.id,
      name: a.file_name || 'attachment',
      size: a.file_size ?? undefined,
      type: '',
      url: a.file_url || undefined
    }));

    return { data: { ...updated, attachments: mappedAttachments } };
  }, req, res);
}

function getProjectTaskStats(req, res) {
  return handle(async () => {
    const projectId = req.params && req.params.projectId ? String(req.params.projectId) : null;
    if (!projectId) {
      const error = new Error('projectId is required');
      error.statusCode = 400;
      throw error;
    }

    await requireProjectMember(req, projectId);

    const tasks = await taskRepository.findMany({ project_id: String(projectId) });
    const total = Array.isArray(tasks) ? tasks.length : 0;
    const completed = (tasks || []).filter((t) => String(t.status || '').toLowerCase() === 'done').length;
    const pending = Math.max(0, total - completed);
    const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      data: {
        total,
        completed,
        pending,
        progressPercent
      }
    };
  }, req, res);
}

function getProjectTeamStats(req, res) {
  return handle(async () => {
    const projectId = req.params && req.params.projectId ? String(req.params.projectId) : null;
    if (!projectId) {
      const error = new Error('projectId is required');
      error.statusCode = 400;
      throw error;
    }

    await requireProjectMember(req, projectId);

    const members = await projectMemberRepository.findMany({ project_id: String(projectId) });
    const userIds = Array.from(new Set((members || []).map((m) => m.user_id).filter(Boolean).map(String)));
    const users = userIds.length ? await userRepository.findManyByIds(userIds) : [];
    const userById = new Map((users || []).map((u) => [String(u.id), u]));

    const tasks = await taskRepository.findMany({ project_id: String(projectId) });
    const countsByAssignee = new Map();
    for (const t of tasks || []) {
      if (!t.assignee_id) continue;
      const key = String(t.assignee_id);
      countsByAssignee.set(key, (countsByAssignee.get(key) || 0) + 1);
    }
    const totalAssigned = Array.from(countsByAssignee.values()).reduce((a, b) => a + b, 0);

    const rows = (members || []).map((m) => {
      const uid = m.user_id ? String(m.user_id) : '';
      const user = uid ? (userById.get(uid) || null) : null;
      const assignedCount = uid ? (countsByAssignee.get(uid) || 0) : 0;
      const contributionPercent =
        totalAssigned > 0 ? Math.round((assignedCount / totalAssigned) * 100) : 0;
      return {
        id: m.id,
        role: m.role || null,
        user,
        assignedCount,
        contributionPercent
      };
    });

    rows.sort((a, b) => (b.contributionPercent || 0) - (a.contributionPercent || 0));

    return { data: rows };
  }, req, res);
}

function deleteProjectById(req, res) {
  return handle(async () => {
    const projectId = req.params && req.params.projectId ? String(req.params.projectId) : null;
    if (!projectId) {
      const error = new Error('projectId is required');
      error.statusCode = 400;
      throw error;
    }

    await requireProjectAdmin(req, projectId);

    const existing = await projectRepository.findById(projectId);
    if (!existing) {
      const error = new Error('Project not found');
      error.statusCode = 404;
      throw error;
    }

    // 1) Gather tasks + comments (for attachment cleanup & cascade deletes)
    const tasks = await taskRepository.findMany({ project_id: String(projectId) });
    const taskIds = Array.from(new Set((tasks || []).map((t) => t.id).filter(Boolean).map(String)));

    const comments = taskIds.length > 0 ? await commentRepository.findManyByTaskIds(taskIds) : [];
    const commentIds = Array.from(new Set((comments || []).map((c) => c.id).filter(Boolean).map(String)));

    // 2) Delete notifications (project + task) first (avoid FK issues)
    const deletedProjectNotifications = await notificationRepository.deleteMany({ project_id: String(projectId) });
    const deletedTaskNotifications =
      taskIds.length > 0 ? await notificationRepository.deleteManyByTaskIds(taskIds) : [];

    // 3) Delete attachments (project + tasks + comments) and remove storage objects (best-effort)
    const deletedProjectAttachments = await attachmentRepository.deleteManyByEntityIds('project', [projectId]);
    const deletedTaskAttachments =
      taskIds.length > 0 ? await attachmentRepository.deleteManyByEntityIds('task', taskIds) : [];
    const deletedCommentAttachments =
      commentIds.length > 0 ? await attachmentRepository.deleteManyByEntityIds('comment', commentIds) : [];

    await bestEffortRemoveStorageObjects([
      ...(deletedProjectAttachments || []),
      ...(deletedTaskAttachments || []),
      ...(deletedCommentAttachments || [])
    ]);

    // 4) Delete comments + tasks
    const deletedComments = taskIds.length > 0 ? await commentRepository.deleteManyByTaskIds(taskIds) : [];
    const deletedTasks = await taskRepository.deleteMany({ project_id: String(projectId) });

    // 5) Delete project members
    const deletedProjectMembers = await projectMemberRepository.deleteMany({ project_id: String(projectId) });

    // 6) Delete project row
    const deletedProject = await projectRepository.deleteById(projectId);

    return {
      data: deletedProject,
      deleted: {
        tasks: (deletedTasks || []).length,
        comments: (deletedComments || []).length,
        attachments:
          (deletedProjectAttachments || []).length +
          (deletedTaskAttachments || []).length +
          (deletedCommentAttachments || []).length,
        notifications: (deletedProjectNotifications || []).length + (deletedTaskNotifications || []).length,
        project_members: (deletedProjectMembers || []).length
      }
    };
  }, req, res);
}

function listAdminProjects(req, res) {
  return handle(async () => {
    const userId = req.user && req.user.id ? String(req.user.id) : null;
    if (!userId) {
      const error = new Error('Not authenticated');
      error.statusCode = 401;
      throw error;
    }

    // Treat "admin" as users who can manage the project (owner/manager).
    // If you want owner-only, change roles to [PROJECT_MEMBER_ROLE.OWNER].
    const roles = [PROJECT_MEMBER_ROLE.OWNER, PROJECT_MEMBER_ROLE.MANAGER];
    const projectIds = await projectMemberRepository.findAdminProjectIdsForUser(userId, { roles });
    const projects = await projectRepository.findManyByIds(projectIds);
    return { data: projects };
  }, req, res);
}

function listMyProjects(req, res) {
  return handle(async () => {
    const userId = req.user && req.user.id ? String(req.user.id) : null;
    if (!userId) {
      const error = new Error('Not authenticated');
      error.statusCode = 401;
      throw error;
    }

    const assignedOnly =
      String(req.query?.assignedOnly ?? 'true').trim().toLowerCase() !== 'false';

    // IMPORTANT: "My projects" for employees should come from project_members,
    // not org membership and not "created_by".
    const memberships = await projectMemberRepository.findMany({ user_id: String(userId) });
    let projectIds = Array.from(
      new Set((memberships || []).map((m) => m.project_id).filter(Boolean).map(String))
    );

    // Optional: only show projects where the user has at least one assigned task
    if (assignedOnly) {
      const assignedProjectIds = await taskRepository.findProjectIdsByAssigneeId(userId);
      const allow = new Set(assignedProjectIds);
      projectIds = projectIds.filter((pid) => allow.has(String(pid)));
    }
    const projects = await projectRepository.findManyByIds(projectIds);

    // Attach org name (for nicer sidebar labels)
    const orgIds = Array.from(new Set((projects || []).map((p) => p.org_id).filter(Boolean).map(String)));
    const orgs = orgIds.length ? await orgRepository.findManyByIds(orgIds) : [];
    const orgById = new Map((orgs || []).map((o) => [String(o.id), o]));

    return {
      data: (projects || []).map((p) => ({
        ...p,
        org_name: p.org_id ? (orgById.get(String(p.org_id))?.org_name || null) : null
      }))
    };
  }, req, res);
}

function listProjectsCreatedByUser(req, res) {
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

    const projects = await projectRepository.findManyCreatedByUser(userId);
    return { data: projects };
  }, req, res);
}

module.exports = {
  createProject,
  getProjectById,
  updateProjectById,
  getProjectTaskStats,
  getProjectTeamStats,
  deleteProjectById,
  listAdminProjects,
  listMyProjects,
  listProjectsCreatedByUser
};



