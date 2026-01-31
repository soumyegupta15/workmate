'use strict';

const { z } = require('zod');

const TABLE = 'projects';
const COLUMNS = Object.freeze({
  id: 'id',
  createdAt: 'created_at',
  orgId: 'org_id',
  name: 'name',
  description: 'description',
  status: 'status',
  startDate: 'start_date',
  endDate: 'end_date',
  createdBy: 'created_by',
  updatedAt: 'updated_at'
});

const RowSchema = z.object({
  id: z.string(),
  created_at: z.string().optional(),
  org_id: z.string().nullable().optional(),
  name: z.string(),
  description: z.string().nullable().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  created_by: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional()
});

const InsertSchema = z.object({
  org_id: z.string().nullable().optional(),
  name: z.string(),
  description: z.string().nullable().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  created_by: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional()
});

const UpdateSchema = InsertSchema.partial();

const MUTABLE_FIELDS = [
  'org_id',
  'name',
  'description',
  'start_date',
  'end_date',
  'status',
  'created_by',
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


