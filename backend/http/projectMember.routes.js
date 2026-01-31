'use strict';

const express = require('express');

const projectMemberController = require('../controllers/projectMemberController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// All project member routes are protected
router.post('/', requireAuth, projectMemberController.createProjectMember);
router.get('/', requireAuth, projectMemberController.listProjectMembers);
router.get('/:id', requireAuth, projectMemberController.getProjectMemberById);
router.patch('/:id', requireAuth, projectMemberController.updateProjectMemberById);
router.delete('/:id', requireAuth, projectMemberController.deleteProjectMemberById);

module.exports = router;


