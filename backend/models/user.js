'use strict';

const { z } = require('zod');

const TABLE = 'users';
const COLUMNS = Object.freeze({
  id: 'id',
  createdAt: 'created_at',
  email: 'email',
  name: 'name',
  passwordHash: 'password_hash',
  profileImageUrl: 'profile_image_url',
  status: 'status',
  updatedAt: 'updated_at',
  isAdmin: 'is_admin',
});

const RowSchema = z.object({
  id: z.string(), // uuid
  created_at: z.string().optional(),
  email: z.string().email(),
  name: z.string().nullable().optional(),
  password_hash: z.string().nullable().optional(),
  profile_image_url: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
  is_admin: z.boolean()
});

const InsertSchema = z.object({
  email: z.string().email(),
  name: z.string().nullable().optional(),
  password_hash: z.string().nullable().optional(),
  profile_image_url: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
  is_admin: z.boolean()
});

const UpdateSchema = InsertSchema.partial();

const MUTABLE_FIELDS = [
  'email',
  'name',
  'password_hash',
  'profile_image_url',
  'status',
  'updated_at',
  'is_admin'
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

