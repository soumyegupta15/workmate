'use strict';

const express = require('express');
const commentController = require('../controllers/commentController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// All comment routes are protected
router.get('/', requireAuth, commentController.listComments); // ?taskId=...
router.post('/', requireAuth, commentController.createComment);
router.get('/:id', requireAuth, commentController.getCommentById);
router.patch('/:id', requireAuth, commentController.updateCommentById);
router.delete('/:id', requireAuth, commentController.deleteCommentById);

module.exports = router;


