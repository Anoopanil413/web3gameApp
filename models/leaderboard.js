
const mongoose = require('mongoose');

const leaderboardSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    score: { type: Number, required: true },
    claimId: { type: String },
    claimedAt: { type: Date },
});

module.exports = mongoose.model('Leaderboard', leaderboardSchema);
