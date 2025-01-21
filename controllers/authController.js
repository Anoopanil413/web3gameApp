
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

exports.twitterAUthenticate = async (req, res,next) => {
    try {
        console.log("reached twiteer")
         await passport.authenticate('twitter',{session:false})(req, res,next);

}catch(error){
    console.log("error",error);
}
}

exports.twitterCallback = async (req, res) => {
    try {
        await passport.authenticate('twitter', {session:false},{
            successRedirect: `${process.env.FRONTENT_URL}/`,
            failureRedirect: `${process.env.FRONTENT_URL}/`
        })(req, res);
    } catch (error) {
        console.log("error",error);
    }
};




