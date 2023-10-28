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



const { UserModel , ProductModel, CartModel, OrderModel, ReviewModel, FavoriteModel} = require('./db');
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

    res.cookie('access_token', accessToken, { httpOnly: true });
    res.cookie('refresh_token', refreshToken, { httpOnly: true });
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

    // Step 1: Find the product
    const product = await ProductModel.findById(productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Step 2: Check if the product exists in user carts and orders
    const usersWithProductInCart = await CartModel.find({ 'items.product': productId });
    const usersWithProductInOrders = await OrderModel.find({ 'items.product': productId });

    // Step 3: If the product exists in either cart or orders, mark it as unavailable
    if (usersWithProductInCart.length > 0 || usersWithProductInOrders.length > 0) {
      product.available = false;
      await product.save();
      
    // Step 5: Update user carts
    for (const cart of usersWithProductInCart) {
      // Remove the product from the cart and add it to the itemsUnavailable array
      cart.items = cart.items.filter(item => item.product.toString() !== productId);
      cart.itemsUnavailable.push(productId);
      await cart.save();
    }
    } else {
      // Step 4: If the product doesn't exist in both cart and orders, delete it
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

      // Save the updated user cart
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
    const { user, items, shippingAddress, total, isGuest } = req.body;
    console.log('user:'+user+'\nitems:'+items+'\nshippingAddress:'+shippingAddress+'\ntotal:'+total)
    
    const instance=new Razorpay({
      key_id:process.env.RAZORPAY_KEY_ID,
      key_secret:process.env.RAZORPAY_SECRET
    })

    const options={
      amount:total,
      currency:"MYR",
      receipt:crypto.randomBytes(10).toString("hex")
    }

    instance.orders.create(options,(error,order)=>{
      if(error){
        console.log(error)

      }
      console.log("Razor:"+JSON.stringify(order))
    })

    const order = new OrderModel({
      user: user, // Assuming user is already authenticated and you have the user ID available
      items:items.map(item => ({ ...item, isReviewed: false })), 
      total:total,
      shippingAddress:shippingAddress,
      isGuest:isGuest,
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
    // Retrieve unique product IDs from the Order table
    const orderProductIds = await OrderModel.distinct('items.product');

    // Fetch product names based on the unique product IDs
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
    const productId = req.params.id; // Product ID to check
    const userId = req.user.id; // Assuming user is authenticated and user ID is available

    // Check if the user has purchased the product
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
    const userId = req.user.id; // Assuming user is authenticated and user ID is available
    const { productId, comment } = req.body; // Product ID and review comment
    console.log("UserID:"+userId+'\nProductId:'+productId+"\ncomment:"+comment)

   

    // Create a new review
    const review = new ReviewModel({
      user: userId,
      product: productId,
      comment: comment,
    });

    // Save the review to the database
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

    // Use Mongoose to find orders for the specified user
    const orders = await OrderModel.find({ user: userId });

    // Respond with the orders
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/productSales', async (req, res) => {
  try {
    // Aggregate the sales data
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

    // Map product _id to productName
    const productInfoPromises = productSales.map(async (sale) => {
      const product = await ProductModel.findById(sale._id);
      if (product) {
        sale.productName = product.name;
        delete sale._id; // Remove the _id field
      }
      return sale;
    });

    // Wait for all product info requests to complete
    const productSalesWithNames = await Promise.all(productInfoPromises);

    // Respond with the product sales data including product names
    res.json(productSalesWithNames);
    
    console.log(productSalesWithNames);
  } catch (error) {
    console.error('Error fetching product sales:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/getProductIdByName/:name', async (req, res) => {
  const productName = req.params.name; // Get product name from query parameter

  try {
    const product = await ProductModel.findOne({ name: productName });

    if (product) {
      // If the product is found, return its ID
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
    
    // Create a map to count the number of purchases for each product
    const productCountMap = new Map();

    // Count the purchases for each product
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

    // Find the product with the most purchases
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
    
    // Create a map to count the number of purchases for each product
    const productCountMap = new Map();

    // Count the purchases for each product
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

    // Find the products that have no purchases and are available
    const productsWithNoPurchases = [];
    const allProducts = await ProductModel.find();

    allProducts.forEach((product) => {
      const productId = product._id.toString();
      if (!productCountMap.has(productId) && product.available) {
        productsWithNoPurchases.push(product);
      }
    });

    if (productsWithNoPurchases.length > 0) {
      // If there are available products with no purchases, suggest one randomly
      const randomProductIndex = Math.floor(Math.random() * productsWithNoPurchases.length);
      const suggestedProduct = productsWithNoPurchases[randomProductIndex];
      return res.json(suggestedProduct);
    } else {
      // If all available products have been purchased, return a random available product
      const availableProducts = allProducts.filter(product => product.available);
      if (availableProducts.length > 0) {
        const randomProductIndex = Math.floor(Math.random() * availableProducts.length);
        const suggestedProduct = availableProducts[randomProductIndex];
        return res.json(suggestedProduct);
      } else {
        // If there are no available products, return an empty response or an appropriate message
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
    // Fetch all products
    const products = await ProductModel.find();

    let topRatedProduct = null;
    let topRating = -1;

    for (const product of products) {
      const productId = product._id.toString();

      // Fetch reviews for the product
      const reviews = await ReviewModel.find({ product: productId });

      if (reviews.length > 0) {
        const commentsArray = reviews.map((review) => review.comment);
        
        // Perform sentiment analysis here and get the sentiment scores
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
    const orders = await OrderModel.find();
    res.json(orders);
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
  
      // Find the order by ID
      const order = await OrderModel.findById(orderId);
  
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
  
      // Find the item within the order's items array
      const itemToUpdate = order.items.find(item => item.product === productId);
  
      if (!itemToUpdate) {
        return res.status(404).json({ error: 'Item not found in the order' });
      }
  
      // Update the isReviewed property of the item
      itemToUpdate.isReviewed = isReviewed;
  
      // Save the updated order
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

    res.json(user);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Internal server error' });
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