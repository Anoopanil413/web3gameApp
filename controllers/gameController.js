const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Leaderboard = require("../models/leaderboard");
const { generateToken, verifyToken } = require("../utils/jwt.utils");
const userScore = require("../models/userScore");
const { TwitterApi } = require("twitter-api-v2");
const { extractTweetId } = require("../utils/functions");
const leaderboard = require("../models/leaderboard");
const passport = require("passport");
const TwitterStrategy = require("passport-twitter").Strategy;

exports.generateClaimLink = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    const claimLink = `${process.env.FRONTEND_URL}/claim?token=${token}`;

    res.status(200).json({ claimLink });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await Leaderboard.find()
      .sort({ score: -1 })
      .limit(10)
      .select("user score claimStatus");
    res.status(200).json(leaderboard);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.getUserdata = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.startGame = async (req, res) => {
  try {
    const userId = req.userId; // Assuming authenticated middleware

    // Create game start token with current timestamp
    const gameToken = jwt.sign(
      {
        userId: userId,
        startTime: Date.now(),
        type: "game_start",
      },
      process.env.GAME_SECRET,
      { expiresIn: "2h" }
    );

    // Optional: Create game record in database
    const gameSession = await userScore.create({
      userId: userId,
      startTime: new Date(),
      status: "in_progress",
    });

    res.status(200).json({
      message: "Game Started",
      gameToken: gameToken,
      gameSessionId: gameSession._id,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Game start failed", error: error.message });
  }
};

exports.finishGame = async (req, res) => {
  try {
    const { gameToken, score } = req.body;

    // Verify game token
    const decoded = jwt.verify(gameToken, process.env.GAME_SECRET);

    // Validate token type and user
    if (decoded.type !== "game_start") {
      return res.status(400).json({ message: "Invalid game token" });
    }

    const playTime = Date.now() - decoded.startTime;

    // Update game record
    await userScore.findOneAndUpdate(
      { userId: decoded.userId, status: "in_progress" },
      {
        endTime: new Date(),
        score: score,
        playTime: playTime,
        status: "completed",
      }
    );

    res.status(200).json({
      message: "Game Finished",
      playTime: playTime,
      score: score,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Game finish failed", error: error.message });
  }
};

// controllers/gameController.js
exports.verifyTweetAndClaimPoints = async (req, res) => {
  try {
    const { tweetId: tweetIdOrUrl, scoreId } = req.body;

    if (!tweetIdOrUrl) {
      return res.status(400).json({
        success: false,
        message: "Tweet ID or URL is required",
      });
    }

    // Extract tweet ID from URL or use the provided ID
    const tweetId = extractTweetId(tweetIdOrUrl);
    if (!tweetId) {
      return res.status(400).json({
        success: false,
        message: "Invalid tweet ID or URL format",
      });
    }

    // Get user from passport session
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Fetch user with their Twitter tokens
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    // Check if user has claimed points within the last 15 minutes
    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

    if (user.lastClaimed && user.lastClaimed > fifteenMinutesAgo) {
      const remainingTime = Math.ceil(
        (user.lastClaimed.getTime() - fifteenMinutesAgo.getTime()) / 1000 / 60
      );
      return res.status(400).json({
        success: false,
        message: `Please wait ${remainingTime} minutes before claiming points again`,
      });
    }

    // Update user's last claimed time
    user.lastClaimed = now;
    await user.save();

    if (!user.twitterToken || !user.twitterTokenSecret) {
      return res.status(400).json({
        success: false,
        message: "Twitter authentication required",
      });
    }

    // Initialize Twitter client with user's tokens
    const userTwitterClient = new TwitterApi({
      appKey: process.env.TWITTER_CLIENT_ID,
      appSecret: process.env.TWITTER_CLIENT_SECRET,
      accessToken: user.twitterToken,
      accessSecret: user.twitterTokenSecret,
    });

    // Fetch tweet with full context
    const tweet = await userTwitterClient.v2.singleTweet(tweetId, {
      expansions: ["author_id"],
      "tweet.fields": ["text", "author_id", "created_at", "public_metrics"],
    });

    // Verify tweet exists
    if (!tweet.data) {
      return res.status(404).json({
        success: false,
        message: "Tweet not found",
      });
    }

    // Verify tweet belongs to user
    if (tweet.data.author_id !== user.twitterId) {
      return res.status(403).json({
        success: false,
        message: "Tweet not from authenticated user",
      });
    }

    // Verify tweet was posted within the last hour
    const tweetDate = new Date(tweet.data.created_at);
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (tweetDate < hourAgo) {
      return res.status(400).json({
        success: false,
        message: "Tweet is older than one hour",
      });
    }

    // Verify required content
    const requiredContent = {
      name: "Your Game Name",
      url: "yourgame.com/play",
      hashtag: "#YourGameTag",
    };

    const tweetText = tweet.data.text.toLowerCase();
    const missingContent = [];

    if (!tweetText.includes(requiredContent.url.toLowerCase())) {
      missingContent.push("game URL");
    }
    if (!tweetText.includes(requiredContent.hashtag.toLowerCase())) {
      missingContent.push("game hashtag");
    }

    if (missingContent.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Tweet missing required content: ${missingContent.join(", ")}`,
        required: requiredContent,
      });
    }

    // Check if tweet has already been used
    const existingGame = await userScore.findOne({ claimId: tweetId });
    if (existingGame) {
      return res.status(400).json({
        success: false,
        message: "This tweet has already been used to claim points",
      });
    }
    // Find active game and update
    const game = await userScore.findByIdAndUpdate(
      scoreId,
      {
        claimId: tweetId,
        claimed: true,
        claimedAt: new Date(),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!game) {
      return res.status(404).json({
        success: false,
        message: "No eligible game found to claim points",
      });
    }
    user.lastClaimed = now;
    await user.save();
    const newLeaderboardEntry = new leaderboard({
      user: userId,
      score: game.score,
      claimId: tweetId,
      claimedAt: new Date(),
    });

    await newLeaderboardEntry.save();

    // Success response
    res.status(200).json({
      success: true,
      message: "Points claimed successfully",
      data: {
        points: game.score,
        game: {
          id: game._id,
          score: game.score,
          status: game.status,
          verifiedAt: game.verifiedAt,
          tweetMetrics: game.tweetMetrics,
        },
        tweet: {
          id: tweet.data.id,
          text: tweet.data.text,
          created_at: tweet.data.created_at,
          metrics: tweet.data.public_metrics,
        },
      },
    });
  } catch (error) {
    console.error("Tweet verification error:", error);

    // Handle specific Twitter API errors
    if (error.code === "ENOTFOUND") {
      return res.status(500).json({
        success: false,
        message: "Failed to connect to Twitter API",
      });
    }

    // Handle rate limiting
    if (error.code === 429) {
      return res.status(429).json({
        success: false,
        message: "Twitter API rate limit exceeded. Please try again later.",
      });
    }

    // Handle other Twitter API errors
    if (error.code) {
      return res.status(400).json({
        success: false,
        message: "Twitter API error",
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to verify tweet",
      error: error.message,
    });
  }
};
// Route for getting tweet template and game URL
exports.getGameShareInfo = async (req, res) => {
  try {
    const user = req.user;
    const gameScore = req.query.score;

    const shareInfo = {
      tweetTemplate: `I just scored ${gameScore} points in GameName! Try beating my score at yourgame.com/play #GameName`,
      gameUrl: "yourgame.com/play",
    };

    res.status(200).json(shareInfo);
  } catch (error) {
    res.status(500).json({ message: "Failed to get share info" });
  }
};

exports.getUnclaimedScores = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const unclaimedScores = await userScore.find({
      userId: userId,
      claimed: false,
    });
    res.status(200).json(unclaimedScores);
  } catch (error) {
    res.status(500).json({ message: "Failed to get unclaimed scores" });
  }
};



exports.claimScores = async (req, res) => {
  try {
    const { scoreId } = req.body;
    const userId = req.userId;
    
    // Input validation
    if (!scoreId || !userId) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required parameters" 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Get score details from database
    const score = await userScore.findById(scoreId);
    if (!score) {
      return res.status(404).json({ 
        success: false, 
        error: "Score not found" 
      });
    }

    // Check if score is already claimed
    if (score.claimed) {
      return res.status(400).json({ 
        success: false, 
        error: "Score already claimed" 
      });
    }

    // Check if user has claimed points within the last 15 minutes
    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

    if (user.lastClaimed && user.lastClaimed > fifteenMinutesAgo) {
      const remainingTime = Math.ceil(
        (user.lastClaimed.getTime() - fifteenMinutesAgo.getTime()) / 1000 / 60
      );
      return res.status(400).json({
        success: false,
        message: `Please wait ${remainingTime} minutes before claiming points again`,
      });
    }
    console.log("user",user)
    // Check if user has Twitter tokens
    if (!user.twitterToken || !user.twitterTokenSecret) {
      return res.status(400).json({
        success: false,
        message: "Twitter authentication required"
      });
    }

    // Initialize Twitter client with user's tokens
    const twitterClient = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: user.twitterToken,
      accessSecret: user.twitterTokenSecret,
    });

    let tweet;
let retryCount = 0;
const maxRetries = 3;

while (retryCount < maxRetries) {
  try {
    const uniqueId = new Date().getTime(); // Generate a unique ID based on the current timestamp
        const response = await twitterClient.v2.tweet(
          `I have won ${score.score} #seifshunt points and part of everyday $sei #airdrop fun. Play #seifshunt and claim your free #airdropped $seifs using my referral. Join the best sei meme game here : cyberfox.app #SeiDeFi #SeiEcosystem #SeiCommunity #SeiTrading #SeiMemes #captainSeifs $sei $seifs #dragonswap #Bullrun2025 #Giveaway #GiveawayAlert #giveawayUSER #Bullrun2025 #seifshunt #Airdrop #Airdrops #AirdropAlert #AirdropCrypto #airdropcampaign #newairdrop #seiairdrop #airdropfarm #memecoin1000x #seimemes #SEI #SEIFS #SeiSwap ${uniqueId}`
        );
    tweet = response.data;
    break;
  } catch (twitterError) {
    console.error("Twitter API Error:", twitterError);
    
    // Handle authentication error
    if (twitterError.data?.status === 403) {
      return res.status(401).json({
        success: false,
        message: "Twitter authentication expired. Please re-login.",
      });
    }
    
    // Rate limit handling (429)
    if (twitterError.data?.status === 429) {
      console.log("Rate limit exceeded. Retrying after delay...");
      await new Promise(resolve => setTimeout(resolve, 15000)); // Wait 15s
    }

    retryCount++;
    if (retryCount === maxRetries) {
      throw new Error(`Failed to post tweet after ${maxRetries} attempts: ${twitterError.message}`);
    }
    
    // Exponential backoff (wait 1s, then 2s, then 4s)
    await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
  }
}

    // Get user's Twitter username for the tweet URL
    const meUser = await twitterClient.v2.me();
    const username = meUser.data.username;

    // Use a transaction for database updates
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Update score record
      await userScore.findByIdAndUpdate(
        scoreId,
        {
          claimed: true,
          claimedBy: userId,
          claimedAt: now,
          tweetId: tweet.id
        },
        { session }
      );

      // Create leaderboard entry
      const newLeaderboardEntry = new leaderboard({
        user: userId,
        score: score.score,
        claimId: tweet.id,
        claimedAt: now
      });
      await newLeaderboardEntry.save({ session });

      // Update user's last claimed timestamp
      user.lastClaimed = now;
      await user.save({ session });

      await session.commitTransaction();

      return res.json({
        success: true,
        tweetId: tweet.id,
        tweetUrl: `https://twitter.com/${username}/status/${tweet.id}`
      });
    } catch (dbError) {
      await session.abortTransaction();
      throw new Error(`Database transaction failed: ${dbError.message}`);
    } finally {
      session.endSession();
    }

  } catch (error) {
    console.error("Score claim error:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to claim score",
      message: error.message 
    });
  }
};