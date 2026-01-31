'use strict';

const express = require('express');

const userController = require('../controllers/userController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// All user routes are protected
router.get('/search', requireAuth, userController.searchUsers);

module.exports = router;



