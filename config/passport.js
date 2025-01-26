const passport = require('passport');
const TwitterStrategy = require('passport-twitter').Strategy;
const User = require('../models/user');
const { twitterConfig } = require('./twitterAuth');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

passport.use(
  new TwitterStrategy(twitterConfig,
    async (token, tokenSecret, profile, done) => {
      try {
        let user = await User.findOne({ twitterId: profile.id });

        if (!user) {
          user = await User.create({
            twitterId: profile.id,
            name: profile.displayName,
            username: profile.username,
            email: profile.emails[0].value,
            profileImage: profile.photos[0].value,
            twitterToken: token,
            twitterTokenSecret: tokenSecret
          });
        }
        console.log("User",user);

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);
module.exports = passport;