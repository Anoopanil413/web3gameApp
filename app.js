
require('dotenv').config();
const express = require('express');
const connectDB = require('./config/database');

const authRoutes = require('./routes/authRoutes');
const gameRoutes = require('./routes/gameRoutes');
const tweetRoutes = require('./routes/tweetRoutes');
const cors = require('cors');
const session = require('express-session');
const passport =  require('./config/passport');  



const app = express();

// Connect Database
connectDB();
app.use(
    cors({
      origin: process.env.FRONTEND_URL, // Replace with your frontend URL
      methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
      credentials: true, // Allow cookies and authorization headers
    })
  );
// Middleware
app.use(express.json());
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'your-secret-key',
        resave: false,
        saveUninitialized: true,
    })
);

app.use(passport.initialize());
app.use(passport.session());
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/tweet', tweetRoutes);

// Error Handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
