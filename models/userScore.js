// models/Game.js
const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  score: { type: Number },
  playTime: { type: Number },
  status: { 
    type: String, 
    enum: ['in_progress', 'completed', 'abandoned'],
    default: 'in_progress'
  },
  claimed: { type: Boolean, default: false },
claimedAt: { type: Date },
createdAt: { type: Date, default: Date.now },
claimId: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('UserScore', gameSchema);