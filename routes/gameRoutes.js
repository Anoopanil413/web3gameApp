
const express = require('express');
const { generateClaimLink, getLeaderboard, startGame, finishGame, getUnclaimedScores, claimScores } = require('../controllers/gameController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.get('/generate-claim-link', authenticate, generateClaimLink);
router.get('/leaderboard', getLeaderboard);
router.post("/start",authenticate, startGame);
router.post("/finish", authenticate,finishGame);
router.get("/unClaimedScores", authenticate, getUnclaimedScores);
router.post("/claimScore", authenticate, claimScores);
module.exports = router;
