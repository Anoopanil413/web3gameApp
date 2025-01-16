
const twitterClient = require('../config/twitterAuth');

async function verifyTweet(userId, claimToken, requiredHandle) {
    const userTimeline = await twitterClient.v2.userTimeline(userId, { max_results: 5 });
    
    const validTweet = userTimeline.data.some(tweet =>
        tweet.text.includes(requiredHandle) && tweet.text.includes(claimToken)
    );
    return validTweet;
}

module.exports = verifyTweet;
