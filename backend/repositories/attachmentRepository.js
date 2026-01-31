'use strict';

const { createRepository } = require('./baseRepository');
const Attachment = require('../models/attachment');
const { supabase, supabaseAdmin } = require('../config/supabase');

const base = createRepository({
  table: Attachment.TABLE,
  rowSchema: Attachment.RowSchema,
  insertSchema: Attachment.InsertSchema,
  updateSchema: Attachment.UpdateSchema,
  mutableFields: Attachment.MUTABLE_FIELDS
});

// Prefer the admin client when available so we can bypass RLS safely on the backend
const db = supabaseAdmin || supabase;

async function findManyByEntityIds(entityType, entityIds) {
  const type = String(entityType || '').trim();
  const ids = Array.from(new Set((entityIds || []).filter(Boolean).map(String)));
  if (!type || ids.length === 0) return [];

  const { data, error } = await db
    .from(base.table)
    .select('*')
    .eq('entity_type', type)
    .in('entity_id', ids);
  if (error) throw error;

  return (data || []).map((row) => (Attachment.RowSchema ? Attachment.RowSchema.parse(row) : row));
}

async function deleteManyByEntityIds(entityType, entityIds) {
  const type = String(entityType || '').trim();
  const ids = Array.from(new Set((entityIds || []).filter(Boolean).map(String)));
  if (!type || ids.length === 0) return [];

  const { data, error } = await db
    .from(base.table)
    .delete()
    .eq('entity_type', type)
    .in('entity_id', ids)
    .select('*');
  if (error) throw error;

  return (data || []).map((row) => (Attachment.RowSchema ? Attachment.RowSchema.parse(row) : row));
}

async function deleteMany(filters) {
  let query = db.from(base.table).delete().select('*');
  Object.entries(filters || {}).forEach(([key, value]) => {
    query = query.eq(key, value);
  });
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((row) => (Attachment.RowSchema ? Attachment.RowSchema.parse(row) : row));
}

module.exports = {
  ...base,
  findManyByEntityIds,
  deleteManyByEntityIds,
  deleteMany
};


