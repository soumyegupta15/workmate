'use strict';

const { createRepository } = require('./baseRepository');
const Notification = require('../models/notification');
const { supabase, supabaseAdmin } = require('../config/supabase');

const base = createRepository({
  table: Notification.TABLE,
  rowSchema: Notification.RowSchema,
  insertSchema: Notification.InsertSchema,
  updateSchema: Notification.UpdateSchema,
  mutableFields: Notification.MUTABLE_FIELDS
});

// Prefer admin client when available
const db = supabaseAdmin || supabase;

async function deleteMany(filters) {
  let query = db.from(base.table).delete().select('*');
  Object.entries(filters || {}).forEach(([key, value]) => {
    query = query.eq(key, value);
  });
  const { data, error } = await query;
  if (error) throw error;
  return base.rowSchema ? (data || []).map((row) => base.rowSchema.parse(row)) : (data || []);
}

async function deleteManyByTaskIds(taskIds) {
  const ids = Array.from(new Set((taskIds || []).filter(Boolean).map(String)));
  if (ids.length === 0) return [];
  const { data, error } = await db.from(base.table).delete().in('task_id', ids).select('*');
  if (error) throw error;
  return base.rowSchema ? (data || []).map((row) => base.rowSchema.parse(row)) : (data || []);
}

async function deleteManyByProjectIds(projectIds) {
  const ids = Array.from(new Set((projectIds || []).filter(Boolean).map(String)));
  if (ids.length === 0) return [];
  const { data, error } = await db.from(base.table).delete().in('project_id', ids).select('*');
  if (error) throw error;
  return base.rowSchema ? (data || []).map((row) => base.rowSchema.parse(row)) : (data || []);
}

module.exports = {
  ...base,
  deleteMany,
  deleteManyByTaskIds,
  deleteManyByProjectIds
};


