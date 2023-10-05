require('dotenv').config()

const express = require('express')
const cors = require('cors');
const multer = require('multer');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const app = express()
const jwt = require('jsonwebtoken')
const crypto=require('crypto');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit'); 
const path = require('path');
const cookieParser = require('cookie-parser');


app.use(cookieParser());
app.use(express.json())
app.use(helmet());
app.use(bodyParser.json());
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


const { UserModel , ProductModel} = require('./db');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads'); // Absolute path to 'uploads'
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    console.log('File being processed:', file);
    cb(null, true); // Accept all files for now, you can add validation here
  },
});

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
    return res.sendStatus(401); 
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403); 
    }
    req.user = user; 
    next();
  });
}


app.get('/user-details', authenticateToken, async (req, res) => {
  try {
    
    const { email, username } = req.user;

    
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

  
    res.json({ email, username,  });
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

app.post('/token', async (req, res) => {
    const refreshToken = req.body.token
    if (refreshToken == null) return res.sendStatus(401)

    try {
      const user = await UserModel.findOne({ refreshToken });
      if (!user) return res.sendStatus(403);
    
      const accessToken = generateAccessToken({ email: user.email, username: user.username });
      res.json({ accessToken });
    } catch (error) {
      console.error(error);
      res.sendStatus(403);
    }
    
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

   
    const refreshToken = generateRefreshToken(payload);
   
    user.refreshToken = refreshToken;
    await user.save();

    res.cookie('access_token', accessToken, { httpOnly: true });
    res.cookie('refresh_token', refreshToken, { httpOnly: true });
    res.json({ accessToken, refreshToken });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Login failed' });
  }
});

app.post('/reset-password', async (req, res) => {
  const { email } = req.body.email;

  const resetToken = generateResetToken();
  const resetTokenExpiration = new Date().getTime() + 3600000; // 1 hour from now

  try {
    
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.resetToken = resetToken;
    user.resetTokenExpiration = resetTokenExpiration;
    await user.save();

    // Send an email to the user with a link to reset their password
    const transporter = nodemailer.createTransport({
      service: 'Gmail', // e.g., Gmail
      auth: {
        user: process.env.EMAIL_SERVIDE_USER,
        pass: process.env.EMAIL_SERVIDE_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_SERVIDE_USER,
      to: email,
      subject: 'Password Reset Request',
      text: `Click the following link to reset your password: http://localhost:4000/reset-password/${resetToken}`,
    };

    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ message: 'Password reset email not sent.' });
      }

      res.status(200).json({ message: 'Password reset email sent.' });
    });
  } catch (error) {
    console.error('Password reset request failed:', error);
    res.status(500).json({ message: 'Password reset request failed. Please try again.' });
  }
});

app.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    const user = await UserModel.findOne({ resetToken: token });

    if (!user || user.resetTokenExpiration < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired token.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;
    await user.save();

    res.status(200).json({ message: 'Password reset successful.' });
  } catch (error) {
    console.error('Password reset failed:', error);
    res.status(500).json({ message: 'Password reset failed. Please try again.' });
  }
});

// Create a new product
app.post('/products', upload.single('image'), async (req, res) => {
  try {
    console.log('Uploaded file:', req.file);
    const file_name = req.file.filename;
    const { name, price, description, category, attributes } = req.body;

    // Parse the attributes value from JSON string to an array
    const parsedAttributes = JSON.parse(attributes);

    const newProduct = new ProductModel({
      name,
      price,
      description,
      category,
      attributes: parsedAttributes, // Store as an array
      file_name,
    });

    await newProduct.save();

    res.status(201).json({ message: 'Product created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create the product' });
  }
});

// Get a list of all products
app.get('/products', async (req, res) => {
try {
  const products = await ProductModel.find();
  res.json(products);
} catch (error) {
  console.error(error);
  res.status(500).json({ message: 'Failed to fetch products' });
}
});


// Get a single product by ID
app.get('/products/:productId', async (req, res) => {
try {
  const { productId } = req.params;
  const product = await ProductModel.findById(productId);

  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  res.json(product);
} catch (error) {
  console.error(error);
  res.status(500).json({ message: 'Failed to fetch the product' });
}
});

// Update a product by ID
app.put('/products/:productId', async (req, res) => {
try {
  const { productId } = req.params;
  const { name, price, description, category, attributes } = req.body;

  const updatedProduct = await ProductModel.findByIdAndUpdate(
    productId,
    {
      name,
      price,
      description,
      category,
      attributes,
    },
    { new: true }
  );

  if (!updatedProduct) {
    return res.status(404).json({ message: 'Product not found' });
  }

  res.json(updatedProduct);
} catch (error) {
  console.error(error);
  res.status(500).json({ message: 'Failed to update the product' });
}
});

// Delete a product by ID
app.delete('/products/:productId', async (req, res) => {
try {
  const { productId } = req.params;

  const deletedProduct = await ProductModel.findByIdAndRemove(productId);

  if (!deletedProduct) {
    return res.status(404).json({ message: 'Product not found' });
  }

  res.json({ message: 'Product deleted successfully' });
} catch (error) {
  console.error(error);
  res.status(500).json({ message: 'Failed to delete the product' });
}
});


function generateAccessToken(payload) {
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10m' });
}

function generateRefreshToken(payload) {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
}

function generateResetToken() {
  return crypto.randomBytes(20).toString('hex');;
}



app.listen(4000)