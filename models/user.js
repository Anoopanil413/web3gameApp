
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    twitterId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    profileImage: { type: String },
    score: { type: Number, default: 0 },
});

module.exports = mongoose.model('User', userSchema);
