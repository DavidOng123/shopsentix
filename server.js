require('dotenv').config()

const express = require('express')
const cors = require('cors');
const app = express()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

app.use(cors());
app.use(express.json())
app.use(helmet());
const { UserModel } = require('./db');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});
app.use('/register', limiter);
app.use('/login', limiter);

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401); // Unauthorized
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403); // Forbidden
    }
    req.user = user; // Attach the user object to the request
    next();
  });
}

// Route to retrieve user details based on the access token
app.get('/user-details', authenticateToken, async (req, res) => {
  try {
    // Access the user object attached to the request
    const { email, username } = req.user;

    // You can fetch additional user details from the database if needed
    // Example:
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Respond with user details
    res.json({ email, username, /* Add other user details here */ });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
  ],
  async (req, res) => {
    try {
      const { username, email, password, phoneNumber, address } = req.body;

      // Validate user inputs
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Check if email is already registered
      const existingUser = await UserModel.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email is already registered' });
      }

      // Hash and salt the password before storing it
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create a new user
      const newUser = new UserModel({
        username,
        email,
        password: hashedPassword,
        phoneNumber,
        address,
      });

      await newUser.save(); // Save the user to the database

      res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Registration failed' });
    }
  }
);

app.post('/token', (req, res) => {
    const refreshToken = req.body.token
    if (refreshToken == null) return res.sendStatus(401)
    if (!refreshTokens.includes(refreshToken)) return res.sendStatus(403)
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
      if (err) return res.sendStatus(403)
      const accessToken = generateAccessToken({ name: user.name })
      res.json({ accessToken: accessToken })
    })
  })

  app.delete('/logout', (req, res) => {
    const refreshToken = req.body.token;
    if (!refreshToken) {
      return res.sendStatus(400); 
    }
  
   
    refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
    res.sendStatus(204); 
  });
  

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const payload = { email: user.email, username: user.username };
    const accessToken = generateAccessToken(payload);

    // Generate and store a refresh token in the database
    const refreshToken = generateRefreshToken(payload);

    // Store the refresh token in the user's document
    user.refreshToken = refreshToken;
    await user.save();

    res.json({ accessToken, refreshToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Login failed' });
  }
});


function generateAccessToken(payload) {
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
}

function generateRefreshToken(payload) {
  return jwt.sign(payload, process.env. REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
}

app.listen(4000)