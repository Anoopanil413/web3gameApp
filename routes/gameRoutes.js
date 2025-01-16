
const express = require('express');
const { generateClaimLink, getLeaderboard } = require('../controllers/gameController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.get('/generate-claim-link', authenticate, generateClaimLink);
router.get('/leaderboard', getLeaderboard);

module.exports = router;
