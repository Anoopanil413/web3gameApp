
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const passport = require('../config/passport');

exports.authenticate = async (req, res) => {
    try {
        const { twitterId, name, profileImage } = req.body;

        let user = await User.findOne({ twitterId });

        if (!user) {
            user = new User({ twitterId, name, profileImage });
            await user.save();
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

        res.status(200).json({ token });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.twitterAUthenticate = (req, res, next) => {
    console.log("Initiating Twitter Authentication");
    passport.authenticate('twitter', { session: false })(req, res, next);
};


exports.twitterCallback = (req, res, next) => {
  passport.authenticate('twitter', { session: false }, (err, user, info) => {
    // Log detailed error information for debugging
    if (err) {
      console.error('Authentication Error:', err);
      return res.redirect(`${process.env.FRONTEND_URL}/?error=authentication_failed`);
    }

    if (!user) {
      console.warn('No user found during authentication', info);
      return res.redirect(`${process.env.FRONTEND_URL}/?error=user_not_found`);
    }

    req.logIn(user, { session: false }, (loginErr) => {
      if (loginErr) {
        console.error('Login Error:', loginErr);
        return res.redirect(`${process.env.FRONTEND_URL}/?error=login_failed`);
      }

      try {
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
        console.log('Successful Authentication - Redirecting with Token');
        
        const encodedToken = encodeURIComponent(token);
        res.redirect(`${process.env.FRONTEND_URL}/?token=${encodedToken}`);
      } catch (tokenError) {
        console.error('Token Generation Error:', tokenError);
        return res.redirect(`${process.env.FRONTEND_URL}/?error=token_generation_failed`);
      }
    });
  })(req, res, next);
};



