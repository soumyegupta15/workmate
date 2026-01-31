'use strict';

const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from the project root .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function readEnv(name) {
  const value = process.env[name];
  if (value === undefined || value === '') return undefined;
  return value;
}

const NODE_ENV = process.env.NODE_ENV || 'development';
const SUPABASE_URL = readEnv('SUPABASE_URL');
const SUPABASE_ANON_KEY = readEnv('SUPABASE_ANON_KEY');
const SUPABASE_SERVICE_ROLE_KEY = readEnv('SUPABASE_SERVICE_ROLE_KEY');
const SMTP_HOST = readEnv('SMTP_HOST');
const SMTP_PORT = readEnv('SMTP_PORT');
const SMTP_USER = readEnv('SMTP_USER');
const SMTP_PASS = readEnv('SMTP_PASS');
const SMTP_FROM = readEnv('SMTP_FROM');
const FRONTEND_RESET_PASSWORD_URL = readEnv('FRONTEND_RESET_PASSWORD_URL');
const OLLAMA_API_URL = readEnv('OLLAMA_API_URL');

module.exports = {
  NODE_ENV,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
  FRONTEND_RESET_PASSWORD_URL,
  OLLAMA_API_URL
};


