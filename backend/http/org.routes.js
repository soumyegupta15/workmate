'use strict';

const express = require('express');

const orgController = require('../controllers/orgController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// All organisation routes are protected
// Get organisations where the given user is admin (org_members.is_admin = true)
router.get('/admin/:userId', requireAuth, orgController.listAdminOrganisationsForUser);
router.get('/admin', requireAuth, orgController.listAdminOrganisations);

// Org stats (counts)
router.get('/:orgId/projects/count', requireAuth, orgController.getOrgProjectCount);
router.get('/:orgId/members/count', requireAuth, orgController.getOrgMemberCount);
router.get('/:orgId/tasks/count', requireAuth, orgController.getOrgTaskCount);

// Org related resources
router.get('/:orgId/projects/summary', requireAuth, orgController.listOrgProjectSummaries);
router.get('/:orgId/projects', requireAuth, orgController.listOrgProjects);
router.get('/:orgId/members', requireAuth, orgController.listOrgMembersDetailed);
router.post('/:orgId/members/invite', requireAuth, orgController.inviteOrgMembers);

// Org details + update
router.get('/:orgId', requireAuth, orgController.getOrganisationById);
router.patch('/:orgId', requireAuth, orgController.updateOrganisation);
router.delete('/:orgId', requireAuth, orgController.deleteOrganisationById);

router.get('/', requireAuth, orgController.listOrganisations);
// Preferred: pass userId in URL so backend can create org_members row
router.post('/:userId', requireAuth, orgController.createOrganisation);
// Backwards compatible: if userId is not provided, we fall back to req.user.id
router.post('/', requireAuth, orgController.createOrganisation);

module.exports = router;



