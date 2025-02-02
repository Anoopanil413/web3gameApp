
const express = require('express');
const { generateClaimLink, getLeaderboard, startGame, finishGame } = require('../controllers/gameController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.get('/generate-claim-link', authenticate, generateClaimLink);
router.get('/leaderboard', getLeaderboard);
router.post("/start", startGame);
router.post("/finish", finishGame);
module.exports = router;
