'use strict';

const { z } = require('zod');

const TABLE = 'attachments';
const COLUMNS = Object.freeze({
  id: 'id',
  createdAt: 'created_at',
  entityType: 'entity_type',
  entityId: 'entity_id',
  fileName: 'file_name',
  fileUrl: 'file_url',
  fileSize: 'file_size'
});

const RowSchema = z.object({
  id: z.string(),
  created_at: z.string().optional(),
  entity_type: z.string(),
  entity_id: z.string(),
  file_name: z.string().nullable().optional(),
  file_url: z.string().nullable().optional(),
  file_size: z.number().nullable().optional()
});

const InsertSchema = z.object({
  entity_type: z.string(),
  entity_id: z.string(),
  file_name: z.string().nullable().optional(),
  file_url: z.string().nullable().optional(),
  file_size: z.number().nullable().optional()
});

const UpdateSchema = InsertSchema.partial();

const MUTABLE_FIELDS = ['entity_type', 'entity_id', 'file_name', 'file_url', 'file_size'];

module.exports = {
  TABLE,
  COLUMNS,
  RowSchema,
  InsertSchema,
  UpdateSchema,
  MUTABLE_FIELDS
};


