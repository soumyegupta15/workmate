'use strict';

const path = require('path');
const { randomUUID } = require('crypto');
const attachmentRepository = require('../repositories/attachmentRepository');
const { ATTACHMENT_ENTITY_TYPE } = require('../enums');
const { supabase, supabaseAdmin } = require('../config/supabase');

const storageClient = supabaseAdmin || supabase;
const DEFAULT_BUCKET = 'attachments';

async function ensureBucketExists(bucket) {
  // Requires service role key for createBucket in most setups.
  const { data, error } = await storageClient.storage.getBucket(bucket);
  if (!error && data) return;

  const msg = String(error?.message || '');
  if (/bucket not found/i.test(msg) || /not_found/i.test(msg)) {
    const { error: createErr } = await storageClient.storage.createBucket(bucket, {
      public: true
    });
    if (createErr) {
      const e = new Error(
        `Supabase Storage bucket "${bucket}" is missing and could not be created. ` +
          `Create it in Supabase Storage or set ATTACHMENTS_BUCKET to an existing bucket.`
      );
      e.statusCode = 500;
      throw e;
    }
    return;
  }

  // Anything else (permission/network/etc) -> surface a clearer error
  const e = new Error(
    `Unable to access Supabase Storage bucket "${bucket}". ` +
      `If this is a permission error, ensure SUPABASE_SERVICE_ROLE_KEY is set.`
  );
  e.statusCode = 500;
  throw e;
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

function normalizeEntityType(value) {
  const v = String(value || '').trim().toLowerCase();
  if (!v) return null;
  const allowed = new Set(Object.values(ATTACHMENT_ENTITY_TYPE || {}));
  if (allowed.has(v)) return v;
  return v;
}

function safeFileName(originalName) {
  const base = path.basename(String(originalName || 'file'));
  // remove potentially problematic chars
  return base.replace(/[^\w.\-() ]+/g, '_');
}

async function uploadAttachments(req, res) {
  return handle(async () => {
    const entityType = normalizeEntityType(req.body?.entityType || req.body?.entity_type);
    const entityId = req.body?.entityId || req.body?.entity_id;
    if (!entityType) {
      const error = new Error('entityType is required');
      error.statusCode = 400;
      throw error;
    }
    if (!entityId) {
      const error = new Error('entityId is required');
      error.statusCode = 400;
      throw error;
    }

    const files = Array.isArray(req.files) ? req.files : [];
    if (!files.length) {
      const error = new Error('No files uploaded');
      error.statusCode = 400;
      throw error;
    }

    const bucket =
      process.env.ATTACHMENTS_BUCKET || process.env.SUPABASE_STORAGE_BUCKET || DEFAULT_BUCKET;
    await ensureBucketExists(bucket);
    const saved = [];

    for (const f of files) {
      const ext = path.extname(f.originalname || '');
      const name = safeFileName(f.originalname);
      const key = `${entityType}/${String(entityId)}/${randomUUID()}${ext || ''}`;

      const { error: uploadError } = await storageClient.storage
        .from(bucket)
        .upload(key, f.buffer, {
          contentType: f.mimetype || 'application/octet-stream',
          upsert: false
        });
      if (uploadError) throw uploadError;

      // If bucket is public, this returns a usable URL.
      // If not, you may need to switch to signed URLs.
      const publicUrlResp = storageClient.storage.from(bucket).getPublicUrl(key);
      const fileUrl = publicUrlResp?.data?.publicUrl || null;

      const row = await attachmentRepository.insertOne({
        entity_type: String(entityType),
        entity_id: String(entityId),
        file_name: name || null,
        file_url: fileUrl,
        file_size: typeof f.size === 'number' ? f.size : null
      });

      saved.push(row);
    }

    return { data: saved };
  }, req, res);
}

async function listAttachments(req, res) {
  return handle(async () => {
    const entityType = normalizeEntityType(req.query?.entityType || req.query?.entity_type);
    const entityId = req.query?.entityId || req.query?.entity_id;
    if (!entityType) {
      const error = new Error('entityType is required');
      error.statusCode = 400;
      throw error;
    }
    if (!entityId) {
      const error = new Error('entityId is required');
      error.statusCode = 400;
      throw error;
    }

    const rows = await attachmentRepository.findMany({
      entity_type: String(entityType),
      entity_id: String(entityId)
    });

    return { data: rows };
  }, req, res);
}

async function deleteAttachmentById(req, res) {
  return handle(async () => {
    const id = req.params?.id ? String(req.params.id) : null;
    if (!id) {
      const error = new Error('Attachment id is required');
      error.statusCode = 400;
      throw error;
    }

    // Delete DB row first (minimal). Storage cleanup is best-effort based on URL path.
    const existing = await attachmentRepository.findById(id);
    if (!existing) {
      const error = new Error('Attachment not found');
      error.statusCode = 404;
      throw error;
    }

    const deleted = await attachmentRepository.deleteById(id);

    // Best-effort remove from storage if the URL matches our public URL pattern.
    try {
      const url = String(existing.file_url || '');
      const m = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
      if (m && m[1] && m[2]) {
        const bucket = m[1];
        const key = m[2];
        await storageClient.storage.from(bucket).remove([key]);
      }
    } catch {
      // ignore
    }

    return { data: deleted };
  }, req, res);
}

module.exports = {
  uploadAttachments,
  listAttachments,
  deleteAttachmentById
};


