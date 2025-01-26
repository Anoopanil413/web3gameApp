
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
      if (err || !user) {
        return res.redirect(`${process.env.FRONTEND_URL}/`);
      }
        req.logIn(user, { session: false }, (loginErr) => {
        if (loginErr) {
          return res.status(500).json({ message: 'Login failed' });
        }
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
        console.log(process.env.FRONTEND_URL,"Redirecting to frontend with token",token);
        res.redirect(`${process.env.FRONTEND_URL}/?token=${token}`); });
    })(req, res, next);
  };
  




