
// const { TwitterApi } = require('twitter-api-v2');

// const twitterClient = new TwitterApi({
//     clientId: process.env.TWITTER_CLIENT_ID,
//     clientSecret: process.env.TWITTER_CLIENT_SECRET,

//     appKey: process.env.TWITTER_API_KEY,
//     appSecret: process.env.TWITTER_API_SECRET,
//     accessToken: process.env.TWITTER_ACCESS_TOKEN,
//     accessSecret: process.env.TWITTER_ACCESS_SECRET,
//     scope: ['tweet.read', 'users.read', 'offline.access']

// });

 exports.twitterConfig = {
    consumerKey: process.env.TWITTER_API_KEY,
    consumerSecret: process.env.TWITTER_API_SECRET,
    clientID: process.env.TWITTER_CLIENT_ID,
    clientSecret: process.env.TWITTER_CLIENT_SECRET,
    callbackURL: process.env.TWITTER_CALLBACK_URL,
    scope: ['tweet.read', 'users.read', 'offline.access']
  };

 
  


// // Backend: config/passport.js
// const passport = require('passport');
// const TwitterStrategy = require('passport-twitter').Strategy;
// const User = require('../models/User');

// passport.serializeUser((user, done) => {
//   done(null, user.id);
// });

// passport.deserializeUser(async (id, done) => {
//   try {
//     const user = await User.findById(id);
//     done(null, user);
//   } catch (error) {
//     done(error, null);
//   }
// });

// passport.use(
//   new TwitterStrategy(
//     {
//       consumerKey: process.env.TWITTER_API_KEY,
//       consumerSecret: process.env.TWITTER_API_SECRET,
//       callbackURL: '/auth/twitter/callback',
//       includeEmail: true
//     },
//     async (token, tokenSecret, profile, done) => {
//       try {
//         // Check if user exists
//         let user = await User.findOne({ twitterId: profile.id });

//         if (!user) {
//           // Create new user if doesn't exist
//           user = await User.create({
//             twitterId: profile.id,
//             name: profile.displayName,
//             username: profile.username,
//             email: profile.emails[0].value,
//             profileImage: profile.photos[0].value,
//             twitterToken: token,
//             twitterTokenSecret: tokenSecret
//           });
//         }

//         return done(null, user);
//       } catch (error) {
//         return done(error, null);
//       }
//     }
//   )
// );