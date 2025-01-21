
const express = require('express');
const { authenticate, twitterAUthenticate,twitterCallback } = require('../controllers/authController');

const router = express.Router();

router.post('/authenticate', authenticate);
router.get('/twitter', twitterAUthenticate);
router.get('/twitter/callback', twitterCallback);
module.exports = router;
