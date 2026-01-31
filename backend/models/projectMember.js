'use strict';

const { z } = require('zod');

const TABLE = 'project_members';
const COLUMNS = Object.freeze({
  id: 'id',
  projectId: 'project_id',
  userId: 'user_id',
  role: 'role',
  joinedAt: 'joined_at',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

const RowSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  user_id: z.string(),
  role: z.string().nullable().optional(),
  joined_at: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});

const InsertSchema = z.object({
  project_id: z.string(),
  user_id: z.string(),
  role: z.string().nullable().optional()
});

const UpdateSchema = InsertSchema.partial();

const MUTABLE_FIELDS = ['project_id', 'user_id', 'role'];

module.exports = {
  TABLE,
  COLUMNS,
  RowSchema,
  InsertSchema,
  UpdateSchema,
  MUTABLE_FIELDS
};


