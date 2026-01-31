'use strict';

const { z } = require('zod');

const TABLE = 'org_members';
const COLUMNS = Object.freeze({
  id: 'id',
  orgId: 'org_id',
  userId: 'user_id',
  department: 'department',
  joinedAt: 'joined_at',
  isAdmin: 'is_admin',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

const RowSchema = z.object({
  id: z.string(),
  org_id: z.string(),
  user_id: z.string(),
  department: z.string().nullable().optional(),
  joined_at: z.string().optional(),
  is_admin: z.boolean().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});

const InsertSchema = z.object({
  org_id: z.string(),
  user_id: z.string(),
  department: z.string().nullable().optional(),
  is_admin: z.boolean().optional()
});

const UpdateSchema = InsertSchema.partial();

const MUTABLE_FIELDS = ['org_id', 'user_id', 'department', 'is_admin'];

module.exports = {
  TABLE,
  COLUMNS,
  RowSchema,
  InsertSchema,
  UpdateSchema,
  MUTABLE_FIELDS
};


