'use strict';

const { createRepository } = require('./baseRepository');
const Project = require('../models/project');

const base = createRepository({
  table: Project.TABLE,
  rowSchema: Project.RowSchema,
  insertSchema: Project.InsertSchema,
  updateSchema: Project.UpdateSchema,
  mutableFields: Project.MUTABLE_FIELDS
});

const { supabase, supabaseAdmin } = require('../config/supabase');
const db = supabaseAdmin || supabase;

async function findManyByIds(ids) {
  const uniqueIds = Array.from(new Set((ids || []).filter(Boolean).map(String)));
  if (uniqueIds.length === 0) return [];

  const { data, error } = await db.from(base.table).select('*').in('id', uniqueIds);
  if (error) throw error;

  const rows = base.rowSchema ? (data || []).map((row) => base.rowSchema.parse(row)) : (data || []);
  const byId = new Map(rows.map((r) => [String(r.id), r]));
  return uniqueIds.map((id) => byId.get(String(id))).filter(Boolean);
}

async function findManyCreatedByUser(userId) {
  const uid = userId ? String(userId) : null;
  if (!uid) return [];

  const { data, error } = await db
    .from(base.table)
    .select('*')
    .eq('created_by', uid)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return base.rowSchema ? (data || []).map((row) => base.rowSchema.parse(row)) : (data || []);
}

async function findIdsByOrgId(orgId) {
  const oid = orgId ? String(orgId) : null;
  if (!oid) return [];

  const { data, error } = await db.from(base.table).select('id').eq('org_id', oid);
  if (error) throw error;
  return Array.from(new Set((data || []).map((r) => r.id).filter(Boolean).map(String)));
}

async function countByOrgId(orgId) {
  const oid = orgId ? String(orgId) : null;
  if (!oid) return 0;

  const { count, error } = await db
    .from(base.table)
    .select('id', { count: 'exact', head: true })
    .eq('org_id', oid);
  if (error) throw error;
  return count || 0;
}

async function findManyByOrgId(orgId) {
  const oid = orgId ? String(orgId) : null;
  if (!oid) return [];

  const { data, error } = await db
    .from(base.table)
    .select('*')
    .eq('org_id', oid)
    .order('created_at', { ascending: false });
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

module.exports = {
  ...base,
  findManyByIds,
  findManyCreatedByUser,
  findIdsByOrgId,
  countByOrgId,
  findManyByOrgId,
  deleteMany
};


