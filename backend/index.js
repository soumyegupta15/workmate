// index.js
'use strict';

require('./config/env');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const routes = require('./http/routes');

const app = express();

// Security and common middlewares
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check
app.get('/health', (req, res) => res.json({ ok: true }));

// API routes
app.use('/api', routes);

const PORT = process.env.PORT || 4000;
app.set('port', PORT);
const server = app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API server listening on port ${PORT}`);
  // eslint-disable-next-line no-console
  console.log(`PID ${process.pid}`);
});

process.on('unhandledRejection', (reason) => {
  // eslint-disable-next-line no-console
  console.error('UnhandledRejection:', reason);
});

process.on('uncaughtException', (err) => {
  // eslint-disable-next-line no-console
  console.error('UncaughtException:', err);
  process.exit(1);
});

process.on('SIGINT', () => {
  // eslint-disable-next-line no-console
  console.log('SIGINT received, shutting down...');
  server.close(() => process.exit(0));
});

process.on('SIGTERM', () => {
  // eslint-disable-next-line no-console
  console.log('SIGTERM received, shutting down...');
  server.close(() => process.exit(0));
});


