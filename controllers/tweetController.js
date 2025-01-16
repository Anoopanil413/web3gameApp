
const jwt = require('jsonwebtoken');
const verifyTweet = require('../utils/verifyTweet');
const User = require('../models/user');
const Leaderboard = require('../models/leaderboard');

exports.verifyClaim = async (req, res) => {
    try {
        const { token } = req.query;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) return res.status(404).json({ error: 'User not found' });

        const isVerified = await verifyTweet(user.twitterId, token, process.env.TWITTER_PAGE);

        if (isVerified) {
            const score = req.body.points || 0;

            await Leaderboard.create({
                user: user.id,
                score,
                claimStatus: 'claimed',
            });

            user.score += score;
            await user.save();

            return res.status(200).json({ success: true, message: 'Score claimed successfully!' });
        } else {
            return res.status(400).json({ error: 'Tweet verification failed!' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};
