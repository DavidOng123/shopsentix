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

const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true, 
};

app.use(cors(corsOptions));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Add CORS headers to allow cross-origin requests
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000'); // Replace with the URL of your frontend
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.use(cookieParser());
app.use(express.json())
app.use(helmet());
app.use(bodyParser.json());



const { UserModel , ProductModel, CartModel, OrderModel} = require('./db');

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

app.get('/user-details', authenticateToken, (req, res) => {
  try {
    const { id,email, username,address,role } = req.user;

    

    res.json({ id,email, username, address,role });
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
      const role="User"

      // Create a new user
      const newUser = new UserModel({
        username,
        email,
        password: hashedPassword,
        phoneNumber,
        address,
        role
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
    
      const accessToken = generateAccessToken({ id:user._id,email: user.email, username: user.username, role:user.role });
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

    const payload = {id:user._id, email: user.email, username: user.username, address:user.address, role:user.role };
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
    const { name, price, description, category, attributes , quantity} = req.body;

    // Parse the attributes value from JSON string to an array
    const parsedAttributes = JSON.parse(attributes);

    const newProduct = new ProductModel({
      name:name,
      price:price,
      description:description,
      category:category,
      attributes: parsedAttributes, // Store as an array
      file_name:file_name,
      quantity:quantity
    });
    console.log('new product:'+newProduct)
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

app.post('/products/:productId', async (req, res) => {
  const productId = req.params.productId;
  const {
    name,
    price,
    description,
    category,
    attributes,
    quantity
  } = req.body;

  // Find the product by ID (replace this with your database query)
  try {
    const productToUpdate = await ProductModel.findOne({ _id: productId });
    
    if (!productToUpdate) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Update the product data
    productToUpdate.name = name;
    productToUpdate.price = price;
    productToUpdate.description = description;
    productToUpdate.category = category;
    productToUpdate.attributes = attributes;
    productToUpdate.quantity = quantity;

    await productToUpdate.save(); // Save the changes to the database

    return res.json({ message: 'Product updated successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'An error occurred while updating the product' });
  }
});



app.post('/updateQuantity', async (req, res) => {
try {
  const { productId, quantity} = req.body;

  const product = await ProductModel.findById(productId);

      if (!product) {
        return res.status(400).json({ error: 'Product not found' });
      }

      product.quantity += quantity;
      await product.save();


  res.json(product);
} catch (error) {
  console.error(error);
  res.status(500).json({ message: 'Failed to update the product' });
}
});

// Delete a product by ID
app.delete('/products/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    // Check if the product is in any user's cart
    const productInCarts = await CartModel.find({ products: productId });

    if (productInCarts && productInCarts.length > 0) {
      // The product is in users' carts, so ask for confirmation
      const confirmDeletion = req.query.confirmDeletion === 'true';

      if (!confirmDeletion) {
        // Return a message indicating that the product is in users' carts
        return res.status(400).json({ message: 'Product is in users\' carts. Confirm deletion if necessary.' });
      }
    }

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


app.post('/add-to-cart', authenticateToken, async (req, res) => {
  try {
    const { productId, quantity, attribute } = req.body;
    const userId = req.user.id;
    const parsedQuantity = parseInt(quantity);
    

    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return res.status(400).json({ message: 'Invalid quantity' });
    }
    console.log('server Body:', JSON.stringify({
      productId: productId,
      quantity: quantity,
      attribute: attribute,
    }));
    
    // Check if the user already has a cart
    let userCart = await CartModel.findOne({ user: userId });

    if (!userCart) {
      // If the user doesn't have a cart, create a new one
      userCart = new CartModel({
        user: userId,
        items: [{ product: productId, quantity: parsedQuantity, attribute: attribute }],
      });
    } else {
      // If the user already has a cart, add the item or update its quantity
      const existingItem = userCart.items.find((item) => item.product === productId);

      if (existingItem) {
        // Update the quantity if the product is already in the cart
        existingItem.quantity += parsedQuantity;
      } else {
        // Add the product to the cart if it's not already there
        userCart.items.push({ product: productId, quantity: parsedQuantity, attribute:attribute });
      }
    }

    // Save the cart to the database
    await userCart.save();

    res.status(200).json({ message: 'Product added to the cart' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to add the product to the cart' });
  }
});

app.post('/update-cart', authenticateToken, async (req, res) => {
  try {
    const { productId, quantity, attribute } = req.body;
    const userId = req.user.id;
    const parsedQuantity = parseInt(quantity);

    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return res.status(400).json({ message: 'Invalid quantity' });
    }

    // Check if the user already has a cart
    let userCart = await CartModel.findOne({ user: userId });

    if (!userCart) {
      // If the user doesn't have a cart, create a new one
      userCart = new CartModel({
        user: userId,
        items: [{ product: productId, quantity: parsedQuantity, attribute:attribute }],
      });
    } else {
      // If the user already has a cart, add the item or update its quantity
      const existingItem = userCart.items.find((item) => item.product === productId);

      if (existingItem) {
        // Update the quantity if the product is already in the cart
        existingItem.quantity = parsedQuantity;
        existingItem.attribute=attribute;
      } else {
        // Add the product to the cart if it's not already there
        userCart.items.push({ product: productId, quantity: parsedQuantity , attribute:attribute});
      }
    }

    // Save the cart to the database
    await userCart.save();

    res.status(200).json({ message: 'Product added to the cart' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to add the product to the cart' });
  }
});

app.get('/get-cart', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const userCart = await CartModel.findOne({ user: userId }).populate('items.product');

    res.json(userCart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/order', async (req, res) => {
  try {
    const { user, items, shippingAddress, total } = req.body;
    console.log('user:'+user+'\nitems:'+items+'\nshippingAddress:'+shippingAddress+'\ntotal:'+total)
    
    

    // Create the order
    const order = new OrderModel({
      user: user, // Assuming user is already authenticated and you have the user ID available
      items:items,
      total:total,
      shippingAddress:shippingAddress,
    });

    // Deduct product quantities from the inventory
    for (const item of items) {
      const product = await ProductModel.findById(item.product);

      if (!product) {
        return res.status(400).json({ error: 'Product not found' });
      }

      if (product.quantity < item.quantity) {
        return res.status(400).json({ error: 'Not enough product in stock' });
      }

      product.quantity -= item.quantity;
      await product.save();
    }

    // Save the order
    const savedOrder = await order.save();

    res.json(savedOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

app.post('/clear-cart', authenticateToken, async (req, res) => {
  try {
   
    const user = req.user; // Assuming that the authenticated user's information is stored in req.user
    await CartModel.deleteMany({ user: user.id }); // Clear all cart items for the user

    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});



function generateAccessToken(payload) {
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30m' });
}

function generateRefreshToken(payload) {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
}

function generateResetToken() {
  return crypto.randomBytes(20).toString('hex');;
}



app.listen(4000)