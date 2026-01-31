'use strict';

const express = require('express');

const projectController = require('../controllers/projectController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// All project routes are protected
router.get('/admin', requireAuth, projectController.listAdminProjects);
// List projects where current user is a project member (or creator)
router.get('/mine', requireAuth, projectController.listMyProjects);
// Get projects created by the given user (projects.created_by = :userId)
router.get('/created-by/:userId', requireAuth, projectController.listProjectsCreatedByUser);
// Project task stats (must be a project member)
router.get('/:projectId/tasks/stats', requireAuth, projectController.getProjectTaskStats);
// Project team stats (must be a project member)
router.get('/:projectId/team/stats', requireAuth, projectController.getProjectTeamStats);
// Get a single project by id (must be a project member)
router.get('/:projectId', requireAuth, projectController.getProjectById);
// Update project (must be a project admin: owner/manager)
router.patch('/:projectId', requireAuth, projectController.updateProjectById);
// Delete project (must be a project admin: owner/manager)
router.delete('/:projectId', requireAuth, projectController.deleteProjectById);
// Preferred: pass userId in URL so backend can create project_members row
router.post('/:userId', requireAuth, projectController.createProject);
// Backwards compatible: if userId is not provided, we fall back to req.user.id
router.post('/', requireAuth, projectController.createProject);

module.exports = router;



