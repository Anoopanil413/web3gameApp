
const mongoose = require('mongoose');

const leaderboardSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    score: { type: Number, required: true },
    claimStatus: { type: String, enum: ['claimed', 'unclaimed'], default: 'unclaimed' },
});

module.exports = mongoose.model('Leaderboard', leaderboardSchema);
