'use strict';

const { createRepository } = require('./baseRepository');
const User = require('../models/user');
const { supabase, supabaseAdmin } = require('../config/supabase');

const db = supabaseAdmin || supabase;

const base = createRepository({
  table: User.TABLE,
  rowSchema: User.RowSchema,
  insertSchema: User.InsertSchema,
  updateSchema: User.UpdateSchema,
  mutableFields: User.MUTABLE_FIELDS
});

async function findByEmail(email) {
  const { data, error } = await db.from(User.TABLE).select('*').eq('email', email).maybeSingle();
  if (error && error.code !== 'PGRST116') {
    // PGRST116 = No rows found
    throw error;
  }
  if (!data) return null;
  return User.RowSchema.parse(data);
}

async function updatePasswordHashByEmail(email, passwordHash) {
  const updatePayload = { password_hash: passwordHash };
  const { data, error } = await db
    .from(User.TABLE)
    .update(updatePayload)
    .eq('email', email)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return User.RowSchema.parse(data);
}

async function searchByEmail(query, { limit = 10 } = {}) {
  const q = query ? String(query).trim() : '';
  if (!q) return [];

  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Math.min(20, Number(limit))) : 10;

  // Only select safe fields (never return password_hash).
  const { data, error } = await db
    .from(User.TABLE)
    .select('id,email,name,profile_image_url')
    .ilike('email', `%${q}%`)
    .order('email', { ascending: true })
    .limit(safeLimit);

  if (error) throw error;
  return (data || []).map((row) => ({
    id: row.id,
    email: row.email,
    name: row.name,
    profile_image_url: row.profile_image_url
  }));
}

async function findManyByIds(ids) {
  const uniqueIds = Array.from(new Set((ids || []).filter(Boolean).map(String)));
  if (uniqueIds.length === 0) return [];

  // Only select safe fields (never return password_hash).
  const { data, error } = await db
    .from(User.TABLE)
    .select('id,email,name,profile_image_url,status,is_admin')
    .in('id', uniqueIds);

  if (error) throw error;
  return (data || []).map((row) => ({
    id: row.id,
    email: row.email,
    name: row.name,
    profile_image_url: row.profile_image_url,
    status: row.status,
    is_admin: row.is_admin
  }));
}

module.exports = {
  ...base,
  findByEmail,
  updatePasswordHashByEmail,
  searchByEmail,
  findManyByIds
};


