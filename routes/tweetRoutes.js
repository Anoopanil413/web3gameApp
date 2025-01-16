
const express = require('express');
const { verifyClaim } = require('../controllers/tweetController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.post('/verify-claim', authenticate, verifyClaim);

module.exports = router;
