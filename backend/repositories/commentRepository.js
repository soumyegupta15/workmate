'use strict';

const { createRepository } = require('./baseRepository');
const Comment = require('../models/comment');
const { supabase, supabaseAdmin } = require('../config/supabase');

const base = createRepository({
  table: Comment.TABLE,
  rowSchema: Comment.RowSchema,
  insertSchema: Comment.InsertSchema,
  updateSchema: Comment.UpdateSchema,
  mutableFields: Comment.MUTABLE_FIELDS
});

// Prefer the admin client when available so we can bypass RLS safely on the backend
const db = supabaseAdmin || supabase;

async function deleteMany(filters) {
  let query = db.from(base.table).delete().select('*');
  Object.entries(filters || {}).forEach(([key, value]) => {
    query = query.eq(key, value);
  });
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((row) => (Comment.RowSchema ? Comment.RowSchema.parse(row) : row));
}

async function findManyByTaskIds(taskIds) {
  const ids = Array.from(new Set((taskIds || []).filter(Boolean).map(String)));
  if (ids.length === 0) return [];
  const { data, error } = await db.from(base.table).select('*').in('task_id', ids);
  if (error) throw error;
  return (data || []).map((row) => (Comment.RowSchema ? Comment.RowSchema.parse(row) : row));
}

async function deleteManyByTaskIds(taskIds) {
  const ids = Array.from(new Set((taskIds || []).filter(Boolean).map(String)));
  if (ids.length === 0) return [];
  const { data, error } = await db.from(base.table).delete().in('task_id', ids).select('*');
  if (error) throw error;
  return (data || []).map((row) => (Comment.RowSchema ? Comment.RowSchema.parse(row) : row));
}

module.exports = {
  ...base,
  deleteMany,
  findManyByTaskIds,
  deleteManyByTaskIds
};


