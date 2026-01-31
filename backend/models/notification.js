'use strict';

const { z } = require('zod');

const TABLE = 'notifications';
const COLUMNS = Object.freeze({
  id: 'id',
  createdAt: 'created_at',
  orgId: 'org_id',
  projectId: 'project_id',
  taskId: 'task_id',
  senderId: 'sender_id',
  title: 'title',
  content: 'content',
  isRead: 'is_read'
});

const RowSchema = z.object({
  id: z.string(),
  created_at: z.string().optional(),
  org_id: z.string().nullable().optional(),
  project_id: z.string().nullable().optional(),
  task_id: z.string().nullable().optional(),
  sender_id: z.string().nullable().optional(),
  title: z.string(),
  content: z.string().nullable().optional(),
  is_read: z.boolean().default(false)
});

const InsertSchema = z.object({
  org_id: z.string().nullable().optional(),
  project_id: z.string().nullable().optional(),
  task_id: z.string().nullable().optional(),
  sender_id: z.string().nullable().optional(),
  title: z.string(),
  content: z.string().nullable().optional(),
  is_read: z.boolean().optional()
});

const UpdateSchema = InsertSchema.partial();

const MUTABLE_FIELDS = [
  'org_id',
  'project_id',
  'task_id',
  'sender_id',
  'title',
  'content',
  'is_read'
];

function parseInsert(input) {
  return InsertSchema.parse(input);
}

function parseUpdate(input) {
  return UpdateSchema.parse(input);
}

module.exports = {
  TABLE,
  COLUMNS,
  RowSchema,
  InsertSchema,
  UpdateSchema,
  parseInsert,
  parseUpdate,
  MUTABLE_FIELDS
};


