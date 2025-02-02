
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    twitterId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    username: { type: String, required: true },
    email: { type: String, required: true },
    profileImage: { type: String },
    twitterToken: { type: String },
    twitterTokenSecret: { type: String },
    score: { type: Number, default: 0 },
    lastClaimed: { type: Date },
});

module.exports = mongoose.model('User', userSchema);
