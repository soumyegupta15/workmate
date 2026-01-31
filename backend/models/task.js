'use strict';

const { z } = require('zod');

const TABLE = 'tasks';
const COLUMNS = Object.freeze({
  id: 'id',
  createdAt: 'created_at',
  title: 'title',
  description: 'description',
  status: 'status',
  priority: 'priority',
  dueDate: 'due_date',
  projectId: 'project_id',
  assigneeId: 'assignee_id',
  assignerId: 'assigner_id',
  completedAt: 'completed_at',
  updatedAt: 'updated_at'
});

const RowSchema = z.object({
  id: z.string(),
  created_at: z.string().optional(),
  title: z.string(),
  description: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  priority: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  project_id: z.string().nullable().optional(),
  assignee_id: z.string().nullable().optional(),
  assigner_id: z.string().nullable().optional(),
  completed_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional()
});

const InsertSchema = z.object({
  title: z.string(),
  description: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  priority: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  project_id: z.string().nullable().optional(),
  assignee_id: z.string().nullable().optional(),
  assigner_id: z.string().nullable().optional(),
  completed_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional()
});

const UpdateSchema = InsertSchema.partial();

const MUTABLE_FIELDS = [
  'title',
  'description',
  'status',
  'priority',
  'due_date',
  'project_id',
  'assignee_id',
  'assigner_id',
  'completed_at',
  'updated_at'
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


