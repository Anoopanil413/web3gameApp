
const express = require('express');
const { authenticate, twitterAUthenticate,twitterCallback } = require('../controllers/authController');
const authMiddleware = require('../middleware/authenticate');
const { getUserdata } = require('../controllers/gameController');

const router = express.Router();

router.post('/authenticate', authenticate);
router.get('/twitter', twitterAUthenticate);
router.get('/twitter/callback', twitterCallback);
router.get('/user',authMiddleware,getUserdata)
module.exports = router;
