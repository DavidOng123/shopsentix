require('dotenv').config(); 

const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  refreshToken: {
    type: String, 
  },
  resetToken: {
    type:String,
  },
  resetTokenExpiration:{
    type:Date,
  } ,
  role:{
    type:String,
    required:true
  }
});

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  description: String,
  category: String,
  attributes: [String],
  file_name: String, 
  quantity:Number,
  available: { type: Boolean, default: true },
});

const cartItemSchema = new mongoose.Schema({
  product: String,
  quantity: Number,
  attribute:String
});

const cartSchema = new mongoose.Schema({
  user: String,
  items: [cartItemSchema], // An array of cart items
  itemsUnavailable: [String],
});

const orderSchema = new mongoose.Schema({
  user: String,
  items: [cartItemSchema], 
  total: {
    type: Number,
    required: true,
  },
  orderDate: {
    type: Date,
    default: Date.now, // Default to the current date and time
  },
  shippingAddress: {
    type: String,
    required: true,
  },
  isGuest: {
    type: Boolean,
    default: false, // By default, the user is not a guest
  },
  razorpayOrderID:{
    type:String
  }
});

const reviewSchema = new mongoose.Schema({
  product: String, 
  user: String, 
  comment: String,
});

const favoriteSchema = new mongoose.Schema({
  user: String,
  product: String
});

const CartModel = mongoose.model('Cart', cartSchema);
const UserModel = mongoose.model('User', userSchema);
const ProductModel = mongoose.model('Product', productSchema);
const OrderModel = mongoose.model('Order', orderSchema);
const ReviewModel=mongoose.model('Review', reviewSchema)
const FavoriteModel=mongoose.model('Favorite', favoriteSchema)


module.exports = {
  UserModel,
  ProductModel,
  CartModel,
  OrderModel,
  ReviewModel,
  FavoriteModel
};
