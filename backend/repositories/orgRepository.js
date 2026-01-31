'use strict';

const { createRepository } = require('./baseRepository');
const Org = require('../models/org');

const base = createRepository({
  table: Org.TABLE,
  rowSchema: Org.RowSchema,
  insertSchema: Org.InsertSchema,
  updateSchema: Org.UpdateSchema,
  mutableFields: Org.MUTABLE_FIELDS
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

module.exports = {
  ...base,
  findManyByIds
};


