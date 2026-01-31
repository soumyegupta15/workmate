'use strict';

const express = require('express');

const orgMemberController = require('../controllers/orgMemberController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// All org member routes are protected
router.post('/', requireAuth, orgMemberController.createOrgMember);
router.get('/', requireAuth, orgMemberController.listOrgMembers);
router.get('/:id', requireAuth, orgMemberController.getOrgMemberById);
router.patch('/:id', requireAuth, orgMemberController.updateOrgMemberById);
router.delete('/:id', requireAuth, orgMemberController.deleteOrgMemberById);

module.exports = router;


