'use strict';

const commentRepository = require('../repositories/commentRepository');
const taskRepository = require('../repositories/taskRepository');
const userRepository = require('../repositories/userRepository');
const attachmentRepository = require('../repositories/attachmentRepository');

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

function listComments(req, res) {
  return handle(async () => {
    const { taskId } = req.query || {};
    if (!taskId) {
      const error = new Error('taskId is required');
      error.statusCode = 400;
      throw error;
    }

    const rows = await commentRepository.findMany({ task_id: String(taskId) });

    // sort oldest -> newest for threaded UI
    const sorted = (rows || []).slice().sort((a, b) => {
      const aTs = Date.parse(a.created_at || a.created_at_col || '') || 0;
      const bTs = Date.parse(b.created_at || b.created_at_col || '') || 0;
      return aTs - bTs;
    });

    const authorIds = Array.from(
      new Set(sorted.map((c) => c.author_id).filter(Boolean).map(String))
    );
    const authors = authorIds.length ? await userRepository.findManyByIds(authorIds) : [];
    const authorsById = new Map((authors || []).map((u) => [String(u.id), u]));

    const withAuthor = sorted.map((c) => ({
      ...c,
      author: c.author_id ? authorsById.get(String(c.author_id)) || null : null
    }));

    const commentIds = withAuthor.map((c) => c.id).filter(Boolean).map(String);
    const attachments = await attachmentRepository.findManyByEntityIds('comment', commentIds);
    const byEntityId = new Map();
    for (const a of attachments || []) {
      const eid = String(a.entity_id || '');
      if (!eid) continue;
      if (!byEntityId.has(eid)) byEntityId.set(eid, []);
      byEntityId.get(eid).push({
        id: a.id,
        name: a.file_name || 'attachment',
        size: a.file_size ?? undefined,
        type: '',
        url: a.file_url || undefined
      });
    }

    const withAttachments = withAuthor.map((c) => ({
      ...c,
      attachments: byEntityId.get(String(c.id)) || []
    }));

    return { data: withAttachments };
  }, req, res);
}

function getCommentById(req, res) {
  return handle(async () => {
    const id = req.params && req.params.id ? String(req.params.id) : null;
    if (!id) {
      const error = new Error('Comment id is required');
      error.statusCode = 400;
      throw error;
    }

    const comment = await commentRepository.findById(id);
    if (!comment) {
      const error = new Error('Comment not found');
      error.statusCode = 404;
      throw error;
    }

    const author = comment.author_id ? await userRepository.findById(String(comment.author_id)) : null;
    return { data: { ...comment, author: author || null } };
  }, req, res);
}

function createComment(req, res) {
  return handle(async () => {
    const { taskId, content, parentCommentId } = req.body || {};

    if (!taskId) {
      const error = new Error('taskId is required');
      error.statusCode = 400;
      throw error;
    }
    if (!content || typeof content !== 'string' || !content.trim()) {
      const error = new Error('content is required');
      error.statusCode = 400;
      throw error;
    }

    const task = await taskRepository.findById(String(taskId));
    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    let resolvedParentId = null;
    if (parentCommentId) {
      const parent = await commentRepository.findById(String(parentCommentId));
      if (!parent) {
        const error = new Error('Parent comment not found');
        error.statusCode = 400;
        throw error;
      }
      if (String(parent.task_id || '') !== String(taskId)) {
        const error = new Error('Parent comment must belong to the same task');
        error.statusCode = 400;
        throw error;
      }
      resolvedParentId = String(parentCommentId);
    }

    const payload = {
      task_id: String(taskId),
      author_id: req.user && req.user.id ? String(req.user.id) : null,
      parent_comment_id: resolvedParentId,
      content: content.trim(),
      updated_at: new Date().toISOString()
    };

    const created = await commentRepository.insertOne(payload);
    const author = created.author_id ? await userRepository.findById(String(created.author_id)) : null;
    return { data: { ...created, author: author || null } };
  }, req, res);
}

function updateCommentById(req, res) {
  return handle(async () => {
    const id = req.params && req.params.id ? String(req.params.id) : null;
    if (!id) {
      const error = new Error('Comment id is required');
      error.statusCode = 400;
      throw error;
    }

    const existing = await commentRepository.findById(id);
    if (!existing) {
      const error = new Error('Comment not found');
      error.statusCode = 404;
      throw error;
    }

    const userId = req.user && req.user.id ? String(req.user.id) : null;
    if (existing.author_id && userId && String(existing.author_id) !== userId) {
      const error = new Error('Not allowed');
      error.statusCode = 403;
      throw error;
    }

    const { content } = req.body || {};
    if (content === undefined) {
      const error = new Error('content is required');
      error.statusCode = 400;
      throw error;
    }
    if (!String(content || '').trim()) {
      const error = new Error('content cannot be empty');
      error.statusCode = 400;
      throw error;
    }

    const updated = await commentRepository.updateById(id, {
      content: String(content).trim(),
      updated_at: new Date().toISOString()
    });
    const author = updated.author_id ? await userRepository.findById(String(updated.author_id)) : null;
    return { data: { ...updated, author: author || null } };
  }, req, res);
}

function deleteCommentById(req, res) {
  return handle(async () => {
    const id = req.params && req.params.id ? String(req.params.id) : null;
    if (!id) {
      const error = new Error('Comment id is required');
      error.statusCode = 400;
      throw error;
    }

    const existing = await commentRepository.findById(id);
    if (!existing) {
      const error = new Error('Comment not found');
      error.statusCode = 404;
      throw error;
    }

    const userId = req.user && req.user.id ? String(req.user.id) : null;
    if (existing.author_id && userId && String(existing.author_id) !== userId) {
      const error = new Error('Not allowed');
      error.statusCode = 403;
      throw error;
    }

    const deleted = await commentRepository.deleteById(id);
    return { data: deleted };
  }, req, res);
}

module.exports = {
  listComments,
  getCommentById,
  createComment,
  updateCommentById,
  deleteCommentById
};


