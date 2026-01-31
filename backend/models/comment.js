'use strict';

const { z } = require('zod');

const TABLE = 'comments';
const COLUMNS = Object.freeze({
  id: 'id',
  createdAt: 'created_at',
  taskId: 'task_id',
  authorId: 'author_id',
  parentCommentId: 'parent_comment_id',
  content: 'content',
  updatedAt: 'updated_at',
  createdAtCol: 'created_at'
});

const RowSchema = z.object({
  id: z.string(),
  created_at: z.string().optional(),
  task_id: z.string().nullable().optional(),
  author_id: z.string().nullable().optional(),
  parent_comment_id: z.string().nullable().optional(),
  content: z.string(),
  updated_at: z.string().nullable().optional(),
  created_at_col: z.string().optional()
});

const InsertSchema = z.object({
  task_id: z.string().nullable().optional(),
  author_id: z.string().nullable().optional(),
  parent_comment_id: z.string().nullable().optional(),
  content: z.string(),
  updated_at: z.string().nullable().optional(),
  created_at_col: z.string().optional()
});

const UpdateSchema = InsertSchema.partial();

const MUTABLE_FIELDS = [
  'task_id',
  'author_id',
  'parent_comment_id',
  'content',
  'updated_at',
  'created_at_col'
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


