
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Leaderboard = require('../models/leaderboard');

exports.generateClaimLink = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const claimLink = `${process.env.FRONTEND_URL}/claim?token=${token}`;

        res.status(200).json({ claimLink });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getLeaderboard = async (req, res) => {
    try {
        const leaderboard = await Leaderboard.find().sort({ score: -1 }).limit(10).select('user score claimStatus');
        res.status(200).json(leaderboard);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getUserdata = async (req, res) => {
    try {
        const user = await User.findById(req.userId);    
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};
