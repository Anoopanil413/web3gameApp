
const express = require('express');
const { authenticate, twitterAUthenticate } = require('../controllers/authController');

const router = express.Router();

router.post('/authenticate', authenticate);
router.get('/twitter', twitterAUthenticate);

module.exports = router;
