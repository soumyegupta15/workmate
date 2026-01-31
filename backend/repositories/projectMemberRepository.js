'use strict';

const { createRepository } = require('./baseRepository');
const ProjectMember = require('../models/projectMember');

const base = createRepository({
  table: ProjectMember.TABLE,
  rowSchema: ProjectMember.RowSchema,
  insertSchema: ProjectMember.InsertSchema,
  updateSchema: ProjectMember.UpdateSchema,
  mutableFields: ProjectMember.MUTABLE_FIELDS
});

const { supabase, supabaseAdmin } = require('../config/supabase');
const db = supabaseAdmin || supabase;

async function findManyByProjectIds(projectIds) {
  const ids = Array.from(new Set((projectIds || []).filter(Boolean).map(String)));
  if (ids.length === 0) return [];
  const { data, error } = await db.from(base.table).select('*').in('project_id', ids);
  if (error) throw error;
  return base.rowSchema ? (data || []).map((row) => base.rowSchema.parse(row)) : (data || []);
}

async function deleteMany(filters) {
  let query = db.from(base.table).delete().select('*');
  Object.entries(filters || {}).forEach(([key, value]) => {
    query = query.eq(key, value);
  });
  const { data, error } = await query;
  if (error) throw error;
  return base.rowSchema ? (data || []).map((row) => base.rowSchema.parse(row)) : (data || []);
}

async function findAdminProjectIdsForUser(userId, { roles } = {}) {
  const uid = userId ? String(userId) : null;
  if (!uid) return [];

  const roleList = Array.isArray(roles) ? roles.filter(Boolean).map(String) : [];
  if (roleList.length === 0) return [];

  const { data, error } = await db
    .from(base.table)
    .select('project_id')
    .eq('user_id', uid)
    .in('role', roleList);

  if (error) throw error;
  return Array.from(new Set((data || []).map((r) => r.project_id).filter(Boolean)));
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
  findManyByProjectIds,
  deleteMany,
  deleteManyByProjectIds,
  findAdminProjectIdsForUser
};


