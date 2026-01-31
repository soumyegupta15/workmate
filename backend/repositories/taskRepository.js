'use strict';

const { createRepository } = require('./baseRepository');
const Task = require('../models/task');

const base = createRepository({
  table: Task.TABLE,
  rowSchema: Task.RowSchema,
  insertSchema: Task.InsertSchema,
  updateSchema: Task.UpdateSchema,
  mutableFields: Task.MUTABLE_FIELDS
});

const { supabase, supabaseAdmin } = require('../config/supabase');
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

async function findManyByProjectIds(projectIds) {
  const ids = Array.from(new Set((projectIds || []).filter(Boolean).map(String)));
  if (ids.length === 0) return [];
  const { data, error } = await db.from(base.table).select('*').in('project_id', ids);
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

async function countByProjectIds(projectIds) {
  const ids = Array.from(new Set((projectIds || []).filter(Boolean).map(String)));
  if (ids.length === 0) return 0;

  const { count, error } = await db
    .from(base.table)
    .select('id', { count: 'exact', head: true })
    .in('project_id', ids);
  if (error) throw error;
  return count || 0;
}

async function findProjectIdsByAssigneeId(assigneeId) {
  const uid = assigneeId ? String(assigneeId) : null;
  if (!uid) return [];
  const { data, error } = await db
    .from(base.table)
    .select('project_id')
    .eq('assignee_id', uid)
    .not('project_id', 'is', null);
  if (error) throw error;
  return Array.from(new Set((data || []).map((r) => r.project_id).filter(Boolean).map(String)));
}

module.exports = {
  ...base,
  deleteMany,
  findManyByProjectIds,
  deleteManyByProjectIds,
  countByProjectIds,
  findProjectIdsByAssigneeId
};


