require('dotenv').config()

const express = require('express')
const cors = require('cors');
const multer = require('multer');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const app = express()
const jwt = require('jsonwebtoken')
const Razorpay=require('razorpay')
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

app.set("view engine","ejs")
app.use(express.urlencoded({extended:false}))
app.use(cors(corsOptions));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000'); 
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.use(cookieParser());
app.use(express.json())
app.use(helmet());
app.use(bodyParser.json());



const { UserModel , ProductModel, CartModel, OrderModel, ReviewModel, FavoriteModel, CarouselModel,} = require('./db');
const { error } = require('console');

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

    const { id,email, username,address,role,phone } = req.user;
console.log("Address:"+address)
    

    res.json({ id,email, username, address,role,phone });
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

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const existingUser = await UserModel.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email is already registered' });
      }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const role="User"

      const newUser = new UserModel({
        username,
        email,
        password: hashedPassword,
        phoneNumber,
        address,
        role
      });

      await newUser.save(); 

      res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Registration failed' });
    }
  }
);

app.post(
  '/adminRegister',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
  ],
  async (req, res) => {
    try {
      const { email, password} = req.body;

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const existingUser = await UserModel.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email is already registered' });
      }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const role="Admin"

      const username='Admin';
      const phoneNumber="Admin"
      const address="Admin"


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
      const payload = {id:user._id, email: user.email, phone: user.phoneNumber, username: user.username, address:user.address, role:user.role };

      const accessToken = generateAccessToken(payload);
      res.json({ accessToken:accessToken });
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

    const payload = {id:user._id, email: user.email, phone: user.phoneNumber, username: user.username, address:user.address, role:user.role };
    const accessToken = generateAccessToken(payload);

   
    const refreshToken = generateRefreshToken(payload);
   
    user.refreshToken = refreshToken;

    await user.save();
    res.json({ accessToken, refreshToken });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Login failed' });
  }
});

app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;


  try {
    
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const secret=process.env.JWT_SECRET+user.password
    const resetToken=jwt.sign({email:user.email,id:user._id},secret,{expiresIn:"5m"})
    const link=`http://localhost:4000/reset-password/${user._id}/${resetToken}`
    console.log(link)


    
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      service: 'gmail', 
      auth: {
        user: "ong112345678@gmail.com",
        pass: "rbtrlmadkhmbahmg",
      },
    });

    const mailOptions = {
      from: "p20012449@student.newinti.edu.my",
      to: email,
      subject: 'Password Reset Request',
      text: `Click the following link to reset your password: ${link}`,
    };

    transporter.sendMail(mailOptions, function(error,info) {
      if (error) {
        console.error('Error sending email:', error);
      }
      else{
        console.log('Email sent: ' + info.response);
      }

    });
  res.status(200).json({ message: 'Password reset email sent.' });
  } catch (error) {
    console.error('Password reset request failed:', error);
    res.status(500).json({ message: 'Password reset request failed. Please try again.' });
  }
});

app.post('/sendInvoice', async (req, res) => {
  try {
    const { recipientEmail, subject, text, html } = req.body;

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      service: 'gmail', 
      auth: {
        user: "ong112345678@gmail.com",
        pass: "rbtrlmadkhmbahmg",
      },
    });
    
    const mailOptions = {
      from: 'your-email@gmail.com',
      to: recipientEmail,
      subject: subject,
      text: text,
      html: html, // HTML content for the email
    };

   
    transporter.sendMail(mailOptions, function(error,info) {
      if (error) {
        console.error('Error sending email:', error);
      }
      else{
        console.log('Email sent: ' + info.response);
      }

    });

    res.status(200).json({ message: 'Email sent successfully!' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});


app.get('/reset-password/:id/:token', async (req, res) => {
  const { id,token } = req.params;

  const user = await UserModel.findOne({ _id:id });
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }
  const secret=process.env.JWT_SECRET+user.password
  try{
const verify =jwt.verify(token,secret)
res.render("index",{email:verify.email})
  }catch(error){
    console.log(error)
res.send("Not verified")
  }
});

app.post('/reset-password/:id/:token', async (req, res) => {
  const { id,token } = req.params;
  const { password } = req.body;

  const user = await UserModel.findOne({ _id:id });
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }
  const secret=process.env.JWT_SECRET+user.password
  try{
const verify =jwt.verify(token,secret)
if (!password || password.length < 7) {
  return res.status(400).json({ message: 'Password must be at least 7 characters long.' });
}
const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      await UserModel.updateOne({
        _id:id
      },
      {$set:{
        password:hashedPassword,
      },})
res.json("Password updated")
  }catch(error){
    console.log(error)
res.send("Something went wrong")
  }
});

// Create a new product
app.post('/products', upload.single('image'), async (req, res) => {
  try {
    console.log('Uploaded file:', req.file);
    const file_name = req.file.filename;
    const { name, price, description, category, attributes , quantity} = req.body;

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


app.get('/products', async (req, res) => {
try {
  const products = await ProductModel.find();
  res.json(products);
} catch (error) {
  console.error(error);
  res.status(500).json({ message: 'Failed to fetch products' });
}
});


app.get('/orders', async (req, res) => {
  try {
    const orders = await OrderModel.find();

    // Calculate total sales and total orders
    const totalSales = orders.reduce((total, order) => total + order.total, 0);
    const totalOrders = orders.length;

    // Respond with the total sales and total orders
    res.json({ totalSales, totalOrders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch orders' });
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

app.delete('/products/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await ProductModel.findById(productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const usersWithProductInCart = await CartModel.find({ 'items.product': productId });
    const usersWithProductInOrders = await OrderModel.find({ 'items.product': productId });

    if (usersWithProductInCart.length > 0 || usersWithProductInOrders.length > 0) {
      product.available = false;
      await product.save();
      
    for (const cart of usersWithProductInCart) {
      // Remove the product from the cart and add it to the itemsUnavailable array
      cart.items = cart.items.filter(item => item.product.toString() !== productId);
      cart.itemsUnavailable.push(productId);
      await cart.save();
    }
    } else {
      await product.deleteOne;
    }


    res.json({ message: 'Product deletion and status update complete' });
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
        existingItem.quantity += parsedQuantity;
      } else {
        userCart.items.push({ product: productId, quantity: parsedQuantity, attribute:attribute });
      }
    }

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

    let userCart = await CartModel.findOne({ user: userId });

    if (!userCart) {
      userCart = new CartModel({
        user: userId,
        items: [{ product: productId, quantity: parsedQuantity, attribute:attribute }],
      });
    } else {
      const existingItem = userCart.items.find((item) => item.product === productId);

      if (existingItem) {
        existingItem.quantity = parsedQuantity;
        existingItem.attribute=attribute;
      } else {
        userCart.items.push({ product: productId, quantity: parsedQuantity , attribute:attribute});
      }
    }

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

app.post('/remove-from-cart',authenticateToken, async (req, res) => {
  const { productId, attribute } = req.body;
  const userId = req.user.id;


  try {
   
    const userCart = await CartModel.findOne({ user: userId });

    if (!userCart) {
      return res.status(404).json({ error: 'User cart not found' });
    }

    const itemIndex = userCart.items.findIndex((item) => {
      return item.product === productId && item.attribute === attribute;
    });

    if (itemIndex !== -1) {
      userCart.items.splice(itemIndex, 1);

      await userCart.save();

      return res.status(200).json({ message: 'Item removed from the cart' });
    } else {
      return res.status(404).json({ error: 'Item not found in the cart' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/order', async (req, res) => {
  try {
    const { user, items, shippingAddress, total, isGuest, paypalOrderID } = req.body;
    console.log('user:'+user+'\nitems:'+items+'\nshippingAddress:'+shippingAddress+'\ntotal:'+total)


    const order = new OrderModel({
      user: user,
      items:items.map(item => ({ ...item, isReviewed: false })), 
      total:total,
      shippingAddress:shippingAddress,
      isGuest:isGuest,
      paypalOrderID:paypalOrderID
    });

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

    const savedOrder = await order.save();

    res.json(savedOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

app.post('/verify',async (req,res)=>{
  try{
    const {razorpay_order_id,razorpay_payment_id, razorpay_signature}=req.body
    const sign=razorpay_order_id+"|"+razorpay_payment_id
    const expectedSign=crypto.createHmac("sha256",process.env.RAZORPAY_SECRET).update(sign.toString()).digest("hex")

    if(razorpay_signature===expectedSign){
      res.status(200).json({ message: 'Payment verified' });
    }else{
      res.status(400).json({ message: 'Payment not verified' });
    }


  }catch(error){
console.log(error)
res.status(500).json({ error: 'internal server error' });
  }
  

});

app.post('/clear-cart', authenticateToken, async (req, res) => {
  try {
   
    const user = req.user; 
    await CartModel.deleteMany({ user: user.id }); 

    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

app.get('/reviews/:productId', async (req, res) => {
  try {
    const productId = req.params.productId;
    const reviews = await ReviewModel.find({ product: productId });

    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Error fetching reviews' });
  }
});

app.get('/uniqueProductNames', async (req, res) => {
  try {
   
    const orderProductIds = await OrderModel.distinct('items.product');

    const uniqueProductNames = await ProductModel.find({
      _id: { $in: orderProductIds },
    }).distinct('name');

    res.json(uniqueProductNames);
  } catch (error) {
    console.error('Error fetching unique product names:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Check if a user has purchased a specific product
app.get('/check-purchase/:id', authenticateToken,async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.user.id; 

    const hasPurchased = await OrderModel.exists({
      user: userId,
      'items.product': productId,
    });

    res.json({ hasPurchased });
  } catch (error) {
    console.error('Error checking purchase:', error);
    res.status(500).json({ error: 'Error checking purchase' });
  }
});

// Post a product review
app.post('/post-review', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id; 
    const { productId, comment } = req.body; 
    console.log("UserID:"+userId+'\nProductId:'+productId+"\ncomment:"+comment)

   

    const review = new ReviewModel({
      user: userId,
      product: productId,
      comment: comment,
    });

    await review.save();

    res.json({ message: 'Review posted successfully' });
  } catch (error) {
    console.error('Error posting review:', error);
    res.status(500).json({ error: 'Error posting review' });
  }
});

app.get('/orders/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    const orders = await OrderModel.find({ user: userId });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/productSales', async (req, res) => {
  try {
    const productSales = await OrderModel.aggregate([
      {
        $unwind: '$items', // Split order items into separate documents
      },
      {
        $group: {
          _id: '$items.product', // Group by product
          quantitySold: { $sum: '$items.quantity' }, // Calculate total quantity sold
        },
      },
    ]);

    const productInfoPromises = productSales.map(async (sale) => {
      const product = await ProductModel.findById(sale._id);
      if (product) {
        sale.productName = product.name;
        delete sale._id; 
      }
      return sale;
    });

    const productSalesWithNames = await Promise.all(productInfoPromises);

    res.json(productSalesWithNames);
    
    console.log(productSalesWithNames);
  } catch (error) {
    console.error('Error fetching product sales:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/productYearlySales', async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();

    const yearlyProductSales = await OrderModel.aggregate([
      {
        $match: {
          'orderDate': {
            $gte: new Date(currentYear, 0, 1,0,0,0), // Start of the current year
            $lte: new Date(currentYear, 11, 31, 23, 59, 59), // End of the current year
          },
        },
      },
      {
        $unwind: '$items',
      },
      {
        $group: {
          _id: '$items.product',
          quantitySold: { $sum: '$items.quantity' },
        },
      },
    ]);

      const productInfoPromises = yearlyProductSales.map(async (sale) => {
      const product = await ProductModel.findById(sale._id);
      if (product) {
        sale.productName = product.name;
        delete sale._id; 
      }
      return sale;
    });

    const productSalesWithNames = await Promise.all(productInfoPromises);

    res.json(productSalesWithNames);
  } catch (error) {
    console.error('Error fetching yearly product sales:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Monthly Sales
app.get('/productMonthlySales', async (req, res) => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const monthlyProductSales = await OrderModel.aggregate([
      {
        $match: {
          'orderDate': {
            $gte: new Date(currentYear, currentMonth, 1,0,0,0), // Start of the current month
            $lte: new Date(currentYear, currentMonth + 1, 0, 23, 59, 59), // End of the current month
          },
        },
      },
      {
        $unwind: '$items',
      },
      {
        $group: {
          _id: '$items.product',
          quantitySold: { $sum: '$items.quantity' },
        },
      },
    ]);

    const productInfoPromises = monthlyProductSales.map(async (sale) => {
      const product = await ProductModel.findById(sale._id);
      if (product) {
        sale.productName = product.name;
        delete sale._id; 
      }
      return sale;
    });

    const productSalesWithNames = await Promise.all(productInfoPromises);

    res.json(productSalesWithNames);
  } catch (error) {
    console.error('Error fetching monthly product sales:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Daily Sales
app.get('/productDailySales', async (req, res) => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();

    const dailyProductSales = await OrderModel.aggregate([
      {
        $match: {
          'orderDate': {
            $gte: new Date(currentYear, currentMonth, currentDay,0,0,0), // Start of the current day
            $lte: new Date(currentYear, currentMonth, currentDay, 23, 59, 59), // End of the current day
          },
        },
      },
      {
        $unwind: '$items',
      },
      {
        $group: {
          _id: '$items.product',
          quantitySold: { $sum: '$items.quantity' },
        },
      },
    ]);

    const productInfoPromises = dailyProductSales.map(async (sale) => {
      const product = await ProductModel.findById(sale._id);
      if (product) {
        sale.productName = product.name;
        delete sale._id; 
      }
      return sale;
    });

    const productSalesWithNames = await Promise.all(productInfoPromises);

    res.json(productSalesWithNames);
  } catch (error) {
    console.error('Error fetching daily product sales:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/getProductIdByName/:name', async (req, res) => {
  const productName = req.params.name; 

  try {
    const product = await ProductModel.findOne({ name: productName });

    if (product) {
      res.json({ productId: product._id });
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    console.error('Error fetching product by name:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/most-popular-product', async (req, res) => {
  try {
    const orders = await OrderModel.find();
    
    const productCountMap = new Map();

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const productId = item.product.toString();
        if (productCountMap.has(productId)) {
          productCountMap.set(productId, productCountMap.get(productId) + item.quantity);
        } else {
          productCountMap.set(productId, item.quantity);
        }
      });
    });

    let mostPopularProductId = null;
    let mostPopularProductCount = 0;

    for (const [productId, count] of productCountMap) {
      if (count > mostPopularProductCount) {
        mostPopularProductId = productId;
        mostPopularProductCount = count;
      }
    }

    if (!mostPopularProductId) {
      return res.status(404).json({ message: 'No popular product found' });
    }

    const mostPopularProduct = await ProductModel.findById(mostPopularProductId);
    
    res.json(mostPopularProduct);
  } catch (error) {
    console.error('Error fetching most popular product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/suggested-product', async (req, res) => {
  try {
    const orders = await OrderModel.find();
    
    const productCountMap = new Map();

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const productId = item.product.toString();
        if (productCountMap.has(productId)) {
          productCountMap.set(productId, productCountMap.get(productId) + item.quantity);
        } else {
          productCountMap.set(productId, item.quantity);
        }
      });
    });

    const productsWithNoPurchases = [];
    const allProducts = await ProductModel.find();

    allProducts.forEach((product) => {
      const productId = product._id.toString();
      if (!productCountMap.has(productId) && product.available) {
        productsWithNoPurchases.push(product);
      }
    });

    if (productsWithNoPurchases.length > 0) {
      const randomProductIndex = Math.floor(Math.random() * productsWithNoPurchases.length);
      const suggestedProduct = productsWithNoPurchases[randomProductIndex];
      return res.json(suggestedProduct);
    } else {
      const availableProducts = allProducts.filter(product => product.available);
      if (availableProducts.length > 0) {
        const randomProductIndex = Math.floor(Math.random() * availableProducts.length);
        const suggestedProduct = availableProducts[randomProductIndex];
        return res.json(suggestedProduct);
      } else {
        return res.json({});
      }
    }
  } catch (error) {
    console.error('Error fetching suggested product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/top-rated-product', async (req, res) => {
  try {
    const products = await ProductModel.find();

    let topRatedProduct = null;
    let topRating = -1;

    for (const product of products) {
      const productId = product._id.toString();

      const reviews = await ReviewModel.find({ product: productId });

      if (reviews.length > 0) {
        const commentsArray = reviews.map((review) => review.comment);
        
        const requestBody = {
          reviews: commentsArray,
        };

        const sentimentResponse = await fetch('http://127.0.0.1:5000/predict_sentiments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        const sentimentData = await sentimentResponse.json();

        const positiveSentiments = sentimentData.positive;

        if (positiveSentiments > topRating) {
          topRatedProduct = product;
          topRating = positiveSentiments;
        }
      }
    }

    if (!topRatedProduct) {
      return res.status(404).json({ message: 'No top-rated product found' });
    }

    res.json(topRatedProduct);
  } catch (error) {
    console.error('Error fetching top-rated product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.post('/add-to-favorites', authenticateToken, async (req, res) => {
 
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { productId } = req.body;
  const userId = req.user.id;

  const favorite = new FavoriteModel({
    user: userId,
    product: productId,
  });
  await favorite.save();

  return res.status(200).json({ message: 'Added to favorites successfully' });
});

app.get('/favorites', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.id;
    const userFavorites = await FavoriteModel.find({ user: userId });

    const productIds = userFavorites.map((favorite) => favorite.product);

    const favoriteProducts = await ProductModel.find({ _id: { $in: productIds } });

    res.status(200).json(favoriteProducts);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/remove-favorite/:productId', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { productId } = req.params;
    const userId = req.user.id;

    const favorite = await FavoriteModel.findOne({ user: userId, product: productId });

    if (!favorite) {
      return res.status(404).json({ error: 'Favorite not found' });
    }

    await favorite.deleteOne();

    res.status(200).json({ message: 'Removed from favorites successfully' });
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.put('/update-orders/:orderId', async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const newStatus = req.body.newStatus;

    const order = await OrderModel.findByIdAndUpdate(orderId, { status: newStatus }, { new: true });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.json({ message: 'Order status updated successfully', order });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/all-orders', async (req, res) => {
  try {
    const orders = await OrderModel.find().lean();
    const userPromises = orders.map(async (order) => {
      const user = await UserModel.findById(order.user, 'username phoneNumber');
      if (user) {
        order.user = user; 
      }
      return order;
    });

    const ordersWithUsers = await Promise.all(userPromises);
    res.json(ordersWithUsers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
  });

  app.put('/update-review-status/:orderId/:productId', async (req, res) => {
    try {
      const orderId = req.params.orderId;
      const productId = req.params.productId;
      const { isReviewed } = req.body;
  
      const order = await OrderModel.findById(orderId);
  
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
  
      const itemToUpdate = order.items.find(item => item.product === productId);
  
      if (!itemToUpdate) {
        return res.status(404).json({ error: 'Item not found in the order' });
      }
  
      itemToUpdate.isReviewed = isReviewed;
  
      await order.save();
  
      return res.json({ message: 'Review status updated successfully' });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
  
app.patch('/update-profile', authenticateToken, async (req, res) => {
  const userId = req.user.id; 
  const { username, address, phone } = req.body;

  try {
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { username, address, phone },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const payload = {id:user._id, email: user.email, phone: user.phoneNumber, username: user.username, address:user.address, role:user.role };
    const accessToken = generateAccessToken(payload);

   
    const refreshToken = generateRefreshToken(payload);
   
    user.refreshToken = refreshToken;
    
    await user.save();
    res.json({ accessToken, refreshToken });

  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/getCarousel', async (req, res) => {
  
 const carousel= await CarouselModel.find()
   
      res.json(carousel);
    
});

app.post('/addCarousel', async (req, res) => {
  const { imageUrl, caption } = req.body;

  try {
    const item = new CarouselModel({ imageUrl, caption });
    await item.save();
    res.json('Carousel item added');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error adding a new carousel item');
  }
});

app.put('/updateCarousel/:id', async (req, res) => {
  const { id } = req.params;
  const { imageUrl, caption } = req.body;

  try {
    await CarouselModel.findByIdAndUpdate(id, { imageUrl, caption });
    res.json('Carousel item updated');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating the carousel item');
  }
});

app.delete('/deleteCarousel/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await CarouselModel.findByIdAndRemove(id);
    res.json('Carousel item deleted');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting the carousel item');
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