'use strict';

const { createRepository } = require('./baseRepository');
const OrgMember = require('../models/orgMember');

const base = createRepository({
  table: OrgMember.TABLE,
  rowSchema: OrgMember.RowSchema,
  insertSchema: OrgMember.InsertSchema,
  updateSchema: OrgMember.UpdateSchema,
  mutableFields: OrgMember.MUTABLE_FIELDS
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

async function findAdminOrgIdsForUser(userId) {
  const uid = userId ? String(userId) : null;
  if (!uid) return [];

  const { data, error } = await db
    .from(base.table)
    .select('org_id')
    .eq('user_id', uid)
    .eq('is_admin', true);

  if (error) throw error;
  return Array.from(new Set((data || []).map((r) => r.org_id).filter(Boolean)));
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

module.exports = {
  ...base,
  deleteMany,
  findAdminOrgIdsForUser,
  countByOrgId
};


