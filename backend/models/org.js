'use strict';

const { z } = require('zod');

const TABLE = 'organisations';
const COLUMNS = Object.freeze({
  id: 'id',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  orgName: 'org_name',
  email: 'email',
  phone: 'phone',
  addressLine1: 'address_line_1',
  addressLine2: 'address_line_2',
  country: 'country',
  state: 'state',
  city: 'city',
  postalCode: 'postal_code',
  about: 'about'
});

const RowSchema = z.object({
  id: z.string(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  org_name: z.string(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  address_line_1: z.string().nullable().optional(),
  address_line_2: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  postal_code: z.string().nullable().optional(),
  about: z.string().nullable().optional()
});

const InsertSchema = z.object({
  org_name: z.string(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  address_line_1: z.string().nullable().optional(),
  address_line_2: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  postal_code: z.string().nullable().optional(),
  about: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional()
});

const UpdateSchema = InsertSchema.partial();

const MUTABLE_FIELDS = [
  'org_name',
  'email',
  'phone',
  'address_line_1',
  'address_line_2',
  'country',
  'state',
  'city',
  'postal_code',
  'about',
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

