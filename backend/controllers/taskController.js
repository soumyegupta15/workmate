'use strict';

const taskRepository = require('../repositories/taskRepository');
const userRepository = require('../repositories/userRepository');
const projectMemberRepository = require('../repositories/projectMemberRepository');
const attachmentRepository = require('../repositories/attachmentRepository');
const commentRepository = require('../repositories/commentRepository');
const { supabase, supabaseAdmin } = require('../config/supabase');
const { TASK_PRIORITY, TASK_STATUS } = require('../enums');

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
        // Supabase storage remove accepts an array of paths
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

function normalizeTaskPriority(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const v = String(value).trim();
  if (!v) return null;

  const lower = v.toLowerCase();
  const allowed = new Set(Object.values(TASK_PRIORITY || {}));
  if (allowed.has(lower)) return lower;

  // Common UI values like "Medium" / "High"
  if (allowed.has(lower.replace(/\s+/g, '_'))) return lower.replace(/\s+/g, '_');
  return lower; // let DB validate if still invalid
}

function normalizeTaskStatus(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const v = String(value).trim();
  if (!v) return null;

  const norm = v.toLowerCase().replace(/\s+/g, '_');
  const allowed = new Set(Object.values(TASK_STATUS || {}));
  if (allowed.has(norm)) return norm;

  // Map common UI statuses
  if (norm === 'to_do') return TASK_STATUS.TODO;
  // UI uses "In Review"; backend enum uses "in_review"
  if (norm === 'in_review') return TASK_STATUS.IN_REVIEW;

  return norm; // let DB validate if still invalid
}

function createTask(req, res) {
  return handle(async () => {
    const {
      title,
      description,
      about,
      status,
      priority,
      dueDate,
      projectId,
      assigneeId,
      assigneeEmail,
      assignerId,
      completedAt
    } = req.body || {};

    if (!title || typeof title !== 'string') {
      const error = new Error('Task title is required');
      error.statusCode = 400;
      throw error;
    }

    // Support rich-text HTML (frontend uses Quill). Also accept "about" alias.
    const richDescription =
      typeof description === 'string'
        ? description
        : (typeof about === 'string' ? about : null);

    const normalizedPriority = normalizeTaskPriority(priority);
    const normalizedStatus = normalizeTaskStatus(status);

    let resolvedAssigneeId = assigneeId || null;
    if (!resolvedAssigneeId && assigneeEmail) {
      const email = String(assigneeEmail).trim().toLowerCase();
      const user = await userRepository.findByEmail(email);
      if (!user) {
        const error = new Error('Assignee not found');
        error.statusCode = 400;
        throw error;
      }
      resolvedAssigneeId = user.id;
    }

    // If projectId is present and we have an assignee, ensure they belong to the project.
    if (projectId && resolvedAssigneeId) {
      const membership = await projectMemberRepository.findOne({
        project_id: String(projectId),
        user_id: String(resolvedAssigneeId)
      });
      if (!membership) {
        const error = new Error('Assignee is not a member of this project');
        error.statusCode = 400;
        throw error;
      }
    }

    const payload = {
      title,
      description: richDescription || null,
      status: normalizedStatus !== undefined ? normalizedStatus : (status || null),
      priority: normalizedPriority !== undefined ? normalizedPriority : (priority || null),
      due_date: dueDate || null,
      project_id: projectId || null,
      assignee_id: resolvedAssigneeId ? String(resolvedAssigneeId) : null,
      // Default assigner to authenticated user if not provided
      assigner_id: (assignerId || (req.user && req.user.id)) ? String(assignerId || req.user.id) : null,
      completed_at: completedAt || null
    };

    const created = await taskRepository.insertOne(payload);
    return { data: created };
  }, req, res);
}

function listTasks(req, res) {
  return handle(async () => {
    const { projectId, assigneeId, assignerId, status, priority } = req.query || {};

    const filters = {};
    if (projectId) filters.project_id = String(projectId);
    if (assigneeId) filters.assignee_id = String(assigneeId);
    if (assignerId) filters.assigner_id = String(assignerId);
    if (status) filters.status = String(status);
    if (priority) filters.priority = String(priority);

    const tasks = await taskRepository.findMany(filters);

    // Attach safe assignee + assigner info for UI (email/name) when possible
    const userIds = Array.from(
      new Set(
        (tasks || [])
          .flatMap((t) => [t.assignee_id, t.assigner_id])
          .filter(Boolean)
          .map(String)
      )
    );
    const users = userIds.length > 0 ? await userRepository.findManyByIds(userIds) : [];
    const usersById = new Map(users.map((u) => [String(u.id), u]));

    const withUsers = (tasks || []).map((task) => ({
      ...task,
      assignee: task.assignee_id ? (usersById.get(String(task.assignee_id)) || null) : null,
      assigner: task.assigner_id ? (usersById.get(String(task.assigner_id)) || null) : null
    }));

    const taskIds = (withUsers || []).map((t) => t.id).filter(Boolean).map(String);
    const attachments = await attachmentRepository.findManyByEntityIds('task', taskIds);
    const byTaskId = new Map();
    for (const a of attachments || []) {
      const tid = String(a.entity_id || '');
      if (!tid) continue;
      if (!byTaskId.has(tid)) byTaskId.set(tid, []);
      byTaskId.get(tid).push({
        id: a.id,
        name: a.file_name || 'attachment',
        size: a.file_size ?? undefined,
        type: '',
        url: a.file_url || undefined
      });
    }

    const withAttachments = (withUsers || []).map((t) => ({
      ...t,
      attachments: byTaskId.get(String(t.id)) || []
    }));

    return { data: withAttachments };
  }, req, res);
}

function listMyTasks(req, res) {
  return handle(async () => {
    const userId = req.user && req.user.id ? String(req.user.id) : null;
    if (!userId) {
      const error = new Error('Not authenticated');
      error.statusCode = 401;
      throw error;
    }

    const { projectId } = req.query || {};
    const filters = { assignee_id: String(userId) };
    if (projectId) filters.project_id = String(projectId);

    // Reuse listTasks logic by calling it through repository + same enrichment
    const tasks = await taskRepository.findMany(filters);

    const userIds = Array.from(
      new Set(
        (tasks || [])
          .flatMap((t) => [t.assignee_id, t.assigner_id])
          .filter(Boolean)
          .map(String)
      )
    );
    const users = userIds.length > 0 ? await userRepository.findManyByIds(userIds) : [];
    const usersById = new Map(users.map((u) => [String(u.id), u]));

    const withUsers = (tasks || []).map((task) => ({
      ...task,
      assignee: task.assignee_id ? (usersById.get(String(task.assignee_id)) || null) : null,
      assigner: task.assigner_id ? (usersById.get(String(task.assigner_id)) || null) : null
    }));

    const taskIds = (withUsers || []).map((t) => t.id).filter(Boolean).map(String);
    const attachments = await attachmentRepository.findManyByEntityIds('task', taskIds);
    const byTaskId = new Map();
    for (const a of attachments || []) {
      const tid = String(a.entity_id || '');
      if (!tid) continue;
      if (!byTaskId.has(tid)) byTaskId.set(tid, []);
      byTaskId.get(tid).push({
        id: a.id,
        name: a.file_name || 'attachment',
        size: a.file_size ?? undefined,
        type: '',
        url: a.file_url || undefined
      });
    }

    const withAttachments = (withUsers || []).map((t) => ({
      ...t,
      attachments: byTaskId.get(String(t.id)) || []
    }));

    return { data: withAttachments };
  }, req, res);
}

function listTasksByAssignee(req, res) {
  return handle(async () => {
    const userId = req.params && req.params.userId ? String(req.params.userId) : null;
    if (!userId) {
      const error = new Error('userId is required');
      error.statusCode = 400;
      throw error;
    }

    const tasks = await taskRepository.findMany({ assignee_id: userId });
    return { data: tasks };
  }, req, res);
}

function listTasksByAssigner(req, res) {
  return handle(async () => {
    const userId = req.params && req.params.userId ? String(req.params.userId) : null;
    if (!userId) {
      const error = new Error('userId is required');
      error.statusCode = 400;
      throw error;
    }

    const tasks = await taskRepository.findMany({ assigner_id: userId });
    return { data: tasks };
  }, req, res);
}

function getTaskById(req, res) {
  return handle(async () => {
    const id = req.params && req.params.id ? String(req.params.id) : null;
    if (!id) {
      const error = new Error('Task id is required');
      error.statusCode = 400;
      throw error;
    }

    const task = await taskRepository.findById(id);
    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    // Attach safe assignee info for UI (email/name) when possible (parity with listTasks)
    let assignee = null;
    if (task.assignee_id) {
      try {
        assignee = await userRepository.findById(String(task.assignee_id));
      } catch {
        assignee = null;
      }
    }

    const attachments = await attachmentRepository.findMany({
      entity_type: 'task',
      entity_id: String(task.id)
    });
    const mappedAttachments = (attachments || []).map((a) => ({
      id: a.id,
      name: a.file_name || 'attachment',
      size: a.file_size ?? undefined,
      type: '',
      url: a.file_url || undefined
    }));

    return { data: { ...task, assignee, attachments: mappedAttachments } };
  }, req, res);
}

function updateTaskById(req, res) {
  return handle(async () => {
    const id = req.params && req.params.id ? String(req.params.id) : null;
    if (!id) {
      const error = new Error('Task id is required');
      error.statusCode = 400;
      throw error;
    }

    const existing = await taskRepository.findById(id);
    if (!existing) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    const {
      title,
      description,
      status,
      priority,
      dueDate,
      projectId,
      assigneeId,
      assigneeEmail,
      assignerId,
      completedAt
    } = req.body || {};

    // Resolve assignee by email (parity with createTask)
    let resolvedAssigneeId = assigneeId !== undefined ? assigneeId : undefined;
    if (resolvedAssigneeId === undefined && assigneeEmail !== undefined) {
      const email = String(assigneeEmail || '').trim().toLowerCase();
      if (!email) {
        resolvedAssigneeId = null;
      } else {
        const user = await userRepository.findByEmail(email);
        if (!user) {
          const error = new Error('Assignee not found');
          error.statusCode = 400;
          throw error;
        }
        resolvedAssigneeId = String(user.id);
      }
    }

    const effectiveProjectId = projectId !== undefined ? projectId : existing.project_id;

    // Employees cannot edit task fields other than status.
    const isAdmin = Boolean(req.user?.profile?.is_admin);
    const hasNonStatusEdits =
      title !== undefined ||
      description !== undefined ||
      priority !== undefined ||
      dueDate !== undefined ||
      projectId !== undefined ||
      assigneeId !== undefined ||
      assigneeEmail !== undefined ||
      assignerId !== undefined ||
      completedAt !== undefined;
    if (!isAdmin && hasNonStatusEdits) {
      const error = new Error('Only admin can edit task details');
      error.statusCode = 403;
      throw error;
    }

    // Only global admins can move a task to DONE (employees can move up to IN_REVIEW)
    if (status !== undefined) {
      const nextStatus = normalizeTaskStatus(status);
      if (String(nextStatus || '').toLowerCase() === String(TASK_STATUS.DONE).toLowerCase() && !isAdmin) {
        const error = new Error('Only admin can move task to Done');
        error.statusCode = 403;
        throw error;
      }
    }

    // If we have a project and an assignee, ensure they belong to the project.
    if (effectiveProjectId && resolvedAssigneeId) {
      const membership = await projectMemberRepository.findOne({
        project_id: String(effectiveProjectId),
        user_id: String(resolvedAssigneeId)
      });
      if (!membership) {
        const error = new Error('Assignee is not a member of this project');
        error.statusCode = 400;
        throw error;
      }
    }

    const payload = {
      ...(title !== undefined ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(status !== undefined ? { status: normalizeTaskStatus(status) } : {}),
      ...(priority !== undefined ? { priority: normalizeTaskPriority(priority) } : {}),
      ...(dueDate !== undefined ? { due_date: dueDate } : {}),
      ...(projectId !== undefined ? { project_id: projectId } : {}),
      ...(resolvedAssigneeId !== undefined ? { assignee_id: resolvedAssigneeId } : {}),
      ...(assignerId !== undefined ? { assigner_id: assignerId } : {}),
      ...(completedAt !== undefined ? { completed_at: completedAt } : {})
    };

    const updated = await taskRepository.updateById(id, payload);
    if (!updated) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    // Attach safe assignee info for UI (email/name) when possible (parity with listTasks/getTaskById)
    let assignee = null;
    if (updated.assignee_id) {
      try {
        assignee = await userRepository.findById(String(updated.assignee_id));
      } catch {
        assignee = null;
      }
    }

    return { data: { ...updated, assignee } };
  }, req, res);
}

function deleteTaskById(req, res) {
  return handle(async () => {
    // Only admin can delete tasks
    const isAdmin = Boolean(req.user?.profile?.is_admin);
    if (!isAdmin) {
      const error = new Error('Only admin can delete tasks');
      error.statusCode = 403;
      throw error;
    }

    const id = req.params && req.params.id ? String(req.params.id) : null;
    if (!id) {
      const error = new Error('Task id is required');
      error.statusCode = 400;
      throw error;
    }

    const existing = await taskRepository.findById(id);
    if (!existing) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    // 1) Fetch comments for the task (so we can delete their attachments too)
    const comments = await commentRepository.findMany({ task_id: id });
    const commentIds = (comments || []).map((c) => c.id).filter(Boolean).map(String);

    // 2) Delete attachments (task + comments) and remove objects from storage (best-effort)
    const deletedTaskAttachments = await attachmentRepository.deleteManyByEntityIds('task', [id]);
    const deletedCommentAttachments =
      commentIds.length > 0
        ? await attachmentRepository.deleteManyByEntityIds('comment', commentIds)
        : [];

    await bestEffortRemoveStorageObjects([...(deletedTaskAttachments || []), ...(deletedCommentAttachments || [])]);

    // 3) Delete comments
    const deletedComments = await commentRepository.deleteMany({ task_id: id });

    // 4) Delete task row
    const deletedTask = await taskRepository.deleteById(id);

    return {
      data: deletedTask,
      deleted: {
        comments: (deletedComments || []).length,
        attachments: (deletedTaskAttachments || []).length + (deletedCommentAttachments || []).length
      }
    };
  }, req, res);
}

module.exports = {
  createTask,
  listTasks,
  listMyTasks,
  listTasksByAssignee,
  listTasksByAssigner,
  getTaskById,
  updateTaskById,
  deleteTaskById
};


