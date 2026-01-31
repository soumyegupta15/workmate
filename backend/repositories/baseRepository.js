'use strict';

const { supabase, supabaseAdmin } = require('../config/supabase');

// Prefer the admin client when available so we can bypass RLS safely on the backend
const db = supabaseAdmin || supabase;

if (!db) {
  throw new Error('Supabase client is not configured');
}

function createRepository({ table, rowSchema, insertSchema, updateSchema, mutableFields }) {
  if (!table) {
    throw new Error('Table name is required for repository');
  }

  const allowedFields = Array.isArray(mutableFields) ? new Set(mutableFields) : null;

  function filterMutable(input) {
    if (!allowedFields || !input) return input;
    const filtered = {};
    for (const [key, value] of Object.entries(input)) {
      if (allowedFields.has(key)) {
        filtered[key] = value;
      }
    }
    return filtered;
  }

  async function findById(id) {
    const { data, error } = await db.from(table).select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return rowSchema ? rowSchema.parse(data) : data;
  }

  async function findOne(filters) {
    let query = db.from(table).select('*');
    Object.entries(filters || {}).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return rowSchema ? rowSchema.parse(data) : data;
  }

  async function findMany(filters) {
    let query = db.from(table).select('*');
    Object.entries(filters || {}).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    const { data, error } = await query;
    if (error) throw error;
    if (!rowSchema) return data || [];
    return (data || []).map((row) => rowSchema.parse(row));
  }

  async function insertOne(payload) {
    const toInsert = insertSchema ? insertSchema.parse(payload) : payload;
    const { data, error } = await db.from(table).insert(toInsert).select('*').maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return rowSchema ? rowSchema.parse(data) : data;
  }

  async function updateById(id, payload) {
    const filtered = filterMutable(payload);
    const toUpdate = updateSchema ? updateSchema.parse(filtered) : filtered;
    const { data, error } = await db
      .from(table)
      .update(toUpdate)
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return rowSchema ? rowSchema.parse(data) : data;
  }

  async function deleteById(id) {
    const { data, error } = await db.from(table).delete().eq('id', id).select('*').maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return rowSchema ? rowSchema.parse(data) : data;
  }

  return {
    table,
    findById,
    findOne,
    findMany,
    insertOne,
    updateById,
    deleteById
  };
}

module.exports = {
  createRepository
};


