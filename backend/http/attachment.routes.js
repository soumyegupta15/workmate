'use strict';

const express = require('express');
const multer = require('multer');
const attachmentController = require('../controllers/attachmentController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// All attachment routes are protected
router.post('/upload', requireAuth, upload.array('files', 10), attachmentController.uploadAttachments);
router.get('/', requireAuth, attachmentController.listAttachments);
router.delete('/:id', requireAuth, attachmentController.deleteAttachmentById);

module.exports = router;


