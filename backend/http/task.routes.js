'use strict';

const express = require('express');

const taskController = require('../controllers/taskController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// All task routes are protected
router.post('/', requireAuth, taskController.createTask);
router.get('/', requireAuth, taskController.listTasks);
router.get('/mine', requireAuth, taskController.listMyTasks);
router.get('/assignee/:userId', requireAuth, taskController.listTasksByAssignee);
router.get('/assigner/:userId', requireAuth, taskController.listTasksByAssigner);
router.get('/:id', requireAuth, taskController.getTaskById);
router.patch('/:id', requireAuth, taskController.updateTaskById);
router.delete('/:id', requireAuth, taskController.deleteTaskById);

module.exports = router;


