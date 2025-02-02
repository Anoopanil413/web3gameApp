
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Leaderboard = require('../models/leaderboard');
const { generateToken, verifyToken } = require('../utils/jwt.utils');
const userScore = require('../models/userScore');

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


exports.startGame = async (req, res) => {
    try {
      const userId = req.user.id; // Assuming authenticated middleware
  
      // Create game start token with current timestamp
      const gameToken = jwt.sign(
        { 
          userId: userId, 
          startTime: Date.now(),
          type: 'game_start'
        }, 
        process.env.GAME_SECRET, 
        { expiresIn: '2h' }
      );
  
      // Optional: Create game record in database
      const gameSession = await userScore.create({
        userId: userId,
        startTime: new Date(),
        status: 'in_progress'
      });
  
      res.status(200).json({
        message: 'Game Started',
        gameToken: gameToken,
        gameSessionId: gameSession._id
      });
    } catch (error) {
      res.status(500).json({ message: 'Game start failed', error: error.message });
    }
  };
  
  exports.finishGame = async (req, res) => {
    try {
      const { gameToken, score } = req.body;
      
      // Verify game token
      const decoded = jwt.verify(gameToken, process.env.GAME_SECRET);
  
      // Validate token type and user
      if (decoded.type !== 'game_start') {
        return res.status(400).json({ message: 'Invalid game token' });
      }
  
      const playTime = Date.now() - decoded.startTime;
  
      // Update game record
      await userScore.findOneAndUpdate(
        { userId: decoded.userId, status: 'in_progress' },
        {
          endTime: new Date(),
          score: score,
          playTime: playTime,
          status: 'completed'
        }
      );
  
      res.status(200).json({
        message: 'Game Finished',
        playTime: playTime,
        score: score
      });
    } catch (error) {
      res.status(500).json({ message: 'Game finish failed', error: error.message });
    }
  };