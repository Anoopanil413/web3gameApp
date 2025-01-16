
const jwt = require('jsonwebtoken');
const User = require('../models/user');

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



// // Frontend: src/components/TwitterLogin.js
// import React from 'react';

// const TwitterLogin = () => {
//   const handleTwitterLogin = () => {
//     // Redirect to backend auth route
//     window.location.href = `${process.env.REACT_APP_API_URL}/auth/twitter`;
//   };

//   return (
//     <button 
//       onClick={handleTwitterLogin}
//       className="bg-blue-400 text-white px-4 py-2 rounded-md flex items-center gap-2"
//     >
//       <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white">
//         <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
//       </svg>
//       Login with Twitter
//     </button>
//   );
// };

// export default TwitterLogin;

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

// // Backend: models/User.js
// const mongoose = require('mongoose');

// const userSchema = new mongoose.Schema({
//   twitterId: {
//     type: String,
//     required: true,
//     unique: true
//   },
//   name: {
//     type: String,
//     required: true
//   },
//   username: {
//     type: String,
//     required: true
//   },
//   email: {
//     type: String,
//     required: true
//   },
//   profileImage: String,
//   twitterToken: String,
//   twitterTokenSecret: String,
//   createdAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// module.exports = mongoose.model('User', userSchema);

// // Backend: routes/auth.js
// const express = require('express');
// const router = express.Router();
// const passport = require('passport');
// const jwt = require('jsonwebtoken');

// // Initialize Twitter authentication
// router.get('/twitter', passport.authenticate('twitter'));

// // Twitter callback route
// router.get(
//   '/twitter/callback',
//   passport.authenticate('twitter', { session: false }),
//   (req, res) => {
//     // Create JWT token
//     const token = jwt.sign(
//       { id: req.user.id },
//       process.env.JWT_SECRET,
//       { expiresIn: '1d' }
//     );

//     // Redirect to frontend with token
//     res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
//   }
// );

// // Get user profile route
// router.get('/profile', passport.authenticate('jwt', { session: false }), 
//   (req, res) => {
//     res.json(req.user);
//   }
// );

// module.exports = router;

// // Backend: server.js
// const express = require('express');
// const mongoose = require('mongoose');
// const passport = require('passport');
// const cors = require('cors');
// require('./config/passport');

// const app = express();

// // Middleware
// app.use(cors({
//   origin: process.env.FRONTEND_URL,
//   credentials: true
// }));
// app.use(express.json());
// app.use(passport.initialize());

// // Routes
// app.use('/auth', require('./routes/auth'));

// // Connect to MongoDB
// mongoose.connect(process.env.MONGODB_URI)
//   .then(() => console.log('Connected to MongoDB'))
//   .catch(err => console.error('MongoDB connection error:', err));

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
